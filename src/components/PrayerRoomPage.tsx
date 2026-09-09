import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Mic, MicOff, Send, Sparkles, Heart, Flame, 
  Share2, ArrowLeft, Shield, Users, Radio, MessageSquare, AlertCircle, 
  CheckCircle, Settings, Music, Crown, MoreVertical, UserPlus, UserX,
  PhoneCall, PhoneOff
} from 'lucide-react';
import { prayerRoomStore, type PrayerMessage, type PrayerRoomState, type CallParticipant, type ReactionEvent } from '@/data/prayerRoomStore';
import { api } from '@/utils/api';

interface PrayerRoomPageProps {
  onNavigate: (page: string) => void;
}

const AVATAR_COLORS = [
  'from-amber-500 to-amber-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600'
];

export default function PrayerRoomPage({ onNavigate }: PrayerRoomPageProps) {
  // Current User Identity
  const [userId] = useState(() => {
    let stored = localStorage.getItem('jg_prayer_user_id');
    if (!stored) {
      stored = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('jg_prayer_user_id', stored);
    }
    return stored;
  });

  const [userName, setUserName] = useState(() => localStorage.getItem('jg_prayer_user_name') || '');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(() => !localStorage.getItem('jg_prayer_user_name'));
  const [nameInput, setNameInput] = useState(() => localStorage.getItem('jg_prayer_user_name') || '');
  const [userRole, setUserRole] = useState<'host' | 'admin' | 'intercessor'>('intercessor');

  // Call & Roster State
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInCall, setIsInCall] = useState(true);
  const [selectedParticipantMenu, setSelectedParticipantMenu] = useState<string | null>(null);

  // Room State
  const [roomState, setRoomState] = useState<PrayerRoomState>({
    current_topic: '24/7 Global Prayer Altar',
    scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
    is_live: true,
    background_audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-peace-112191.mp3',
    active_speakers: []
  });

  // Chat & Reactions
  const [messages, setMessages] = useState<PrayerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Audio & Hardware Refs
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Prayer Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Host Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editTopic, setEditTopic] = useState('');
  const [editScripture, setEditScripture] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');

  // Check if authenticated site admin
  useEffect(() => {
    const isSiteAdmin = api.isAuthenticated() && (api.getRole() === 'admin' || api.getRole() === 'superadmin');
    if (isSiteAdmin) {
      setUserRole('host');
    }
  }, []);

  // Determine if current user can moderate (Host or Admin)
  const canModerate = userRole === 'host' || userRole === 'admin';

  // Fetch initial room state & messages
  useEffect(() => {
    prayerRoomStore.getState().then(res => {
      setRoomState(res.state);
      setEditTopic(res.state.current_topic);
      setEditScripture(res.state.scripture);
      setEditAudioUrl(res.state.background_audio_url || '');
    });

    prayerRoomStore.getMessages().then(msgs => {
      setMessages(msgs);
    });

    prayerRoomStore.getCallParticipants().then(pts => {
      setParticipants(pts);
    });

    // Subscribe to SSE stream for real-time sync
    const unsubscribe = prayerRoomStore.subscribeToEvents({
      onMessage: (msg) => {
        setMessages(prev => [...prev, msg]);
      },
      onReaction: (reaction) => {
        setReactions(prev => [...prev.slice(-15), reaction]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3200);
      },
      onStateUpdate: (updated) => {
        setRoomState(updated);
        setEditTopic(updated.current_topic);
        setEditScripture(updated.scripture);
        setEditAudioUrl(updated.background_audio_url || '');
      },
      onCallRoster: (roster) => {
        setParticipants(roster);
        // Sync our role if updated by another admin
        const me = roster.find(p => p.id === userId);
        if (me && me.role && userRole !== 'host') {
          setUserRole(me.role);
        }
      },
      onUserState: (data) => {
        setParticipants(prev => prev.map(p => {
          if (p.id === data.id) {
            return { ...p, isMuted: data.isMuted, isSpeaking: data.isSpeaking };
          }
          return p;
        }));
      },
      onForceMute: (targetId) => {
        if (targetId === userId) {
          handleForceMuted();
        }
      },
      onForceMuteAll: (exceptId) => {
        if (exceptId !== userId && userRole !== 'host') {
          handleForceMuted();
        }
      },
      onUserEjected: (targetId) => {
        if (targetId === userId) {
          setIsInCall(false);
          stopMic();
          alert('You have been removed from the prayer call.');
        }
      }
    });

    return () => {
      unsubscribe();
      stopMic();
      prayerRoomStore.leaveCall(userId);
    };
  }, [userId]);

  // Join call automatically when name is known
  useEffect(() => {
    if (userName && isInCall) {
      const colorIndex = Math.abs(userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
      prayerRoomStore.joinCall(userId, userName, userRole, AVATAR_COLORS[colorIndex]).then(roster => {
        if (roster && roster.length > 0) {
          setParticipants(roster);
        }
      });
    }
  }, [userName, isInCall, userRole]);

  // Handle Forced Mute from Admin
  const handleForceMuted = () => {
    stopMic();
    setIsMuted(true);
    setIsSpeaking(false);
    prayerRoomStore.updateMicState(userId, true, false);
    // Notification
    alert('A moderator has muted your microphone.');
  };

  // Start / Stop Microphone & Audio Level Analyser
  const toggleMic = async () => {
    if (!isInCall) {
      alert('Please join the call first.');
      return;
    }

    if (!isMuted) {
      // Muting
      stopMic();
      setIsMuted(true);
      setIsSpeaking(false);
      prayerRoomStore.updateMicState(userId, true, false);
    } else {
      // Unmuting
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        // Setup Web Audio Analyser for Speaking Detection
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsMuted(false);
        prayerRoomStore.updateMicState(userId, false, false);

        // Speaking Level Loop
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastSpeakingState = false;

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isNowSpeaking = average > 18; // Volume threshold

          if (isNowSpeaking !== lastSpeakingState) {
            lastSpeakingState = isNowSpeaking;
            setIsSpeaking(isNowSpeaking);
            prayerRoomStore.updateMicState(userId, false, isNowSpeaking);
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (err) {
        alert('Could not access your microphone. Please check your browser audio permissions.');
      }
    }
  };

  const stopMic = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Sanctuary Background Audio Player
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {});
    }
  };

  // Leave / Rejoin Call
  const toggleCallMembership = () => {
    if (isInCall) {
      stopMic();
      setIsMuted(true);
      setIsSpeaking(false);
      setIsInCall(false);
      prayerRoomStore.leaveCall(userId);
    } else {
      setIsInCall(true);
    }
  };

  // Admin Actions
  const handleAdminMute = async (targetId: string) => {
    setSelectedParticipantMenu(null);
    await prayerRoomStore.executeAdminAction('mute', targetId, undefined, userId);
  };

  const handleAdminMuteAll = async () => {
    if (confirm('Mute all intercessors in the call?')) {
      await prayerRoomStore.executeAdminAction('mute_all', undefined, undefined, userId);
    }
  };

  const handleAdminSetRole = async (targetId: string, role: 'host' | 'admin' | 'intercessor') => {
    setSelectedParticipantMenu(null);
    await prayerRoomStore.executeAdminAction('set_role', targetId, role, userId);
  };

  const handleAdminRemove = async (targetId: string) => {
    setSelectedParticipantMenu(null);
    if (confirm('Remove this participant from the call?')) {
      await prayerRoomStore.executeAdminAction('remove', targetId, undefined, userId);
    }
  };

  // Chat Submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    setNewMessage('');
    const sent = await prayerRoomStore.sendMessage(userName || 'Intercessor', text, 'message');
    if (sent) {
      setMessages(prev => [...prev, sent]);
    }
  };

  // Reaction Tap
  const triggerReaction = (type: 'amen' | 'fire' | 'praise' | 'love') => {
    prayerRoomStore.sendReaction(type, userName || 'Intercessor');
    const newReaction: ReactionEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      user_name: userName || 'Intercessor',
      xOffset: Math.floor(Math.random() * 80) + 10
    };
    setReactions(prev => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3200);
  };

  // Save Name
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const clean = nameInput.trim();
      setUserName(clean);
      localStorage.setItem('jg_prayer_user_name', clean);
      setIsNamePromptOpen(false);
    }
  };

  // Submit Prayer Request
  const handleSubmitPrayerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    await prayerRoomStore.submitPrayerRequest(userName || 'Believer', requestText, isAnonymous);
    const author = isAnonymous ? 'A Believer' : (userName || 'Believer');
    await prayerRoomStore.sendMessage(author, `[Prayer Request]: ${requestText.trim()}`, 'prayer_request');

    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setIsRequestModalOpen(false);
      setRequestText('');
    }, 1800);
  };

  // Admin Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await prayerRoomStore.updateState({
      current_topic: editTopic,
      scripture: editScripture,
      background_audio_url: editAudioUrl
    });
    if (updated) {
      setRoomState(prev => ({
        ...prev,
        current_topic: editTopic,
        scripture: editScripture,
        background_audio_url: editAudioUrl
      }));
      setIsSettingsOpen(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Joshua's Generation 24/7 Prayer Call",
        text: `Join the live interactive prayer call: ${roomState.current_topic}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Prayer room link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 flex flex-col relative overflow-x-hidden font-sans">
      {/* Background Sanctuary Soaking Audio */}
      <audio
        ref={audioRef}
        src={roomState.background_audio_url || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-peace-112191.mp3'}
        loop
        preload="auto"
      />

      {/* Floating Reactions Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map(r => (
          <div
            key={r.id}
            className="absolute bottom-24 transition-all duration-3000 ease-out animate-float-up flex flex-col items-center"
            style={{ left: `${r.xOffset}%` }}
          >
            <span className="text-3xl filter drop-shadow-[0_4px_10px_rgba(217,119,6,0.3)]">
              {r.type === 'amen' && '🙏'}
              {r.type === 'fire' && '🔥'}
              {r.type === 'praise' && '🕊️'}
              {r.type === 'love' && '❤️'}
            </span>
            {r.user_name && (
              <span className="text-[11px] font-semibold text-slate-800 bg-white/95 px-2 py-0.5 rounded-full mt-1 border border-amber-200 shadow-sm">
                {r.user_name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Pristine Light Header */}
      <header className="border-b border-amber-100 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-amber-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Return to Main Website"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Main Website</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-sm flex items-center justify-center">
                <img
                  src="https://joshuasgeneration.com/favicon.png"
                  alt="Joshua's Generation Logo"
                  className="w-full h-full object-cover rounded-full bg-white"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold tracking-wide text-slate-900 uppercase flex items-center gap-1.5">
                  <span>Joshua's Generation</span>
                  <span className="text-amber-600 font-serif">Altar</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider">Group Call Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full text-xs text-amber-900 font-semibold shadow-2xs">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>{participants.length || 1}</span>
              <span className="hidden sm:inline text-amber-800">in Call</span>
            </div>

            <button
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Share Prayer Call Link"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline font-medium">Invite</span>
            </button>

            {canModerate && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                title="Moderator Controls"
              >
                <Settings className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Altar Settings</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Clean Golden Scripture Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border-b border-amber-200/70 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-amber-950 tracking-wide">
              {roomState.current_topic}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-700 font-serif italic">
            "{roomState.scripture}"
          </div>
        </div>
      </div>

      {/* Main Sanctuary Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-28">
        
        {/* Left / Center: Interactive Group Call Grid */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
          
          {/* Group Call Header Bar */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Interactive Prayer Room</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">
                    Voice Call
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Like WhatsApp/Telegram group call — unmute anytime to pray aloud with the brethren.
                </p>
              </div>
            </div>

            {/* Moderator Action: Mute All */}
            {canModerate && (
              <button
                onClick={handleAdminMuteAll}
                className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Silence all participants"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mute All</span>
              </button>
            )}
          </div>

          {/* Participants Call Grid (Like WhatsApp / Telegram Group Call) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {participants.map((p) => {
              const isMe = p.id === userId;
              const isThisSpeaking = isMe ? isSpeaking : p.isSpeaking;
              const isThisMuted = isMe ? isMuted : p.isMuted;
              const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

              return (
                <div
                  key={p.id}
                  className={`relative rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all duration-300 bg-white border ${
                    isThisSpeaking
                      ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400/40'
                      : 'border-slate-200/90 shadow-2xs hover:border-amber-300'
                  }`}
                >
                  {/* Speaking Indicator Glow */}
                  {isThisSpeaking && (
                    <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}

                  {/* Top Action / Moderator Dropdown Trigger */}
                  {canModerate && !isMe && (
                    <div className="absolute top-2 left-2">
                      <button
                        onClick={() => setSelectedParticipantMenu(selectedParticipantMenu === p.id ? null : p.id)}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Moderate Participant"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu for Admin */}
                      {selectedParticipantMenu === p.id && (
                        <div className="absolute left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-left text-xs">
                          <button
                            onClick={() => handleAdminMute(p.id)}
                            className="w-full px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer"
                          >
                            <MicOff className="w-3.5 h-3.5 text-red-500" />
                            <span>Mute Mic</span>
                          </button>
                          {p.role !== 'admin' && p.role !== 'host' && (
                            <button
                              onClick={() => handleAdminSetRole(p.id, 'admin')}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer"
                            >
                              <Shield className="w-3.5 h-3.5 text-amber-600" />
                              <span>Make Admin</span>
                            </button>
                          )}
                          {p.role === 'admin' && (
                            <button
                              onClick={() => handleAdminSetRole(p.id, 'intercessor')}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2 cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5 text-slate-500" />
                              <span>Remove Admin</span>
                            </button>
                          )}
                          <div className="h-px bg-slate-100 my-1" />
                          <button
                            onClick={() => handleAdminRemove(p.id)}
                            className="w-full px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Eject from Call</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avatar Circle with Sound Waves */}
                  <div className="relative my-2">
                    {/* Pulsing Ripple if Speaking */}
                    {isThisSpeaking && (
                      <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
                    )}

                    <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${p.avatarColor || 'from-amber-500 to-amber-600'} text-white font-bold text-lg flex items-center justify-center shadow-md`}>
                      {initials}
                    </div>

                    {/* Mic State Icon Badge */}
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow-xs ${
                      isThisMuted ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white animate-pulse'
                    }`}>
                      {isThisMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Name & Role Tag */}
                  <div className="mt-2 w-full">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {p.name} {isMe && <span className="text-amber-600 font-semibold">(You)</span>}
                    </p>
                    <div className="mt-0.5 flex items-center justify-center">
                      {p.role === 'host' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5" /> Host
                        </span>
                      ) : p.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-full">
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Intercessor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fast Prayer Actions & Tips */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Need prayer or intercession for your family, health, or breakthrough?</span>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              Submit Prayer Request
            </button>
          </div>
        </div>

        {/* Right Column: Live Chat & Intercessory Stream */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[560px] bg-white rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-100 bg-[#fdfcfb] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Live Prayer Chat
              </span>
            </div>
            <button
              onClick={() => setIsNamePromptOpen(true)}
              className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>{userName || 'Set Name'}</span>
              <span className="text-slate-400">(edit)</span>
            </button>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf9f6]/40 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                <Flame className="w-8 h-8 text-amber-500/40 mb-2 animate-pulse" />
                <p>The altar is live. Type an Amen or post a scripture to stand in agreement!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSystem = msg.type === 'announcement';
                const isPrayerRequest = msg.type === 'prayer_request';

                if (isSystem) {
                  return (
                    <div key={msg.id || idx} className="my-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-[11px] font-semibold text-amber-900">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                if (isPrayerRequest) {
                  return (
                    <div key={msg.id || idx} className="p-3 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          {msg.user_name}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium italic">{msg.message}</p>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || idx} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">
                        {msg.user_name}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-800 shadow-2xs">
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Taps */}
          <div className="px-3 py-2 border-t border-slate-100 bg-white flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tap:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerReaction('amen')}
                className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-xs border border-amber-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Tap Amen"
              >
                <span>🙏</span>
                <span className="text-[10px] font-bold text-amber-900">Amen</span>
              </button>
              <button
                onClick={() => triggerReaction('fire')}
                className="px-2.5 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-xs border border-orange-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Tap Fire"
              >
                <span>🔥</span>
                <span className="text-[10px] font-bold text-orange-900">Fire</span>
              </button>
              <button
                onClick={() => triggerReaction('praise')}
                className="px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-xs border border-blue-200 transition-all flex items-center gap-1 cursor-pointer"
                title="Tap Glory"
              >
                <span>🕊️</span>
                <span className="text-[10px] font-bold text-blue-900">Glory</span>
              </button>
            </div>
          </div>

          {/* Chat Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-[#fdfcfb] flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Write in the chat, ${userName || 'intercessor'}...`}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold transition-all cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Floating Bottom Group Call Control Dock (WhatsApp / Telegram Style) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
        <div className="bg-white/95 backdrop-blur-xl border border-amber-200/90 rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Main Microphone Button */}
          <button
            onClick={toggleMic}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
              !isMuted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {!isMuted ? (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Microphone Unmuted</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                <span>Tap to Unmute Mic</span>
              </>
            )}
          </button>

          {/* Sanctuary Audio Stream Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Toggle 24/7 Atmosphere Instrumentals"
          >
            {isPlayingAudio ? <Volume2 className="w-4 h-4 text-amber-700" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Atmosphere</span>
          </button>

          {/* Call Connection Toggle */}
          <button
            onClick={toggleCallMembership}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isInCall
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                : 'bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}
            title={isInCall ? 'Disconnect from Call' : 'Join Voice Call'}
          >
            {isInCall ? <PhoneOff className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            <span className="hidden sm:inline">{isInCall ? 'Leave' : 'Join'}</span>
          </button>
        </div>
      </div>

      {/* Name Input Prompt Modal */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Join the 24/7 Prayer Call
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your name so brethren can recognize you when you speak or pray:
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Pastor David, Sis. Faith, Emmanuel"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                autoFocus
                required
              />
              <div className="flex items-center justify-end gap-2">
                {userName && (
                  <button
                    type="button"
                    onClick={() => setIsNamePromptOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Enter Altar Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prayer Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Submit Prayer Request</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Our intercessors will stand in agreement with you right now before the Lord.
            </p>

            {requestSubmitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-slate-900">Prayer Request Received!</p>
                <p className="text-xs text-slate-500 mt-1">Standing in holy agreement with you in Jesus' name.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPrayerRequest} className="space-y-4">
                <textarea
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Describe your prayer need (healing, family, breakthrough, spiritual growth)..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon-light"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="anon-light" className="text-xs text-slate-600 cursor-pointer">
                    Keep request anonymous
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Send to Altar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Host Settings Modal */}
      {isSettingsOpen && canModerate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span>Altar Room Controls</span>
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Prayer Topic / Focus Banner
                </label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pinned Scripture of the Hour
                </label>
                <input
                  type="text"
                  value={editScripture}
                  onChange={(e) => setEditScripture(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  24/7 Background Atmosphere Soaking Stream URL
                </label>
                <input
                  type="url"
                  value={editAudioUrl}
                  onChange={(e) => setEditAudioUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Continuous instrumental or worship stream for ambient atmosphere.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                >
                  Save Altar Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
