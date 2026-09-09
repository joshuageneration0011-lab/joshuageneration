import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Heart, ArrowLeft, Shield, Users, Radio, 
  MessageSquare, MoreVertical, Crown, UserX, PhoneCall, PhoneOff, 
  X, Sparkles, Trash2, Key, Smile, Volume2
} from 'lucide-react';
import { prayerRoomStore, type PrayerMessage, type PrayerRoomState, type CallParticipant, type ReactionEvent } from '@/data/prayerRoomStore';
import { api } from '@/utils/api';

interface PrayerRoomPageProps {
  onNavigate: (page: string) => void;
}

const AVATAR_COLORS = [
  'bg-royal-blue-600',
  'bg-gold-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-cyan-700'
];

const STICKERS = [
  { id: 'amen', emoji: '🙏', label: 'POWERFUL AMEN', color: 'from-amber-500 to-amber-600 text-white' },
  { id: 'fire', emoji: '🔥', label: 'HOLY GHOST FIRE', color: 'from-orange-500 to-red-600 text-white' },
  { id: 'spirit', emoji: '🕊️', label: 'THE HOLY SPIRIT', color: 'from-blue-500 to-cyan-600 text-white' },
  { id: 'lion', emoji: '🦁', label: 'LION OF JUDAH', color: 'from-amber-600 to-yellow-600 text-white' },
  { id: 'crown', emoji: '👑', label: 'KING OF KINGS', color: 'from-yellow-500 to-amber-600 text-white' },
  { id: 'sword', emoji: '⚔️', label: 'SWORD OF SPIRIT', color: 'from-slate-700 to-slate-900 text-white' },
  { id: 'bible', emoji: '📖', label: 'RHEMA WORD', color: 'from-indigo-600 to-blue-700 text-white' },
  { id: 'blood', emoji: '🩸', label: 'BLOOD OF JESUS', color: 'from-red-600 to-rose-700 text-white' },
  { id: 'cross', emoji: '✝️', label: 'VICTORY IN CHRIST', color: 'from-royal-blue-600 to-indigo-700 text-white' },
  { id: 'trumpet', emoji: '🎺', label: 'SHOUT OF PRAISE', color: 'from-amber-500 to-orange-600 text-white' }
];

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

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
  const [userRole, setUserRole] = useState<'host' | 'admin' | 'intercessor'>(() => {
    return localStorage.getItem('jg_prayer_is_moderator') === 'true' ? 'admin' : 'intercessor';
  });

  // Call & Participants
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isInCall, setIsInCall] = useState(true);
  const [selectedParticipantMenu, setSelectedParticipantMenu] = useState<string | null>(null);

  // Moderator Secret Key Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  // Chat & Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [messages, setMessages] = useState<PrayerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Room State
  const [roomState, setRoomState] = useState<PrayerRoomState>({
    current_topic: '24/7 Global Prayer Altar',
    scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
    is_live: true,
    background_audio_url: '',
    active_speakers: []
  });

  // Audio & WebRTC Refs & States
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const initiatedPeersRef = useRef<Set<string>>(new Set());
  const [remoteAudioStreams, setRemoteAudioStreams] = useState<Array<{ id: string; stream: MediaStream }>>([]);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Mobile Audio Hardware & Autoplay Unlocker
  const unlockAllAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
        // Play a silent buffer to unlock iOS Safari / WebKit audio session
        try {
          const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.start(0);
        } catch (e) {}
      }
    } catch (e) {}

    // Resume all remote audio elements
    document.querySelectorAll('audio').forEach(el => {
      if (el.srcObject) {
        el.play().catch(() => {});
      }
    });
  };

  // Check if authenticated admin
  useEffect(() => {
    const isSiteAdmin = api.isAuthenticated() && (api.getRole() === 'admin' || api.getRole() === 'superadmin');
    if (isSiteAdmin) {
      setUserRole('host');
    }
  }, []);

  const canModerate = userRole === 'host' || userRole === 'admin';

  // --- WebRTC Multi-Peer Mesh Logic for Two-Way Audio ---

  const getOrCreatePeerConnection = (targetUserId: string): RTCPeerConnection => {
    let pc = peerConnectionsRef.current.get(targetUserId);
    if (pc && pc.signalingState !== 'closed') {
      return pc;
    }

    pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetUserId, pc);

    // ALWAYS pre-add bidirectional audio transceiver.
    // This pre-negotiates m=audio in the SDP so replaceTrack immediately streams audio without renegotiation!
    try {
      const transceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
      if (mediaStreamRef.current) {
        const liveTrack = mediaStreamRef.current.getAudioTracks()[0];
        if (liveTrack && liveTrack.readyState === 'live') {
          transceiver.sender.replaceTrack(liveTrack).catch(err => {
            console.warn('[WebRTC] Initial replaceTrack error:', err);
          });
        }
      }
    } catch (err) {
      console.warn('[WebRTC] addTransceiver fallback:', err);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          pc?.addTrack(track, mediaStreamRef.current!);
        });
      }
    }

    // ICE Candidate exchange
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        prayerRoomStore.sendSignal('ice', userId, targetUserId, event.candidate);
      }
    };

    // Incoming Remote Audio Track
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Incoming track from peer ${targetUserId}:`, event.track.kind);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);

      // Render via React DOM audio elements
      setRemoteAudioStreams(prev => {
        const filtered = prev.filter(item => item.id !== targetUserId);
        return [...filtered, { id: targetUserId, stream }];
      });

      // Also maintain standalone HTMLAudioElement as secondary guaranteed output
      let audioEl = remoteAudioElsRef.current.get(targetUserId);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `remote-audio-${targetUserId}`;
        audioEl.autoplay = true;
        audioEl.volume = 1.0;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        (audioEl as any).playsInline = true;
        document.body.appendChild(audioEl);
        remoteAudioElsRef.current.set(targetUserId, audioEl);
      }
      audioEl.srcObject = stream;
      audioEl.play().catch(e => {
        console.warn(`[WebRTC] Autoplay pending user gesture for ${targetUserId}:`, e);
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${targetUserId} state: ${pc?.connectionState}`);
      if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed' || pc?.connectionState === 'closed') {
        const audioEl = remoteAudioElsRef.current.get(targetUserId);
        if (audioEl) {
          audioEl.pause();
          audioEl.srcObject = null;
          audioEl.remove();
          remoteAudioElsRef.current.delete(targetUserId);
        }
        setRemoteAudioStreams(prev => prev.filter(item => item.id !== targetUserId));
        peerConnectionsRef.current.delete(targetUserId);
        initiatedPeersRef.current.delete(targetUserId);
        pendingCandidatesRef.current.delete(targetUserId);
      }
    };

    return pc;
  };

  const initiateCallToPeer = async (targetUserId: string) => {
    try {
      const pc = getOrCreatePeerConnection(targetUserId);
      if (initiatedPeersRef.current.has(targetUserId) && (pc.connectionState === 'connected' || pc.connectionState === 'connecting')) {
        return;
      }
      if (pc.signalingState !== 'stable') {
        return;
      }
      initiatedPeersRef.current.add(targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);
      prayerRoomStore.sendSignal('offer', userId, targetUserId, offer);
    } catch (err) {
      console.warn('Error creating WebRTC offer:', err);
    }
  };

  const handleRemoteSignal = async (signal: { type: string; fromId: string; toId: string; payload: any }) => {
    if (signal.toId !== userId) return;
    const { fromId, type, payload } = signal;

    try {
      const pc = getOrCreatePeerConnection(fromId);

      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        
        // Drain pending ICE candidates for this peer
        const pending = pendingCandidatesRef.current.get(fromId) || [];
        for (const cand of pending) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
        pendingCandidatesRef.current.delete(fromId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        prayerRoomStore.sendSignal('answer', userId, fromId, answer);
      } else if (type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          
          // Drain pending ICE candidates for this peer
          const pending = pendingCandidatesRef.current.get(fromId) || [];
          for (const cand of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
          pendingCandidatesRef.current.delete(fromId);
        }
      } else if (type === 'ice') {
        if (payload) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload)).catch(() => {});
          } else {
            if (!pendingCandidatesRef.current.has(fromId)) {
              pendingCandidatesRef.current.set(fromId, []);
            }
            pendingCandidatesRef.current.get(fromId)!.push(payload);
          }
        }
      }
    } catch (err) {
      console.warn('Error handling remote WebRTC signal:', err);
    }
  };

  // Connect & Sync (Stable across chat drawer opening/closing)
  useEffect(() => {
    prayerRoomStore.getState().then(res => {
      setRoomState(res.state);
    });

    prayerRoomStore.getMessages().then(msgs => {
      setMessages(msgs);
    });

    prayerRoomStore.getCallParticipants().then(pts => {
      setParticipants(pts);
    });

    const unsubscribe = prayerRoomStore.subscribeToEvents({
      onMessage: (msg) => {
        setMessages(prev => [...prev, msg]);
        if (!isChatOpenRef.current) {
          setUnreadChatCount(prev => prev + 1);
        }
      },
      onMessageDeleted: (deletedId) => {
        setMessages(prev => prev.filter(m => String(m.id) !== String(deletedId)));
      },
      onChatCleared: () => {
        setMessages([]);
      },
      onReaction: (reaction) => {
        setReactions(prev => [...prev.slice(-15), reaction]);
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 3000);
      },
      onStateUpdate: (updated) => {
        setRoomState(updated);
      },
      onCallRoster: (roster) => {
        setParticipants(roster);
        const me = roster.find(p => p.id === userId);
        if (me && me.role && userRole !== 'host') {
          setUserRole(me.role);
        }

        // Establish WebRTC peer connection to other participants
        roster.forEach(p => {
          if (p.id !== userId) {
            // Lexicographically smaller ID initiates offer
            if (userId < p.id) {
              initiateCallToPeer(p.id);
            }
          }
        });
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
      onForceUnmute: (targetId) => {
        if (targetId === userId) {
          handleForceUnmuted();
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
      },
      onSignal: (signal) => {
        handleRemoteSignal(signal);
      }
    });

    return () => {
      unsubscribe();
      stopMic();
      prayerRoomStore.leaveCall(userId);
      // Clean up remote audio elements
      remoteAudioElsRef.current.forEach(el => {
        el.pause();
        el.srcObject = null;
        el.remove();
      });
      remoteAudioElsRef.current.clear();
      setRemoteAudioStreams([]);
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      initiatedPeersRef.current.clear();
      pendingCandidatesRef.current.clear();
    };
  }, [userId]);

  // Join call once name is known
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

  // Auto scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadChatCount(0);
    }
  }, [messages, isChatOpen]);

  const handleForceMuted = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
    }
    setIsMuted(true);
    setIsSpeaking(false);
    prayerRoomStore.updateMicState(userId, true, false);
    alert('A moderator has muted your microphone.');
  };

  const handleForceUnmuted = () => {
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getAudioTracks()[0];
      if (track && track.readyState === 'live') {
        track.enabled = true;
        peerConnectionsRef.current.forEach(pc => {
          const audioSender = pc.getSenders().find(s => s.track?.kind === 'audio' || s.track === null);
          if (audioSender) {
            audioSender.replaceTrack(track).catch(() => {});
          }
        });
        setIsMuted(false);
        prayerRoomStore.updateMicState(userId, false, false);
        alert('A moderator has unmuted your microphone.');
        return;
      }
    }
    toggleMic();
  };

  // Toggle Mic (Phone & Desktop WebRTC Audio)
  const toggleMic = async () => {
    if (!isInCall) {
      alert('Please reconnect to the call first.');
      return;
    }

    // Unlock phone audio output on user tap
    unlockAllAudio();

    if (!isMuted) {
      // Muting: Keep connection active, mute audio track
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
      }
      setIsMuted(true);
      setIsSpeaking(false);
      prayerRoomStore.updateMicState(userId, true, false);
    } else {
      // Unmuting: Acquire mic if needed and route to all active peer transceivers
      try {
        let stream = mediaStreamRef.current;
        const hasLiveTrack = stream && stream.getAudioTracks().length > 0 && stream.getAudioTracks()[0].readyState === 'live';

        if (!hasLiveTrack) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          mediaStreamRef.current = stream;
        }

        const micTrack = stream.getAudioTracks()[0];
        if (micTrack) {
          micTrack.enabled = true;

          // Connect / swap mic track into every peer connection's audio sender
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const audioSender = senders.find(s => s.track?.kind === 'audio' || s.track === null);
            if (audioSender) {
              audioSender.replaceTrack(micTrack).catch(err => {
                console.warn('[WebRTC] replaceTrack warning on unmute:', err);
              });
            } else {
              pc.addTrack(micTrack, stream!);
            }
          });
        }

        // Setup Web Audio Analyser for volume detection
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtxClass();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }

        if (!analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
        }

        setIsMuted(false);
        prayerRoomStore.updateMicState(userId, false, false);

        // Continuous volume check loop
        const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128);
        let lastSpeakingState = false;

        const checkVolume = () => {
          if (!analyserRef.current || isMuted) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isNowSpeaking = average > 14;

          if (isNowSpeaking !== lastSpeakingState) {
            lastSpeakingState = isNowSpeaking;
            setIsSpeaking(isNowSpeaking);
            prayerRoomStore.updateMicState(userId, false, isNowSpeaking);
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(checkVolume);
      } catch (err) {
        console.error('Mic access error:', err);
        alert('Could not access microphone. Please check your phone or browser microphone permissions.');
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

  // Moderator Actions
  const handleAdminMute = async (targetId: string) => {
    setSelectedParticipantMenu(null);
    await prayerRoomStore.executeAdminAction('mute', targetId, undefined, userId);
  };

  const handleAdminUnmute = async (targetId: string) => {
    setSelectedParticipantMenu(null);
    await prayerRoomStore.executeAdminAction('unmute', targetId, undefined, userId);
  };

  const handleAdminMuteAll = async () => {
    if (confirm('Mute all other participants in the prayer room?')) {
      await prayerRoomStore.executeAdminAction('mute_all', undefined, undefined, userId);
    }
  };

  const handleAdminSetRole = async (targetId: string, role: 'host' | 'admin' | 'intercessor') => {
    setSelectedParticipantMenu(null);
    await prayerRoomStore.executeAdminAction('set_role', targetId, role, userId);
  };

  const handleAdminRemove = async (targetId: string) => {
    setSelectedParticipantMenu(null);
    if (confirm('Remove this person from the prayer call?')) {
      await prayerRoomStore.executeAdminAction('remove', targetId, undefined, userId);
    }
  };

  // Delete message / Clear Chat
  const handleDeleteMessage = async (msgId: string | number) => {
    if (confirm('Delete this message for everyone?')) {
      await prayerRoomStore.deleteMessage(msgId);
    }
  };

  const handleClearChat = async () => {
    if (confirm('Clear the entire prayer chat for everyone?')) {
      await prayerRoomStore.clearMessages();
    }
  };

  // Verify Moderator Secret Key
  const handleVerifySecretKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError('');
    if (!keyInput.trim()) return;

    const success = await prayerRoomStore.verifyModeratorKey(keyInput.trim(), userId);
    if (success) {
      setUserRole('admin');
      localStorage.setItem('jg_prayer_is_moderator', 'true');
      setIsKeyModalOpen(false);
      setKeyInput('');
      alert('Moderator privileges granted! You now have full altar moderation powers.');
    } else {
      setKeyError('Invalid moderator secret key. Please check and try again.');
    }
  };

  // Send Chat Message
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

  // Send Sticker
  const handleSendSticker = async (sticker: typeof STICKERS[0]) => {
    setShowStickerPicker(false);
    const sent = await prayerRoomStore.sendMessage(
      userName || 'Intercessor',
      `${sticker.emoji} ${sticker.label}`,
      'sticker',
      sticker.id
    );
    if (sent) {
      setMessages(prev => [...prev, sent]);
    }
  };

  // Quick Reaction
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
    }, 3000);
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

  return (
    <div 
      className="min-h-screen bg-slate-50 text-gray-900 flex flex-col relative font-sans"
      onClickCapture={unlockAllAudio}
      onTouchStartCapture={unlockAllAudio}
    >
      {/* Hidden Audio Elements for Remote Participants */}
      <div className="hidden" aria-hidden="true">
        {remoteAudioStreams.map(item => (
          <audio
            key={item.id}
            id={`remote-audio-elem-${item.id}`}
            autoPlay
            playsInline
            ref={el => {
              if (el) {
                if (el.srcObject !== item.stream) {
                  el.srcObject = item.stream;
                }
                el.play().catch(() => {});
              }
            }}
          />
        ))}
      </div>
      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map(r => (
          <div
            key={r.id}
            className="absolute bottom-28 transition-all duration-3000 ease-out animate-float-up flex flex-col items-center"
            style={{ left: `${r.xOffset}%` }}
          >
            <span className="text-3xl filter drop-shadow-md">
              {r.type === 'amen' && '🙏'}
              {r.type === 'fire' && '🔥'}
              {r.type === 'praise' && '🕊️'}
              {r.type === 'love' && '❤️'}
            </span>
            {r.user_name && (
              <span className="text-[11px] font-semibold text-royal-blue-900 bg-white/95 px-2 py-0.5 rounded-full mt-1 border border-royal-blue-100 shadow-xs">
                {r.user_name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Clean Main Site Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 text-gray-500 hover:text-royal-blue-600 text-sm font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-royal-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                JG
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                  Joshua's Generation <span className="text-gold-600">Prayer Room</span>
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-600">LIVE AUDIO</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-royal-blue-50 border border-royal-blue-100 text-royal-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Users className="w-3.5 h-3.5" />
              <span>{participants.length || 1} in call</span>
            </div>

            {/* Moderator Secret Key Button */}
            {!canModerate && (
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-gold-700 border border-gold-200 rounded-full text-xs font-medium cursor-pointer transition-colors"
                title="Enter Moderator Key"
              >
                <Key className="w-3.5 h-3.5 text-gold-600" />
                <span className="hidden sm:inline">Mod Key</span>
              </button>
            )}

            {canModerate && (
              <button
                onClick={handleAdminMuteAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-medium cursor-pointer transition-colors"
                title="Mute everyone"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>Mute All</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Pinned Scripture / Topic Focus Bar */}
      <div className="bg-white border-b border-gray-200/80 py-2.5 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs text-gray-600">
          <span className="font-bold text-royal-blue-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            {roomState.current_topic}
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="font-serif italic text-gray-500">"{roomState.scripture}"</span>
        </div>
      </div>

      {/* Main Call Grid (Simple, Spacious, Uncluttered) */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center pb-28">
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {participants.map((p) => {
            const isMe = p.id === userId;
            const isThisSpeaking = isMe ? isSpeaking : p.isSpeaking;
            const isThisMuted = isMe ? isMuted : p.isMuted;
            const initials = p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'P';

            return (
              <div
                key={p.id}
                className={`relative bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 border ${
                  isThisSpeaking
                    ? 'border-emerald-500 shadow-lg ring-4 ring-emerald-100'
                    : 'border-gray-200 shadow-xs hover:border-gray-300'
                }`}
              >
                {/* Admin Menu Dropdown Button */}
                {canModerate && !isMe && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => setSelectedParticipantMenu(selectedParticipantMenu === p.id ? null : p.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {selectedParticipantMenu === p.id && (
                      <div className="absolute right-0 mt-1 w-38 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-left text-xs font-medium">
                        {isThisMuted ? (
                          <button
                            onClick={() => handleAdminUnmute(p.id)}
                            className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Mic className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unmute Mic</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAdminMute(p.id)}
                            className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                          >
                            <MicOff className="w-3.5 h-3.5 text-rose-600" />
                            <span>Mute Mic</span>
                          </button>
                        )}

                        {p.role !== 'admin' && p.role !== 'host' && (
                          <button
                            onClick={() => handleAdminSetRole(p.id, 'admin')}
                            className="w-full px-3 py-2 text-royal-blue-600 hover:bg-royal-blue-50 flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Make Admin</span>
                          </button>
                        )}
                        {p.role === 'admin' && (
                          <button
                            onClick={() => handleAdminSetRole(p.id, 'intercessor')}
                            className="w-full px-3 py-2 text-gray-600 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Remove Admin</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleAdminRemove(p.id)}
                          className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Eject</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar with Mic Indicator */}
                <div className="relative my-2">
                  <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full ${p.avatarColor || 'bg-royal-blue-600'} text-white font-bold text-xl flex items-center justify-center shadow-md`}>
                    {initials}
                  </div>

                  {/* Mic Status Badge */}
                  <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] border-2 border-white shadow-xs ${
                    isThisMuted ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                  }`}>
                    {isThisMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </div>
                </div>

                {/* Name & Role Tag */}
                <p className="text-sm font-bold text-gray-900 mt-2 truncate max-w-full">
                  {p.name} {isMe && <span className="text-royal-blue-600 font-medium">(You)</span>}
                </p>
                <div className="mt-0.5">
                  {p.role === 'host' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-full border border-gold-200">
                      <Crown className="w-2.5 h-2.5" /> Host
                    </span>
                  ) : p.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-royal-blue-700 bg-royal-blue-50 px-2 py-0.5 rounded-full border border-royal-blue-200">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-500">
                      Intercessor
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Simple Control Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
        <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Mute / Unmute Button */}
          <button
            onClick={toggleMic}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
              !isMuted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            {!isMuted ? (
              <>
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Mute Mic</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                <span>Unmute Mic</span>
              </>
            )}
          </button>

          {/* Amen Reaction Button */}
          <button
            onClick={() => triggerReaction('amen')}
            className="px-3.5 py-3 rounded-xl bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Tap Amen"
          >
            <span>🙏</span>
            <span>Amen</span>
          </button>

          {/* Toggle Chat Drawer */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative p-3 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
              isChatOpen
                ? 'bg-royal-blue-600 text-white border-royal-blue-600'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
            title="Open Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Leave / Join Button */}
          <button
            onClick={toggleCallMembership}
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
              isInCall
                ? 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border-gray-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
            title={isInCall ? 'Leave Call' : 'Rejoin Call'}
          >
            {isInCall ? <PhoneOff className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-over Clean Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          {/* Chat Drawer Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-royal-blue-600" />
              <h3 className="font-bold text-sm text-gray-900">Prayer Room Chat</h3>
            </div>
            <div className="flex items-center gap-2">
              {canModerate && (
                <button
                  onClick={handleClearChat}
                  className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  title="Wipe chat history"
                >
                  Clear Chat
                </button>
              )}
              {!canModerate && (
                <button
                  onClick={() => setIsKeyModalOpen(true)}
                  className="text-[11px] text-gold-700 hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
                >
                  <Key className="w-3 h-3" /> Mod Key
                </button>
              )}
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                <p>No messages yet. Send a message, prayer point, or sticker!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSticker = msg.type === 'sticker' || !!msg.sticker;

                return (
                  <div key={msg.id || idx} className="flex flex-col gap-0.5 group">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-royal-blue-900">{msg.user_name}</span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {canModerate && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="text-gray-300 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isSticker ? (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-royal-blue-50 to-gold-50 border border-royal-blue-100 shadow-xs inline-block max-w-[200px]">
                        <div className="text-3xl mb-1">{msg.message.split(' ')[0]}</div>
                        <p className="text-[10px] font-bold text-royal-blue-900 uppercase tracking-wider">
                          {msg.message.substring(msg.message.indexOf(' ') + 1)}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 shadow-2xs">
                        {msg.message}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* WhatsApp / Telegram Style Stickers Popup Grid */}
          {showStickerPicker && (
            <div className="p-3 bg-white border-t border-gray-200 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {STICKERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSendSticker(s)}
                  className={`p-2 rounded-xl bg-gradient-to-r ${s.color} flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02] transition-transform`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reaction Taps */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white flex items-center justify-between">
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showStickerPicker
                  ? 'bg-royal-blue-50 text-royal-blue-700 border-royal-blue-200'
                  : 'text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Smile className="w-4 h-4 text-gold-500" />
              <span>Stickers</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerReaction('amen')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-gold-50 text-xs text-gray-700 hover:text-gold-900 flex items-center gap-1 cursor-pointer"
              >
                <span>🙏</span>
                <span className="font-semibold text-[10px]">Amen</span>
              </button>
              <button
                onClick={() => triggerReaction('fire')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 text-xs text-gray-700 hover:text-orange-900 flex items-center gap-1 cursor-pointer"
              >
                <span>🔥</span>
                <span className="font-semibold text-[10px]">Fire</span>
              </button>
              <button
                onClick={() => triggerReaction('praise')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-xs text-gray-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
              >
                <span>🕊️</span>
                <span className="font-semibold text-[10px]">Glory</span>
              </button>
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a prayer or message..."
              className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-royal-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 disabled:opacity-50 text-white cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Moderator Key Entry Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-gold-700 flex items-center justify-center mb-3">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Moderator Secret Key
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Enter the altar secret key to gain full moderation powers (mute/unmute, clear chat, remove users):
            </p>

            {keyError && (
              <p className="text-xs text-rose-600 mb-3 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {keyError}
              </p>
            )}

            <form onSubmit={handleVerifySecretKey} className="space-y-4">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter secret key..."
                className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-royal-blue-500"
                autoFocus
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Activate Moderator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-royal-blue-100 text-royal-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Join 24/7 Prayer Room
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Enter your name so brethren can recognize you in the prayer room:
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your Name (e.g. Pastor David, Sis. Faith)"
                className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-royal-blue-500"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer transition-colors"
              >
                Join Prayer Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
