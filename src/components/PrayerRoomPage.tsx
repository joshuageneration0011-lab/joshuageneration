import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Mic, MicOff, Hand, Send, Sparkles, Heart, Flame, 
  Share2, ArrowLeft, Shield, Users, Radio, MessageSquare, AlertCircle, 
  CheckCircle, Settings, Music, Eye
} from 'lucide-react';
import { prayerRoomStore, type PrayerMessage, type PrayerRoomState, type ReactionEvent } from '@/data/prayerRoomStore';
import { api } from '@/utils/api';

interface PrayerRoomPageProps {
  onNavigate: (page: string) => void;
}

export default function PrayerRoomPage({ onNavigate }: PrayerRoomPageProps) {
  // Room state
  const [roomState, setRoomState] = useState<PrayerRoomState>({
    current_topic: '24/7 Global Prayer Altar',
    scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
    is_live: true,
    background_audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-peace-112191.mp3',
    active_speakers: [
      { id: 'leader-1', name: 'Prayer Leader', role: 'Minister', isSpeaking: true }
    ]
  });

  const [activeCount, setActiveCount] = useState<number>(18);
  const [messages, setMessages] = useState<PrayerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState(() => localStorage.getItem('jg_prayer_user_name') || 'Believer');
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // Audio & Interaction state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);

  // Prayer Request Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Admin Host Modal
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editTopic, setEditTopic] = useState('');
  const [editScripture, setEditScripture] = useState('');
  const [editAudioUrl, setEditAudioUrl] = useState('');

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Check Admin Role
  useEffect(() => {
    setIsAdmin(api.isAuthenticated() && (api.getRole() === 'admin' || api.getRole() === 'superadmin'));
  }, []);

  // Fetch initial data & setup SSE subscription
  useEffect(() => {
    prayerRoomStore.getState().then(res => {
      setRoomState(res.state);
      setActiveCount(res.activeCount || 15);
      setEditTopic(res.state.current_topic);
      setEditScripture(res.state.scripture);
      setEditAudioUrl(res.state.background_audio_url || '');
    });

    prayerRoomStore.getMessages().then(msgs => {
      setMessages(msgs);
    });

    // Real-time Event Subscription (SSE)
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
      onStateUpdate: (updatedState) => {
        setRoomState(updatedState);
        setEditTopic(updatedState.current_topic);
        setEditScripture(updatedState.scripture);
        setEditAudioUrl(updatedState.background_audio_url || '');
      },
      onCountUpdate: (count) => {
        setActiveCount(count);
      }
    });

    return () => {
      unsubscribe();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Audio Play/Pause Handling
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.warn('Audio autoplay blocked or failed:', err);
      });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Mic toggle for minister/speaker
  const toggleMic = async () => {
    if (isMicActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsMicActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsMicActive(true);
        // Announce speaker in room
        prayerRoomStore.sendMessage('Host Altar', `${userName} has activated the microphone to lead prayer.`, 'announcement');
      } catch (err) {
        alert('Microphone access was denied or not available on this device.');
      }
    }
  };

  // Raise Hand
  const toggleRaiseHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) {
      prayerRoomStore.sendMessage(userName, `raised hand to pray / share testimony`, 'announcement');
      triggerReaction('amen');
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    setNewMessage('');
    const sent = await prayerRoomStore.sendMessage(userName, text, 'message');
    if (sent) {
      setMessages(prev => [...prev, sent]);
    }
  };

  // Quick Reaction
  const triggerReaction = (type: 'amen' | 'fire' | 'praise' | 'love') => {
    prayerRoomStore.sendReaction(type, userName);
    const newReaction: ReactionEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      user_name: userName,
      xOffset: Math.floor(Math.random() * 80) + 10
    };
    setReactions(prev => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3200);
  };

  // Submit Prayer Request
  const handleSubmitPrayerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;

    await prayerRoomStore.submitPrayerRequest(userName, requestText, isAnonymous);
    // Also post a prayer request message into chat
    const author = isAnonymous ? 'A Member' : userName;
    await prayerRoomStore.sendMessage(author, `[Prayer Request]: ${requestText.trim()}`, 'prayer_request');

    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setIsRequestModalOpen(false);
      setRequestText('');
    }, 1800);
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
    } else {
      alert('Failed to update room settings.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Joshua's Generation 24/7 Global Prayer Altar",
        text: `Join the 24/7 Prayer Altar right now: ${roomState.current_topic}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Prayer room link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col relative overflow-x-hidden select-none font-sans">
      {/* Ambient background sound element */}
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
            className="absolute bottom-20 transition-all duration-3000 ease-out animate-float-up flex flex-col items-center"
            style={{ left: `${r.xOffset}%` }}
          >
            <span className="text-3xl filter drop-shadow-[0_4px_12px_rgba(234,179,8,0.6)]">
              {r.type === 'amen' && '🙏'}
              {r.type === 'fire' && '🔥'}
              {r.type === 'praise' && '🕊️'}
              {r.type === 'love' && '❤️'}
            </span>
            {r.user_name && (
              <span className="text-[10px] text-amber-200 bg-black/60 px-1.5 py-0.5 rounded-full mt-1 backdrop-blur-sm">
                {r.user_name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Top Header Bar */}
      <header className="border-b border-amber-500/20 bg-[#090e1a]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1 text-slate-400 hover:text-amber-400 text-xs sm:text-sm font-medium transition-colors"
              title="Return to Main Website"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                <img
                  src="https://joshuasgeneration.com/favicon.png"
                  alt="Joshua's Generation Logo"
                  className="w-full h-full object-cover rounded-full bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase flex items-center gap-1.5">
                  <span>Joshua's Generation</span>
                  <span className="text-amber-400 font-serif">Altar</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">24/7 LIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs text-amber-300">
              <Users className="w-3.5 h-3.5" />
              <span className="font-semibold">{activeCount}</span>
              <span className="hidden md:inline text-slate-400">Praying</span>
            </div>

            <button
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition-all"
              title="Share Room"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs flex items-center gap-1.5 transition-all"
                title="Moderator Controls"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Host Controls</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pinned Scripture / Prayer Focus Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-amber-950/40 border-b border-amber-500/20 py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-amber-200 tracking-wide">
              {roomState.current_topic}
            </span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-400 font-serif italic">
            "{roomState.scripture}"
          </div>
        </div>
      </div>

      {/* Main Sanctuary Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center Column: Altar & Audio Stage */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Main Altar Stage Glass Card */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0b101e]/90 border border-amber-500/30 p-6 sm:p-8 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center">
            
            {/* Background Glow */}
            <div className="absolute -top-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Stage Title */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Holy Ghost Intercession Altar</span>
            </div>

            {/* Center Altar Speaker Visualizer */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Outer Pulsing Wave Rings */}
              <div className={`absolute w-44 h-44 rounded-full border border-amber-400/20 ${isPlayingAudio || isMicActive ? 'animate-ping duration-1000' : 'opacity-20'}`} />
              <div className={`absolute w-36 h-36 rounded-full border border-amber-400/30 ${isPlayingAudio || isMicActive ? 'animate-pulse' : 'opacity-30'}`} />
              
              {/* Center Stage Avatar */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-1 shadow-[0_0_35px_rgba(217,119,6,0.4)] flex items-center justify-center relative">
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
                  <Flame className={`w-8 h-8 ${isPlayingAudio || isMicActive ? 'text-amber-400 animate-bounce' : 'text-amber-600'} transition-all`} />
                  <span className="text-[11px] font-bold text-amber-100 uppercase tracking-widest mt-1">
                    {isMicActive ? userName : 'Minister'}
                  </span>
                  <span className="text-[9px] text-amber-400/80">
                    {isMicActive ? 'Speaking' : 'At the Altar'}
                  </span>
                </div>
              </div>
            </div>

            {/* Speaking Status Banner */}
            <div className="mt-4 mb-6">
              <p className="text-base sm:text-lg font-medium text-slate-200">
                {isMicActive 
                  ? "You are currently speaking to the room" 
                  : isPlayingAudio 
                    ? "Prayer sanctuary audio is active — tune your spirit into prayer" 
                    : "Tap 'Tune In & Listen' below to hear prayer & atmosphere"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                "For where two or three are gathered together in my name, there am I in the midst of them." — Matthew 18:20
              </p>
            </div>

            {/* Audio Stage Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
              {/* Main Listen Audio Button */}
              <button
                onClick={toggleAudio}
                className={`flex-1 min-w-[150px] px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  isPlayingAudio
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>Mute Audio</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Tune In & Listen</span>
                  </>
                )}
              </button>

              {/* Raise Hand Button */}
              <button
                onClick={toggleRaiseHand}
                className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  isHandRaised
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Request to pray aloud"
              >
                <Hand className={`w-4 h-4 ${isHandRaised ? 'text-emerald-400 animate-bounce' : ''}`} />
                <span>{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
              </button>

              {/* Pastor / Leader Mic Button */}
              {isAdmin && (
                <button
                  onClick={toggleMic}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                    isMicActive
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
                  }`}
                  title="Lead in Prayer (Broadcast Microphone)"
                >
                  {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMicActive ? 'Mute Mic' : 'Lead Prayer'}</span>
                </button>
              )}
            </div>

            {/* Volume Slider Bar */}
            {isPlayingAudio && (
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <VolumeX className="w-3.5 h-3.5" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-28 accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
                <Volume2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Quick Intercession Action Bar */}
          <div className="rounded-xl bg-slate-900/60 border border-amber-500/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Need prayer for healing, deliverance, or breakthrough?</span>
            </div>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              Submit Prayer Request
            </button>
          </div>

          {/* Guidelines / Intercession Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="font-semibold text-amber-300 block mb-1">1. Atmosphere</span>
              Find a quiet place to pray without distractions. Let the presence of God fill your room.
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="font-semibold text-amber-300 block mb-1">2. Agreement</span>
              Type "Amen" in faith as prayer points are raised. There is power in united agreement.
            </div>
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
              <span className="font-semibold text-amber-300 block mb-1">3. Intercession</span>
              Pray for the nations, the church, families, and souls to be won for Jesus Christ.
            </div>
          </div>
        </div>

        {/* Right Column: Live Prayer Chat & Amens */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[600px] lg:h-auto rounded-2xl bg-slate-900/90 border border-amber-500/30 overflow-hidden shadow-xl">
          
          {/* Chat Header */}
          <div className="p-3.5 border-b border-amber-500/20 bg-[#090e1a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Live Prayer Stream</span>
            </div>
            <button
              onClick={() => setIsNamePromptOpen(true)}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>{userName}</span>
              <span className="text-slate-500">(change)</span>
            </button>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <Flame className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p>The altar is open. Be the first to type an Amen or prayer point!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSystem = msg.type === 'announcement';
                const isPrayerRequest = msg.type === 'prayer_request';

                if (isSystem) {
                  return (
                    <div key={msg.id || idx} className="my-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <p className="text-[11px] font-medium text-amber-300">
                        {msg.message}
                      </p>
                    </div>
                  );
                }

                if (isPrayerRequest) {
                  return (
                    <div key={msg.id || idx} className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-red-300 flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          {msg.user_name}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 italic">{msg.message}</p>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || idx} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-amber-300">
                        {msg.user_name}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-xs text-slate-200">
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tap Amen:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => triggerReaction('amen')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-amber-500/20 text-xs border border-slate-700 hover:border-amber-500/40 transition-all flex items-center gap-1"
                title="Tap Amen"
              >
                <span>🙏</span>
                <span className="text-[10px] font-bold text-amber-300">Amen</span>
              </button>
              <button
                onClick={() => triggerReaction('fire')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-orange-500/20 text-xs border border-slate-700 hover:border-orange-500/40 transition-all flex items-center gap-1"
                title="Tap Fire"
              >
                <span>🔥</span>
                <span className="text-[10px] font-bold text-orange-300">Fire</span>
              </button>
              <button
                onClick={() => triggerReaction('praise')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-blue-500/20 text-xs border border-slate-700 hover:border-blue-500/40 transition-all flex items-center gap-1"
                title="Tap Glory"
              >
                <span>🕊️</span>
                <span className="text-[10px] font-bold text-blue-300">Glory</span>
              </button>
            </div>
          </div>

          {/* Chat Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-amber-500/20 bg-[#080d19] flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Write a prayer point, ${userName}...`}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Change Name Modal */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Set Your Display Name</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the name that will show when you type in the prayer room or raise your hand:
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Sis. Faith or Bro. Emmanuel"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNamePromptOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prayer Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-amber-400" />
              <span>Submit Prayer Request</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Our intercessors will stand in agreement with you before the Lord right now.
            </p>

            {requestSubmitted ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                <p className="text-sm font-bold text-white">Prayer Request Received!</p>
                <p className="text-xs text-slate-400 mt-1">Standing in agreement with you in Jesus' name.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPrayerRequest} className="space-y-4">
                <div>
                  <textarea
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="Describe your prayer need (healing, family, breakthrough, direction)..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anon"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <label htmlFor="anon" className="text-xs text-slate-400 cursor-pointer">
                    Keep request anonymous
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
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
      {isSettingsOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Altar Host Controls</span>
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Prayer Topic / Focus Banner
                </label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pinned Scripture of the Hour
                </label>
                <input
                  type="text"
                  value={editScripture}
                  onChange={(e) => setEditScripture(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  24/7 Atmospheric Worship / Prayer Audio Stream URL
                </label>
                <input
                  type="url"
                  value={editAudioUrl}
                  onChange={(e) => setEditAudioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Direct MP3 stream URL or peaceful soaking worship stream to play when ministers are offline.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Update Altar State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
