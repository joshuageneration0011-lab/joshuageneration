import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Heart, ArrowLeft, Shield, Users, Radio, 
  MessageSquare, MoreVertical, Crown, UserX, PhoneCall, PhoneOff, 
  X, Sparkles, Trash2, Key, Smile, Volume2, VolumeX, Music, Link2, Play, Pause, Sliders, Plus, Image as ImageIcon, Upload, Camera, Pin, Edit3
} from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { 
  prayerRoomStore, 
  type PrayerMessage, 
  type PrayerRoomState, 
  type CallParticipant, 
  type ReactionEvent,
  type CustomSticker 
} from '@/data/prayerRoomStore';
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

// Helper: Extract YouTube Video ID from any YouTube URL (standard, short, embed, live)
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const clean = url.trim();
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];
  const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch) return watchMatch[1];
  const embedMatch = clean.match(/\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) return embedMatch[1];
  const liveMatch = clean.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch) return liveMatch[1];
  const shortsMatch = clean.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];
  return null;
}

// Helper: Lazy load YouTube IFrame Player API
const loadYouTubeIframeApi = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve();
      return;
    }
    const existingCallback = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (existingCallback) existingCallback();
      resolve();
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
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
  const [userAvatar, setUserAvatar] = useState(() => localStorage.getItem('jg_prayer_user_avatar') || '');
  const [avatarInput, setAvatarInput] = useState(() => localStorage.getItem('jg_prayer_user_avatar') || '');
  const [userRole, setUserRole] = useState<'host' | 'admin' | 'intercessor'>(() => {
    if (localStorage.getItem('jg_prayer_is_host') === 'true') return 'host';
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
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<PrayerMessage | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  // Custom Stickers State (WhatsApp / Telegram style)
  const [customStickers, setCustomStickers] = useState<CustomSticker[]>([]);
  const [stickerTab, setStickerTab] = useState<'custom' | 'preset'>('custom');
  const [isCreateStickerOpen, setIsCreateStickerOpen] = useState(false);
  const [newStickerLabel, setNewStickerLabel] = useState('');
  const [newStickerEmoji, setNewStickerEmoji] = useState('🔥');
  const [newStickerImage, setNewStickerImage] = useState<string>('');
  const [isUploadingSticker, setIsUploadingSticker] = useState(false);
  const [stickerError, setStickerError] = useState('');

  // Local Audio Preferences (Mute or volume just for current device)
  const [isLocalAudioMuted, setIsLocalAudioMuted] = useState(() => localStorage.getItem('jg_prayer_local_audio_muted') === 'true');
  const [localAudioVolume, setLocalAudioVolume] = useState(() => Number(localStorage.getItem('jg_prayer_local_audio_volume') || '80'));

  // Host Music Management Modal State
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicUrlInput, setMusicUrlInput] = useState('');
  const [musicModalError, setMusicModalError] = useState('');
  const [isSavingMusic, setIsSavingMusic] = useState(false);
  const [isAudioControlsExpanded, setIsAudioControlsExpanded] = useState(false);

  // Room State
  const [roomState, setRoomState] = useState<PrayerRoomState>({
    current_topic: '24/7 Global Prayer Altar',
    scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
    is_live: true,
    background_audio_url: '',
    is_audio_playing: false,
    background_audio_volume: 30,
    active_speakers: []
  });

  // Audio & LiveKit Cloud Refs
  const roomRef = useRef<Room | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const currentYtIdRef = useRef<string | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // Mobile Audio Hardware & Autoplay Unlocker (Includes YouTube Audio)
  const unlockAllAudio = () => {
    document.querySelectorAll('audio').forEach(el => {
      el.play().catch(() => {});
    });
    if (bgAudioRef.current && roomState.is_audio_playing && !isLocalAudioMuted) {
      bgAudioRef.current.play().catch(() => {});
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      if (roomState.is_audio_playing && !isLocalAudioMuted) {
        try {
          ytPlayerRef.current.playVideo();
        } catch (e) {}
      }
    }
  };

  // Check if authenticated admin and sync host powers
  useEffect(() => {
    const isSiteAdmin = api.isAuthenticated() && (api.getRole() === 'admin' || api.getRole() === 'superadmin');
    if (isSiteAdmin) {
      setUserRole('host');
      localStorage.setItem('jg_prayer_is_host', 'true');
      localStorage.setItem('jg_prayer_is_moderator', 'true');
      localStorage.setItem('jg_prayer_moderator_key', 'jgprayer2026');
    }
  }, []);

  useEffect(() => {
    if (userRole === 'host') {
      localStorage.setItem('jg_prayer_is_host', 'true');
      localStorage.setItem('jg_prayer_is_moderator', 'true');
      localStorage.setItem('jg_prayer_moderator_key', 'jgprayer2026');
    } else if (userRole === 'admin') {
      localStorage.setItem('jg_prayer_is_moderator', 'true');
      if (!localStorage.getItem('jg_prayer_moderator_key')) {
        localStorage.setItem('jg_prayer_moderator_key', 'jgprayer2026');
      }
    }
  }, [userRole]);

  // Helper to immediately apply volume & unMute to live players
  const applyLiveVolume = (customLocalVol?: number, customMasterVol?: number, customMuted?: boolean) => {
    const isMuted = customMuted !== undefined ? customMuted : isLocalAudioMuted;
    const lVol = customLocalVol !== undefined ? customLocalVol : localAudioVolume;
    const mVol = customMasterVol !== undefined 
      ? customMasterVol 
      : (typeof roomState.background_audio_volume === 'number' ? roomState.background_audio_volume : 30);
    const effective = isMuted ? 0 : Math.max(0, Math.min(100, Math.round((lVol / 100) * mVol)));

    if (ytPlayerRef.current) {
      try {
        if (isMuted) {
          if (typeof ytPlayerRef.current.mute === 'function') ytPlayerRef.current.mute();
        } else {
          if (typeof ytPlayerRef.current.unMute === 'function') ytPlayerRef.current.unMute();
          if (typeof ytPlayerRef.current.setVolume === 'function') ytPlayerRef.current.setVolume(effective);
        }
      } catch (e) {}
    }

    if (bgAudioRef.current) {
      bgAudioRef.current.muted = isMuted;
      bgAudioRef.current.volume = effective / 100;
    }
  };

  // Background Audio / YouTube Audio-Only Player Synchronization
  useEffect(() => {
    const url = (roomState.background_audio_url || '').trim();
    const ytId = extractYouTubeId(url);
    const shouldPlay = Boolean(roomState.is_audio_playing && !isLocalAudioMuted && url);
    const masterVol = typeof roomState.background_audio_volume === 'number' ? roomState.background_audio_volume : 30;
    const effectiveVol = isLocalAudioMuted ? 0 : Math.max(0, Math.min(100, Math.round((localAudioVolume / 100) * masterVol)));

    if (ytId) {
      // Pause HTML5 audio
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }

      loadYouTubeIframeApi().then(() => {
        if (!ytPlayerRef.current) {
          currentYtIdRef.current = ytId;
          ytPlayerRef.current = new (window as any).YT.Player('jg-yt-bg-player', {
            height: '1',
            width: '1',
            videoId: ytId,
            playerVars: {
              autoplay: shouldPlay ? 1 : 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              loop: 1,
              playlist: ytId,
              playsinline: 1,
              rel: 0
            },
            events: {
              onReady: (evt: any) => {
                try {
                  if (!isLocalAudioMuted) {
                    evt.target.unMute();
                  }
                  evt.target.setVolume(effectiveVol);
                  if (shouldPlay) {
                    evt.target.playVideo();
                  }
                } catch (e) {}
              },
              onStateChange: (evt: any) => {
                // 0 is ENDED -> Loop back and keep playing forever
                if (evt.data === 0) {
                  try {
                    evt.target.seekTo(0, true);
                    evt.target.playVideo();
                  } catch (e) {}
                }
              }
            }
          });
        } else {
          if (currentYtIdRef.current !== ytId) {
            currentYtIdRef.current = ytId;
            try {
              ytPlayerRef.current.loadVideoById({ videoId: ytId });
            } catch (e) {}
          }
          try {
            if (isLocalAudioMuted) {
              if (typeof ytPlayerRef.current.mute === 'function') ytPlayerRef.current.mute();
            } else {
              if (typeof ytPlayerRef.current.unMute === 'function') ytPlayerRef.current.unMute();
              if (typeof ytPlayerRef.current.setVolume === 'function') ytPlayerRef.current.setVolume(effectiveVol);
            }
            if (shouldPlay) {
              ytPlayerRef.current.playVideo();
            } else {
              ytPlayerRef.current.pauseVideo();
            }
          } catch (e) {}
        }
      });
    } else if (url) {
      // Direct stream / MP3 URL
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
      }
      if (bgAudioRef.current) {
        if (bgAudioRef.current.src !== url) {
          bgAudioRef.current.src = url;
        }
        bgAudioRef.current.loop = true;
        bgAudioRef.current.muted = isLocalAudioMuted;
        bgAudioRef.current.volume = effectiveVol / 100;
        bgAudioRef.current.onended = () => {
          try {
            bgAudioRef.current!.currentTime = 0;
            bgAudioRef.current!.play().catch(() => {});
          } catch (e) {}
        };
        if (shouldPlay) {
          bgAudioRef.current.play().catch(() => {});
        } else {
          bgAudioRef.current.pause();
        }
      }
    } else {
      // No background sound URL
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch (e) {}
      }
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
      }
    }
  }, [
    roomState.background_audio_url,
    roomState.is_audio_playing,
    roomState.background_audio_volume,
    isLocalAudioMuted,
    localAudioVolume
  ]);

  // Instrumental Infinite Looping Watchdog
  useEffect(() => {
    const url = (roomState.background_audio_url || '').trim();
    const ytId = extractYouTubeId(url);
    const shouldPlay = Boolean(roomState.is_audio_playing && !isLocalAudioMuted && url);

    const interval = setInterval(() => {
      if (!shouldPlay) return;
      if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        try {
          const st = ytPlayerRef.current.getPlayerState();
          // If video ended (0) or stopped while it should be playing
          if (st === 0) {
            ytPlayerRef.current.seekTo(0, true);
            ytPlayerRef.current.playVideo();
          }
        } catch (e) {}
      } else if (!ytId && bgAudioRef.current) {
        if (bgAudioRef.current.paused && bgAudioRef.current.src) {
          bgAudioRef.current.play().catch(() => {});
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [roomState.background_audio_url, roomState.is_audio_playing, isLocalAudioMuted]);

  const canModerate = userRole === 'host' || userRole === 'admin';

  // --- LiveKit Cloud Voice Room Connection ---
  useEffect(() => {
    if (!userName || !isInCall) return;

    let isSubscribed = true;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    roomRef.current = room;

    // When remote participant starts speaking/audio arrives
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        console.log('[LiveKit] Subscribed to remote audio from:', participant.identity);
        const audioEl = track.attach();
        audioEl.id = `livekit-audio-${participant.identity}`;
        audioEl.setAttribute('playsinline', 'true');
        audioEl.setAttribute('webkit-playsinline', 'true');
        (audioEl as any).playsInline = true;
        document.body.appendChild(audioEl);
        audioEl.play().catch(e => {
          console.warn('[LiveKit] Remote audio waiting for user gesture:', e);
        });
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach(el => el.remove());
    });

    // Active speaker detection (highlights who is talking with glowing halo)
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const speakerIds = new Set(speakers.map(s => s.identity));
      setParticipants(prev => prev.map(p => ({
        ...p,
        isSpeaking: speakerIds.has(p.id)
      })));
      setIsSpeaking(speakerIds.has(userId));
    });

    // Connect to LiveKit Cloud
    prayerRoomStore.getLiveKitToken(userId, userName).then(async (data) => {
      if (!isSubscribed) return;
      if (data && data.token) {
        try {
          await room.connect(data.url, data.token);
          console.log('[LiveKit] Connected successfully to Cloud room:', data.room);
        } catch (err) {
          console.error('[LiveKit] Connection error:', err);
        }
      }
    });

    return () => {
      isSubscribed = false;
      room.disconnect();
      roomRef.current = null;
      document.querySelectorAll('[id^="livekit-audio-"]').forEach(el => el.remove());
    };
  }, [userName, isInCall, userId]);

  // Connect & Sync (Stable across chat drawer opening/closing)
  useEffect(() => {
    prayerRoomStore.getState().then(res => {
      setRoomState(res.state);
    });

    prayerRoomStore.getMessages().then(res => {
      if (res && res.messages) {
        setMessages(res.messages);
        if (res.pinned_message) {
          setPinnedMessage(res.pinned_message);
        }
      }
    });

    prayerRoomStore.getStickers().then(stks => {
      if (Array.isArray(stks)) {
        setCustomStickers(stks);
      }
    });

    prayerRoomStore.getCallParticipants().then(pts => {
      setParticipants(pts);
    });

    const unsubscribe = prayerRoomStore.subscribeToEvents({
      onMessage: (msg) => {
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(msg.id))) return prev;
          return [...prev, msg];
        });
        if (!isChatOpenRef.current) {
          setUnreadChatCount(prev => prev + 1);
        }
      },
      onMessagePinned: (data) => {
        if (data.is_pinned && data.message) {
          setPinnedMessage(data.message);
        } else {
          setPinnedMessage(null);
        }
      },
      onNewSticker: (stk) => {
        setCustomStickers(prev => [stk, ...prev.filter(s => String(s.id) !== String(stk.id))]);
      },
      onDeletedSticker: (deletedId) => {
        setCustomStickers(prev => prev.filter(s => String(s.id) !== String(deletedId)));
      },
      onMessageDeleted: (deletedId) => {
        setMessages(prev => prev.filter(m => String(m.id) !== String(deletedId)));
        if (pinnedMessage && String(pinnedMessage.id) === String(deletedId)) {
          setPinnedMessage(null);
        }
      },
      onChatCleared: () => {
        setMessages([]);
        setPinnedMessage(null);
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
        if (targetId === userId || targetId === userName) {
          setIsInCall(false);
          stopMic();
          if (roomRef.current) {
            roomRef.current.disconnect();
          }
          setIsKicked(true);
          alert('You have been removed from the live prayer room by an administrator for violating altar rules.');
        }
      }
    }, userId);

    return () => {
      unsubscribe();
      stopMic();
      prayerRoomStore.leaveCall(userId);
    };
  }, [userId]);

  // Immediately leave call when browser tab or window is closed
  useEffect(() => {
    const handleTabClose = () => {
      if (userId) {
        prayerRoomStore.leaveCall(userId);
      }
    };
    window.addEventListener('beforeunload', handleTabClose);
    window.addEventListener('pagehide', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('pagehide', handleTabClose);
    };
  }, [userId]);

  // Join call once name is known
  useEffect(() => {
    if (userName && isInCall) {
      const colorIndex = Math.abs(userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
      prayerRoomStore.joinCall(userId, userName, userRole, AVATAR_COLORS[colorIndex], userAvatar).then(roster => {
        if (roster && roster.length > 0) {
          setParticipants(roster);
        }
      });
    }
  }, [userName, isInCall, userRole, userAvatar]);

  // Auto scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadChatCount(0);
    }
  }, [messages, isChatOpen]);

  const handleForceMuted = async () => {
    if (roomRef.current && roomRef.current.localParticipant) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
    }
    setIsMuted(true);
    setIsSpeaking(false);
    prayerRoomStore.updateMicState(userId, true, false);
    alert('A moderator has muted your microphone.');
  };

  const handleForceUnmuted = async () => {
    if (roomRef.current && roomRef.current.localParticipant) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
        prayerRoomStore.updateMicState(userId, false, false);
        alert('A moderator has unmuted your microphone.');
        return;
      } catch (e) {}
    }
    toggleMic();
  };

  // Toggle Mic (LiveKit Cloud Voice Audio)
  const toggleMic = async () => {
    if (isKicked) {
      alert('You have been removed from this live prayer call by an administrator for violating rules.');
      return;
    }
    if (!isInCall) {
      alert('Please reconnect to the call first.');
      return;
    }

    unlockAllAudio();

    const room = roomRef.current;

    if (!isMuted) {
      // Muting
      try {
        if (room && room.localParticipant) {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (e) {
        console.warn('[LiveKit] Mute warning:', e);
      }
      setIsMuted(true);
      setIsSpeaking(false);
      prayerRoomStore.updateMicState(userId, true, false);
    } else {
      // Unmuting
      try {
        if (room && room.state !== 'connected') {
          const data = await prayerRoomStore.getLiveKitToken(userId, userName || 'Intercessor');
          if (data && data.token) {
            await room.connect(data.url, data.token);
          }
        }
        if (room && room.localParticipant) {
          await room.localParticipant.setMicrophoneEnabled(true);
        }
        setIsMuted(false);
        prayerRoomStore.updateMicState(userId, false, false);
      } catch (err) {
        console.error('[LiveKit] Mic access error:', err);
        alert('Could not access microphone. Please check your phone or browser microphone permissions.');
      }
    }
  };

  const stopMic = () => {
    if (roomRef.current && roomRef.current.localParticipant) {
      roomRef.current.localParticipant.setMicrophoneEnabled(false).catch(() => {});
    }
  };

  // Leave call cleanly without popping up the profile modal
  const handleLeaveCall = () => {
    stopMic();
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    setIsMuted(true);
    setIsSpeaking(false);
    setIsInCall(false);
    prayerRoomStore.leaveCall(userId);
  };

  // Rejoin call using existing name/photo
  const handleJoinCall = () => {
    if (isKicked) {
      alert('You have been removed from this live prayer call by an administrator for violating rules.');
      return;
    }
    if (!userName.trim()) {
      setNameInput('');
      setAvatarInput('');
      setIsNamePromptOpen(true);
      return;
    }
    setIsInCall(true);
    const colorIndex = Math.abs(userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
    prayerRoomStore.joinCall(userId, userName, userRole, AVATAR_COLORS[colorIndex], userAvatar).then(roster => {
      if (roster && roster.length > 0) {
        setParticipants(roster);
      }
    });
  };

  const handleOpenProfileModal = () => {
    if (isKicked) {
      alert('You have been removed from this live prayer call by an administrator for violating rules.');
      return;
    }
    setNameInput(userName);
    setAvatarInput(userAvatar);
    setIsNamePromptOpen(true);
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 160;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarInput(dataUrl);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  const handleAdminKick = async (targetId: string, targetName?: string) => {
    setSelectedParticipantMenu(null);
    if (confirm(`Kick ${targetName || 'this user'} out from the live prayer room for violating rules?`)) {
      await prayerRoomStore.executeAdminAction('kick', targetId, undefined, userId);
    }
  };

  const handleAdminKickByName = async (nameToKick: string) => {
    if (confirm(`Kick "${nameToKick}" out from the live session for violating rules?`)) {
      const match = participants.find(p => p.name.toLowerCase() === nameToKick.toLowerCase());
      if (match) {
        await prayerRoomStore.executeAdminAction('kick', match.id, undefined, userId);
      } else {
        await prayerRoomStore.executeAdminAction('kick', nameToKick, undefined, userId);
      }
    }
  };

  // Listener Personal Audio Controls (Device Only - does not affect others)
  const handleToggleLocalAudio = () => {
    const next = !isLocalAudioMuted;
    setIsLocalAudioMuted(next);
    localStorage.setItem('jg_prayer_local_audio_muted', String(next));
    applyLiveVolume(undefined, undefined, next);
    if (!next) {
      unlockAllAudio();
    }
  };

  const handleLocalVolumeChange = (vol: number) => {
    setLocalAudioVolume(vol);
    localStorage.setItem('jg_prayer_local_audio_volume', String(vol));
    applyLiveVolume(vol, undefined, false);
  };

  // Altar Admin & Host Master Audio Controls
  const handleToggleRoomAudio = async () => {
    const nextPlaying = !roomState.is_audio_playing;
    try {
      await prayerRoomStore.updateState({ is_audio_playing: nextPlaying });
      setRoomState(prev => ({ ...prev, is_audio_playing: nextPlaying }));
      if (nextPlaying) {
        unlockAllAudio();
      }
    } catch (e: any) {
      alert(e.message || 'Failed to toggle altar background audio');
    }
  };

  const handleUpdateRoomVolume = async (newVol: number) => {
    try {
      setRoomState(prev => ({ ...prev, background_audio_volume: newVol }));
      applyLiveVolume(undefined, newVol, undefined);
      await prayerRoomStore.updateState({ background_audio_volume: newVol });
    } catch (e: any) {
      console.warn('Failed to update room master volume:', e);
    }
  };

  // Host Only: Music URL Modal and Change Handler
  const handleOpenMusicModal = () => {
    setMusicUrlInput(roomState.background_audio_url || '');
    setMusicModalError('');
    setIsMusicModalOpen(true);
  };

  const handleSaveMusicUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setMusicModalError('');
    setIsSavingMusic(true);
    try {
      const cleanUrl = musicUrlInput.trim();
      await prayerRoomStore.updateState({
        background_audio_url: cleanUrl,
        is_host: true
      });
      setRoomState(prev => ({ ...prev, background_audio_url: cleanUrl }));
      setIsMusicModalOpen(false);
      alert('Background worship audio link updated for the prayer room!');
    } catch (err: any) {
      setMusicModalError(err.message || 'Failed to update background music. Only the host can change this link.');
    } finally {
      setIsSavingMusic(false);
    }
  };

  // Pin / Unpin message (Admins and Host)
  const handlePinMessage = async (msgId: string | number, shouldPin: boolean) => {
    const isHost = userRole === 'host' || localStorage.getItem('jg_prayer_is_host') === 'true';
    const modKey = localStorage.getItem('jg_prayer_moderator_key') || (isHost ? 'jgprayer2026' : '');
    const success = await prayerRoomStore.pinMessage(msgId, shouldPin, modKey);
    if (success) {
      if (shouldPin) {
        const found = messages.find(m => String(m.id) === String(msgId));
        if (found) {
          setPinnedMessage({ ...found, is_pinned: true });
        }
      } else {
        setPinnedMessage(null);
      }
    } else {
      alert('Failed to update pinned message. Admin authorization required.');
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

    const trimmedKey = keyInput.trim();
    const success = await prayerRoomStore.verifyModeratorKey(trimmedKey, userId);
    if (success) {
      setUserRole('admin');
      localStorage.setItem('jg_prayer_is_moderator', 'true');
      localStorage.setItem('jg_prayer_moderator_key', trimmedKey);
      setIsKeyModalOpen(false);
      setKeyInput('');
      alert('Moderator privileges granted! You now have full altar moderation powers.');
    } else {
      setKeyError('Invalid moderator secret key. Please check and try again.');
    }
  };

  const LINK_REGEX = /(https?:\/\/|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|io|ng|co|app|me|xyz|top|site|link|info|live|tv|cc|biz|online|tech|store|shop|club|edu|gov)\b)/i;

  // Send Chat Message (Click send button only, Enter key inserts newline without sending)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isSendingMessage) return;
    const text = newMessage.trim();

    // Check link restriction for non-admins
    if (!canModerate && LINK_REGEX.test(text)) {
      alert('Posting links in the prayer room chat is not allowed. Only altar administrators can post links.');
      return;
    }

    setNewMessage('');
    setIsSendingMessage(true);

    try {
      const modKey = localStorage.getItem('jg_prayer_moderator_key') || '';
      const sent = await prayerRoomStore.sendMessage(
        userName || 'Intercessor',
        text,
        'message',
        undefined,
        modKey
      );
      if (sent) {
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(sent.id))) return prev;
          return [...prev, sent];
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Send Preset Sticker (Deduplicated against SSE broadcast)
  const handleSendPresetSticker = async (sticker: typeof STICKERS[0]) => {
    setShowStickerPicker(false);
    const sent = await prayerRoomStore.sendMessage(
      userName || 'Intercessor',
      `${sticker.emoji} ${sticker.label}`,
      'sticker',
      sticker.id
    );
    if (sent) {
      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(sent.id))) return prev;
        return [...prev, sent];
      });
    }
  };

  // Send Custom Altar Sticker with Image (WhatsApp / Telegram style)
  const handleSendCustomSticker = async (sticker: CustomSticker) => {
    setShowStickerPicker(false);
    const sent = await prayerRoomStore.sendMessage(
      userName || 'Intercessor',
      sticker.label,
      'sticker',
      sticker.image_url || sticker.id
    );
    if (sent) {
      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(sent.id))) return prev;
        return [...prev, sent];
      });
    }
  };

  // Handle Image Upload for Custom Sticker (Canvas compression to lightweight PNG)
  const handleStickerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStickerError('Please select a valid image file (PNG, JPG, WebP, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 280;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png', 0.85);
          setNewStickerImage(compressed);
          setStickerError('');
        }
      };
      img.src = loadEvt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Admin Create Custom Sticker
  const handleCreateCustomSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStickerLabel.trim()) {
      setStickerError('Please provide a sticker title / label (e.g., Breakthrough, Holy Ghost Fire).');
      return;
    }
    if (!newStickerImage) {
      setStickerError('Please upload an image for your sticker.');
      return;
    }

    setIsUploadingSticker(true);
    setStickerError('');

    try {
      const adminKey = localStorage.getItem('jg_prayer_moderator_key') || 'jgprayer2026';
      const created = await prayerRoomStore.createCustomSticker({
        label: newStickerLabel.trim(),
        image_url: newStickerImage,
        emoji: newStickerEmoji || '🙏',
        color: 'from-amber-500 to-amber-600 text-white',
        admin_key: adminKey
      });

      if (created) {
        setCustomStickers(prev => [created, ...prev.filter(s => String(s.id) !== String(created.id))]);
        setIsCreateStickerOpen(false);
        setNewStickerLabel('');
        setNewStickerImage('');
        setNewStickerEmoji('🔥');
      }
    } catch (err: any) {
      setStickerError(err.message || 'Failed to create custom sticker. Moderator access required.');
    } finally {
      setIsUploadingSticker(false);
    }
  };

  // Admin Delete Custom Sticker
  const handleDeleteCustomSticker = async (e: React.MouseEvent, stickerId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this custom sticker for everyone?')) {
      return;
    }
    const adminKey = localStorage.getItem('jg_prayer_moderator_key') || 'jgprayer2026';
    const ok = await prayerRoomStore.deleteCustomSticker(stickerId, adminKey);
    if (ok) {
      setCustomStickers(prev => prev.filter(s => String(s.id) !== String(stickerId)));
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

  // Save Name & Optional Profile Image
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      const clean = nameInput.trim();
      setUserName(clean);
      setUserAvatar(avatarInput);
      localStorage.setItem('jg_prayer_user_name', clean);
      if (avatarInput) {
        localStorage.setItem('jg_prayer_user_avatar', avatarInput);
      } else {
        localStorage.removeItem('jg_prayer_user_avatar');
      }
      setIsInCall(true);
      const colorIndex = Math.abs(clean.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % AVATAR_COLORS.length;
      prayerRoomStore.joinCall(userId, clean, userRole, AVATAR_COLORS[colorIndex], avatarInput).then(roster => {
        if (roster && roster.length > 0) {
          setParticipants(roster);
        }
      });
      setIsNamePromptOpen(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 text-gray-900 flex flex-col relative font-sans"
      onClickCapture={unlockAllAudio}
      onTouchStartCapture={unlockAllAudio}
    >
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

            {/* Edit Profile / Details Button */}
            <button
              onClick={handleOpenProfileModal}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold cursor-pointer transition-colors"
              title="Edit your name & profile photo"
            >
              <Edit3 className="w-3.5 h-3.5 text-royal-blue-600" />
              <span className="hidden sm:inline">Edit Details</span>
              <span className="sm:hidden">Edit</span>
            </button>

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

      {/* Hidden Audio Elements: YouTube Audio-Only Player & HTML5 Audio fallback */}
      <div
        id="jg-yt-bg-container"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0.001,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <div id="jg-yt-bg-player" />
      </div>
      <audio
        ref={bgAudioRef}
        preload="auto"
        loop
        playsInline
        style={{ display: 'none' }}
      />

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

      {/* Altar Background Worship Instrumental Bar */}
      <div className="bg-gradient-to-r from-royal-blue-900 via-royal-blue-800 to-indigo-950 text-white border-b border-royal-blue-700/60 px-3 py-2 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Status & Now Playing Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
              roomState.is_audio_playing && roomState.background_audio_url
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                : 'bg-white/10 text-white/60'
            }`}>
              <Music className={`w-4 h-4 ${roomState.is_audio_playing && roomState.background_audio_url && !isLocalAudioMuted ? 'animate-pulse' : ''}`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300">
                  Background Worship Instrumental
                </span>
                {roomState.is_audio_playing && roomState.background_audio_url ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Playing {isLocalAudioMuted ? '(Muted for you)' : 'Live • Auto-Loop'}
                  </span>
                ) : roomState.background_audio_url ? (
                  <span className="text-[10px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                    Paused by Admin
                  </span>
                ) : (
                  <span className="text-[10px] text-white/50 italic">
                    (No instrumental set)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 truncate max-w-xs sm:max-w-md">
                {roomState.background_audio_url
                  ? extractYouTubeId(roomState.background_audio_url)
                    ? 'YouTube Worship Stream (Playing audio-only in background • Auto-Looping)'
                    : 'Direct Audio Stream (Playing in background • Auto-Looping)'
                  : 'Host can add a YouTube or audio link to play peaceful worship instrumental in the background.'}
              </p>
            </div>
          </div>

          {/* Sound Controls Section */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between md:justify-end">
            {/* 1. Individual Listener Personal Mute / Volume (Device Only - does NOT affect others) */}
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={handleToggleLocalAudio}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  isLocalAudioMuted
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 hover:bg-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title={isLocalAudioMuted ? 'Unmute instrumental on your device' : 'Mute instrumental on your device only'}
              >
                {isLocalAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isLocalAudioMuted ? 'My Instrumental: OFF' : 'My Instrumental: ON'}</span>
              </button>

              {!isLocalAudioMuted && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-white/15">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localAudioVolume}
                    onChange={(e) => handleLocalVolumeChange(Number(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 accent-amber-400 bg-white/20 rounded-lg cursor-pointer"
                    title={`Personal Instrumental Volume: ${localAudioVolume}%`}
                  />
                  <span className="text-[10px] text-white/80 font-mono w-7 text-right">
                    {localAudioVolume}%
                  </span>
                </div>
              )}
            </div>

            {/* 2. Admin & Host Room Instrumental Controls */}
            {canModerate && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 px-2.5 py-1.5 rounded-xl text-xs">
                {/* Master Sound On/Off for all participants */}
                <button
                  type="button"
                  onClick={handleToggleRoomAudio}
                  disabled={!roomState.background_audio_url}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    roomState.is_audio_playing
                      ? 'bg-amber-400 text-royal-blue-950 hover:bg-amber-300 shadow-xs'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                  title={roomState.is_audio_playing ? 'Turn off instrumental for everyone' : 'Turn on instrumental for everyone'}
                >
                  {roomState.is_audio_playing ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{roomState.is_audio_playing ? 'Room Instrumental: ON' : 'Room Instrumental: OFF'}</span>
                </button>

                {/* Master Volume Slider (Admins & Host) */}
                <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-amber-400/20">
                  <span className="text-[10px] text-amber-200 font-medium">Master:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={typeof roomState.background_audio_volume === 'number' ? roomState.background_audio_volume : 30}
                    onChange={(e) => handleUpdateRoomVolume(Number(e.target.value))}
                    className="w-14 sm:w-16 h-1.5 accent-amber-300 bg-white/20 rounded-lg cursor-pointer"
                    title={`Room Master Instrumental Volume: ${roomState.background_audio_volume ?? 30}%`}
                  />
                  <span className="text-[10px] text-amber-200 font-mono">
                    {roomState.background_audio_volume ?? 30}%
                  </span>
                </div>
              </div>
            )}

            {/* 3. Host-Exclusive Button: Change or Add Music Link */}
            {userRole === 'host' && (
              <button
                type="button"
                onClick={handleOpenMusicModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gold-500 hover:bg-gold-400 text-royal-blue-950 font-bold text-xs rounded-xl border border-gold-300 shadow-xs cursor-pointer transition-all hover:scale-105"
                title="Change background instrumental link (Host only)"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{roomState.background_audio_url ? 'Change Music Link' : '+ Add Music Link'}</span>
              </button>
            )}
          </div>
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
                          onClick={() => handleAdminKick(p.id, p.name)}
                          className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold border-t border-gray-100"
                        >
                          <UserX className="w-3.5 h-3.5 text-rose-600" />
                          <span>Kick Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar with Mic Indicator */}
                <div className="relative my-2">
                  <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full ${p.avatarColor || 'bg-royal-blue-600'} text-white font-bold text-xl flex items-center justify-center shadow-md overflow-hidden`}>
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      initials
                    )}
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

                {isMe && (
                  <button
                    type="button"
                    onClick={handleOpenProfileModal}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-royal-blue-600 hover:text-royal-blue-800 bg-royal-blue-50 hover:bg-royal-blue-100 px-2 py-0.5 rounded-full border border-royal-blue-200 cursor-pointer transition-colors shadow-2xs"
                    title="Change your name or profile photo"
                  >
                    <Edit3 className="w-2.5 h-2.5 text-royal-blue-600" />
                    <span>Edit Details</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Bottom Simple Control Dock - Responsive 4-Column Grid that never overflows */}
      <div className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] max-w-lg px-1 sm:px-2">
        <div className="bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl shadow-xl p-1.5 sm:p-2.5 grid grid-cols-4 gap-1.5 sm:gap-2 items-center">
          
          {/* Mute / Unmute Button */}
          <button
            onClick={toggleMic}
            className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-xs min-w-0 ${
              !isMuted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
            title={!isMuted ? 'Mute Mic' : 'Unmute Mic'}
          >
            {!isMuted ? (
              <>
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 animate-pulse text-white" />
                <span className="truncate">Mute</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-rose-600" />
                <span className="truncate">Unmute</span>
              </>
            )}
          </button>

          {/* Amen Reaction Button */}
          <button
            onClick={() => triggerReaction('amen')}
            className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-200 font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-colors min-w-0"
            title="Tap Amen"
          >
            <span className="shrink-0 text-xs sm:text-sm">🙏</span>
            <span className="truncate">Amen</span>
          </button>

          {/* Toggle Chat Drawer */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`relative py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-colors min-w-0 ${
              isChatOpen
                ? 'bg-royal-blue-600 text-white border-royal-blue-600 shadow-xs'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
            title="Open Chat Drawer"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-bold truncate">Message</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Leave Call / Join Call Button */}
          {isInCall ? (
            <button
              onClick={handleLeaveCall}
              className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-colors bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 min-w-0"
              title="Leave Call"
            >
              <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              <span className="font-bold truncate">Leave</span>
            </button>
          ) : (
            <button
              onClick={handleJoinCall}
              className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 min-w-0"
              title="Join Call"
            >
              <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="font-bold truncate">Join</span>
            </button>
          )}
        </div>
      </div>

      {/* Slide-over Clean Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white border-l border-gray-200 shadow-2xl flex flex-col h-[100dvh] overflow-hidden overscroll-none">
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

          {/* Pinned Message Banner */}
          {pinnedMessage && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-start justify-between gap-2 shadow-2xs">
              <div className="flex items-start gap-2 min-w-0">
                <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                      Pinned Message
                    </span>
                    <span className="text-[11px] font-bold text-royal-blue-900 truncate">
                      • {pinnedMessage.user_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap break-words mt-0.5">
                    {pinnedMessage.message}
                  </p>
                </div>
              </div>
              {canModerate && (
                <button
                  type="button"
                  onClick={() => handlePinMessage(pinnedMessage.id, false)}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 hover:underline shrink-0 p-1 cursor-pointer"
                  title="Unpin message"
                >
                  Unpin
                </button>
              )}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs">
                <p>No messages yet. Send a message, prayer point, or sticker!</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSticker = msg.type === 'sticker' || !!msg.sticker;
                const isThisPinned = String(pinnedMessage?.id) === String(msg.id);

                return (
                  <div key={msg.id || idx} className="flex flex-col gap-0.5 group">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-royal-blue-900 truncate">{msg.user_name}</span>
                        {isThisPinned && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 shrink-0">
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {canModerate && (
                          <>
                            {!isSticker && (
                              <button
                                onClick={() => handlePinMessage(msg.id, !isThisPinned)}
                                className={`p-0.5 cursor-pointer transition-opacity ${
                                  isThisPinned
                                    ? 'text-amber-600 opacity-100'
                                    : 'text-gray-300 hover:text-amber-600 opacity-0 group-hover:opacity-100'
                                }`}
                                title={isThisPinned ? 'Unpin message' : 'Pin message to top'}
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-gray-300 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            {msg.user_name !== userName && (
                              <button
                                onClick={() => handleAdminKickByName(msg.user_name)}
                                className="text-gray-300 hover:text-rose-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title={`Kick "${msg.user_name}" out from live`}
                              >
                                <UserX className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {isSticker ? (
                      msg.sticker && (msg.sticker.startsWith('data:image') || msg.sticker.startsWith('http') || msg.sticker.startsWith('/')) ? (
                        <div className="inline-flex flex-col items-center p-2 rounded-2xl bg-white/95 border border-royal-blue-100/70 shadow-xs max-w-[175px] backdrop-blur-xs">
                          <img
                            src={msg.sticker}
                            alt={msg.message}
                            className="w-28 h-28 object-contain drop-shadow-xs rounded-xl"
                            loading="lazy"
                          />
                          <span className="mt-1.5 px-2.5 py-0.5 rounded-full bg-royal-blue-50 text-[10px] font-bold text-royal-blue-900 uppercase tracking-wider text-center leading-tight">
                            {msg.message}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-gradient-to-r from-royal-blue-50 to-gold-50 border border-royal-blue-100 shadow-xs inline-block max-w-[200px]">
                          <div className="text-3xl mb-1">{msg.message.split(' ')[0]}</div>
                          <p className="text-[10px] font-bold text-royal-blue-900 uppercase tracking-wider">
                            {msg.message.substring(msg.message.indexOf(' ') + 1) || msg.message}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-800 shadow-2xs whitespace-pre-wrap break-words leading-relaxed">
                        {msg.message}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* WhatsApp / Telegram Style Stickers Drawer */}
          {showStickerPicker && (
            <div className="p-3 bg-white border-t border-gray-200 flex flex-col gap-2 max-h-64 overflow-y-auto">
              {/* Header with Tabs and Admin Sticker Creator */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setStickerTab('custom')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      stickerTab === 'custom'
                        ? 'bg-royal-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-slate-100'
                    }`}
                  >
                    Custom Stickers ({customStickers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStickerTab('preset')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      stickerTab === 'preset'
                        ? 'bg-royal-blue-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-slate-100'
                    }`}
                  >
                    Presets
                  </button>
                </div>

                {canModerate && (
                  <button
                    type="button"
                    onClick={() => setIsCreateStickerOpen(true)}
                    className="px-2 py-1 rounded-lg bg-gold-50 hover:bg-gold-100 border border-gold-300 text-gold-900 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Create custom sticker with your image (Admin)"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold-700" />
                    <span>New Sticker</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Custom Altar Stickers */}
              {stickerTab === 'custom' && (
                <div>
                  {customStickers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      <p>No custom stickers yet.</p>
                      {canModerate && (
                        <button
                          type="button"
                          onClick={() => setIsCreateStickerOpen(true)}
                          className="mt-2 text-royal-blue-600 font-bold hover:underline"
                        >
                          + Upload First Custom Sticker
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {customStickers.map((stk) => (
                        <div
                          key={stk.id}
                          onClick={() => handleSendCustomSticker(stk)}
                          className="relative group p-2 rounded-xl bg-slate-50 hover:bg-royal-blue-50/50 border border-gray-200 hover:border-royal-blue-300 flex items-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.02] transition-all"
                        >
                          {stk.image_url ? (
                            <img
                              src={stk.image_url}
                              alt={stk.label}
                              className="w-10 h-10 object-contain rounded-lg shrink-0 bg-white border border-gray-100 p-0.5"
                            />
                          ) : (
                            <span className="text-2xl shrink-0">{stk.emoji || '🙏'}</span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{stk.label}</p>
                            <span className="text-[9px] text-gray-400 uppercase font-semibold">Altar Sticker</span>
                          </div>

                          {canModerate && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomSticker(e, stk.id)}
                              className="absolute top-1 right-1 p-1 rounded-md bg-white/80 hover:bg-rose-50 text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                              title="Delete sticker for everyone (Admin only)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Preset Badges */}
              {stickerTab === 'preset' && (
                <div className="grid grid-cols-2 gap-2">
                  {STICKERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSendPresetSticker(s)}
                      className={`p-2 rounded-xl bg-gradient-to-r ${s.color} flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02] transition-transform`}
                    >
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-[10px] font-bold leading-tight truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
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

          {/* Chat Input - Multiline textarea, Enter key adds newline, Send ONLY on button click */}
          <div className="p-3 border-t border-gray-200 bg-white flex items-end gap-2">
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a prayer or message..."
              className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm text-gray-900 focus:outline-none focus:border-royal-blue-500 resize-none leading-relaxed min-h-[42px] max-h-32"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!newMessage.trim() || isSendingMessage}
              className="p-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 disabled:opacity-50 text-white cursor-pointer transition-colors shrink-0 shadow-xs mb-0.5"
              title="Click to send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
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

      {/* Custom Sticker Creator Modal (Admin Only, WhatsApp / Telegram style) */}
      {isCreateStickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Create Custom Sticker</h3>
                  <p className="text-[11px] text-gray-500">WhatsApp & Telegram style altar sticker</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateStickerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stickerError && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {stickerError}
              </div>
            )}

            <form onSubmit={handleCreateCustomSticker} className="space-y-4">
              {/* Sticker Image Picker & Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sticker Image (PNG, JPG, WebP, GIF)
                </label>
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-royal-blue-400 rounded-2xl p-4 bg-slate-50 transition-colors">
                  {newStickerImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                        <img
                          src={newStickerImage}
                          alt="Sticker Preview"
                          className="w-24 h-24 object-contain"
                        />
                      </div>
                      <label className="text-[11px] font-bold text-royal-blue-600 hover:underline cursor-pointer">
                        Change Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStickerFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer w-full py-3">
                      <div className="w-12 h-12 rounded-full bg-royal-blue-50 text-royal-blue-600 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        Click to choose sticker image
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Automatic transparent resize & optimization
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStickerFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Sticker Label */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sticker Label / Title
                </label>
                <input
                  type="text"
                  value={newStickerLabel}
                  onChange={(e) => setNewStickerLabel(e.target.value)}
                  placeholder="e.g. Mighty Breakthrough, Holy Ghost Fire"
                  maxLength={60}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-royal-blue-500"
                  required
                />
              </div>

              {/* Quick Emoji Tag */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reaction Emoji Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['🙏', '🔥', '🕊️', '🦁', '👑', '⚡', '✝️', '📖', '🎺', '❤️'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setNewStickerEmoji(em)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer transition-all ${
                        newStickerEmoji === em
                          ? 'bg-royal-blue-600 text-white scale-110 shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-gray-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateStickerOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingSticker || !newStickerImage || !newStickerLabel.trim()}
                  className="px-5 py-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {isUploadingSticker ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Sticker...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                      <span>Publish Sticker</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Name & Photo Profile Modal */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-royal-blue-100 text-royal-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              {userName && (
                <button
                  type="button"
                  onClick={() => setIsNamePromptOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <h3 className="text-base font-bold text-gray-900">
              {userName ? 'Altar Profile & Name' : 'Join 24/7 Prayer Room'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 mb-4">
              Enter your name and an optional photo so brethren recognize you on the altar:
            </p>

            <form onSubmit={handleSaveName} className="space-y-4">
              {/* Optional Photo Upload */}
              <div className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 border border-gray-200 rounded-xl">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-gray-300 hover:border-royal-blue-500 overflow-hidden flex items-center justify-center cursor-pointer transition-colors shadow-2xs">
                    {avatarInput ? (
                      <img
                        src={avatarInput}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-royal-blue-600">
                        <Camera className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1">Add Photo</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-royal-blue-600 hover:bg-royal-blue-700 text-white shadow-md cursor-pointer transition-transform group-hover:scale-110">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-royal-blue-600 hover:underline cursor-pointer">
                    {avatarInput ? 'Change Photo' : '+ Upload Photo (Optional)'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileSelect}
                      className="hidden"
                    />
                  </label>
                  {avatarInput && (
                    <button
                      type="button"
                      onClick={() => setAvatarInput('')}
                      className="text-[11px] text-rose-500 hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 text-center">
                  Your photo will show inside your circle on the stage
                </span>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your Name (e.g. Pastor David, Sis. Faith)"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:outline-none focus:border-royal-blue-500"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-royal-blue-600 hover:bg-royal-blue-700 text-white font-bold text-sm shadow-sm cursor-pointer transition-colors"
              >
                {isInCall ? 'Save Details' : userName ? 'Save & Join Prayer Room' : 'Join Prayer Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Host Only: Background Music / YouTube Audio Modal */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                    Altar Background Worship Sound
                    <span className="text-[10px] uppercase font-extrabold bg-gold-100 text-gold-800 px-2 py-0.5 rounded-md border border-gold-200">
                      Host Only
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add YouTube link or audio stream to play softly in background
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMusicModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {musicModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {musicModalError}
              </div>
            )}

            <form onSubmit={handleSaveMusicUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  YouTube or Audio Stream URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={musicUrlInput}
                    onChange={(e) => setMusicUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 pl-9 text-xs text-gray-900 focus:outline-none focus:border-royal-blue-500 font-mono"
                    autoFocus
                  />
                  <Link2 className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                  💡 <strong>Audio-Only YouTube playback:</strong> Even if you paste a YouTube link or livestream, it will play <em>purely as audio</em> in the background. Prayer participants can hear worship music while listening to prayer points.
                </p>
              </div>

              {/* URL Preview / Format helper */}
              {musicUrlInput.trim() && (
                <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs">
                  <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    {extractYouTubeId(musicUrlInput) ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        ✓ YouTube Video Detected (Audio-Only Mode)
                      </span>
                    ) : (
                      <span className="text-royal-blue-600 font-bold flex items-center gap-1">
                        ✓ Direct Audio Stream Detected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {extractYouTubeId(musicUrlInput)
                      ? `YouTube ID: ${extractYouTubeId(musicUrlInput)}`
                      : musicUrlInput}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {roomState.background_audio_url ? (
                  <button
                    type="button"
                    onClick={() => setMusicUrlInput('')}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Audio Link
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMusicModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingMusic}
                    className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isSavingMusic ? 'Saving...' : 'Save & Broadcast to Room'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
