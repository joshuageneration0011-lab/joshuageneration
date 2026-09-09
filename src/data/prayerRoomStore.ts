export interface PrayerMessage {
  id: number | string;
  user_name: string;
  message: string;
  type: 'message' | 'prayer_request' | 'amen' | 'announcement' | 'sticker';
  sticker?: string;
  is_pinned?: boolean;
  created_at: string;
}

export interface CustomSticker {
  id: string;
  label: string;
  emoji?: string;
  image_url?: string;
  color?: string;
  is_custom?: boolean;
  created_at?: string;
}

export interface PrayerRoomState {
  current_topic: string;
  scripture: string;
  is_live: boolean;
  background_audio_url: string;
  is_audio_playing?: boolean;
  background_audio_volume?: number;
  active_speakers: Array<{ id: string; name: string; role: string; isSpeaking: boolean }>;
}

export interface CallParticipant {
  id: string;
  name: string;
  role: 'host' | 'admin' | 'intercessor';
  isMuted: boolean;
  isSpeaking: boolean;
  avatarColor: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface ReactionEvent {
  id: string;
  type: 'amen' | 'fire' | 'praise' | 'love';
  user_name?: string;
  xOffset: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:5001' : '');

export const prayerRoomStore = {
  async getState(): Promise<{ state: PrayerRoomState; activeCount: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/state`);
      if (!res.ok) throw new Error('Failed to fetch state');
      return await res.json();
    } catch (e) {
      return {
        state: {
          current_topic: '24/7 Global Prayer Altar',
          scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
          is_live: true,
          background_audio_url: '',
          is_audio_playing: false,
          background_audio_volume: 30,
          active_speakers: []
        },
        activeCount: 12
      };
    }
  },

  async updateState(newState: Partial<PrayerRoomState> & { admin_key?: string; is_host?: boolean }): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    const modKey = localStorage.getItem('jg_prayer_moderator_key') || (token ? 'jgprayer2026' : '');
    const payload = {
      admin_key: modKey,
      ...newState
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update prayer room state');
      }
      return true;
    } catch (e: any) {
      if (e.message) throw e;
      return false;
    }
  },

  // --- CALL ROSTER & MODERATION ---

  async getCallParticipants(): Promise<CallParticipant[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/participants`);
      if (!res.ok) throw new Error('Failed to fetch call participants');
      const data = await res.json();
      return data.participants || [];
    } catch (e) {
      return [];
    }
  },

  async joinCall(
    id: string,
    name: string,
    role: 'host' | 'admin' | 'intercessor' = 'intercessor',
    avatarColor?: string,
    avatarUrl?: string
  ): Promise<CallParticipant[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, role, avatarColor, avatarUrl })
      });
      if (!res.ok) throw new Error('Failed to join call');
      const data = await res.json();
      return data.participants || [];
    } catch (e) {
      return [];
    }
  },

  leaveCall(id: string): void {
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE_URL}/api/prayer-room/call/leave?id=${encodeURIComponent(id)}`);
      }
      fetch(`${API_BASE_URL}/api/prayer-room/call/leave?id=${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        keepalive: true
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
  },

  async updateMicState(id: string, isMuted: boolean, isSpeaking: boolean): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/prayer-room/call/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isMuted, isSpeaking })
      });
    } catch (e) {
      // ignore
    }
  },

  async executeAdminAction(
    action: 'mute' | 'unmute' | 'mute_all' | 'set_role' | 'remove' | 'kick',
    targetId?: string,
    role?: 'host' | 'admin' | 'intercessor',
    requesterId?: string
  ): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    const isHost = localStorage.getItem('jg_prayer_is_host') === 'true';
    const modKey = localStorage.getItem('jg_prayer_moderator_key') || (token || isHost ? 'jgprayer2026' : '');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/admin/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, targetId, role, requesterId, admin_key: modKey, is_host: isHost })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async verifyModeratorKey(key: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/admin/verify-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, userId })
      });
      const data = await res.json();
      return res.ok && data.success;
    } catch (e) {
      return false;
    }
  },

  async sendSignal(type: 'offer' | 'answer' | 'ice', fromId: string, toId: string, payload: any): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/prayer-room/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, fromId, toId, payload })
      });
    } catch (e) {
      // ignore
    }
  },

  async getLiveKitToken(identity: string, name: string, room = 'jg-247-prayer'): Promise<{ token: string; url: string; room: string } | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/livekit-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, name, room })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  // --- MESSAGES & CHAT MODERATION ---

  async getMessages(): Promise<{ messages: PrayerMessage[]; pinned_message?: PrayerMessage | null }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      return {
        messages: data.messages || [],
        pinned_message: data.pinned_message || null
      };
    } catch (e) {
      return { messages: [], pinned_message: null };
    }
  },

  async sendMessage(
    userName: string,
    message: string,
    type: 'message' | 'prayer_request' | 'amen' | 'sticker' = 'message',
    sticker?: string,
    admin_key?: string
  ): Promise<PrayerMessage | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, message, type, sticker, admin_key })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to post message');
      }
      const data = await res.json();
      return data.message;
    } catch (e: any) {
      if (e.message && e.message.includes('administrators')) {
        throw e;
      }
      return {
        id: `local-${Date.now()}`,
        user_name: userName,
        message,
        type,
        sticker,
        is_pinned: false,
        created_at: new Date().toISOString()
      };
    }
  },

  async pinMessage(id: number | string, is_pinned: boolean, admin_key?: string): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    const isHost = localStorage.getItem('jg_prayer_is_host') === 'true';
    const modKey = admin_key || localStorage.getItem('jg_prayer_moderator_key') || (token || isHost ? 'jgprayer2026' : '');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, is_pinned, admin_key: modKey, is_host: isHost })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async deleteMessage(id: number | string): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    const isHost = localStorage.getItem('jg_prayer_is_host') === 'true';
    const modKey = localStorage.getItem('jg_prayer_moderator_key') || (token || isHost ? 'jgprayer2026' : '');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, admin_key: modKey, is_host: isHost })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async clearMessages(): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    const isHost = localStorage.getItem('jg_prayer_is_host') === 'true';
    const modKey = localStorage.getItem('jg_prayer_moderator_key') || (token || isHost ? 'jgprayer2026' : '');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ admin_key: modKey, is_host: isHost })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async sendReaction(type: 'amen' | 'fire' | 'praise' | 'love', userName?: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/prayer-room/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, user_name: userName || 'Intercessor' })
      });
    } catch (e) {
      // Ignored
    }
  },

  // --- CUSTOM STICKERS ---

  async getStickers(): Promise<CustomSticker[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/stickers`);
      if (!res.ok) throw new Error('Failed to fetch stickers');
      const data = await res.json();
      return data.stickers || [];
    } catch (e) {
      return [];
    }
  },

  async createCustomSticker(data: {
    label: string;
    image_url?: string;
    emoji?: string;
    color?: string;
    admin_key?: string;
  }): Promise<CustomSticker | null> {
    const token = localStorage.getItem('jg_admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/stickers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create sticker');
      }
      const resData = await res.json();
      return resData.sticker;
    } catch (e: any) {
      console.error('Error creating custom sticker:', e);
      throw e;
    }
  },

  async deleteCustomSticker(id: string, admin_key?: string): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/stickers/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id, admin_key })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  subscribeToEvents(callbacks: {
    onMessage?: (msg: PrayerMessage) => void;
    onMessagePinned?: (data: { id: number | string; is_pinned: boolean; message?: PrayerMessage }) => void;
    onMessageDeleted?: (id: number | string) => void;
    onChatCleared?: () => void;
    onReaction?: (reaction: ReactionEvent) => void;
    onNewSticker?: (sticker: CustomSticker) => void;
    onDeletedSticker?: (id: string) => void;
    onStateUpdate?: (state: PrayerRoomState) => void;
    onCountUpdate?: (count: number) => void;
    onCallRoster?: (participants: CallParticipant[]) => void;
    onUserState?: (data: { id: string; isMuted: boolean; isSpeaking: boolean }) => void;
    onForceMute?: (targetId: string) => void;
    onForceUnmute?: (targetId: string) => void;
    onForceMuteAll?: (exceptId?: string) => void;
    onUserEjected?: (targetId: string) => void;
    onSignal?: (signal: { type: string; fromId: string; toId: string; payload: any }) => void;
  }, userId?: string): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        const streamUrl = userId 
          ? `${API_BASE_URL}/api/prayer-room/stream?userId=${encodeURIComponent(userId)}`
          : `${API_BASE_URL}/api/prayer-room/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && callbacks.onMessage) {
              callbacks.onMessage(data.message);
            } else if (data.type === 'message_pinned' && callbacks.onMessagePinned) {
              callbacks.onMessagePinned(data);
            } else if (data.type === 'new_sticker' && callbacks.onNewSticker) {
              callbacks.onNewSticker(data.sticker);
            } else if (data.type === 'deleted_sticker' && callbacks.onDeletedSticker) {
              callbacks.onDeletedSticker(data.id);
            } else if (data.type === 'message_deleted' && callbacks.onMessageDeleted) {
              callbacks.onMessageDeleted(data.id);
            } else if (data.type === 'chat_cleared' && callbacks.onChatCleared) {
              callbacks.onChatCleared();
            } else if (data.type === 'reaction' && callbacks.onReaction) {
              callbacks.onReaction({
                id: `${Date.now()}-${Math.random()}`,
                type: data.reactionType || 'amen',
                user_name: data.user_name,
                xOffset: data.xOffset ?? Math.floor(Math.random() * 80) + 10
              });
            } else if (data.type === 'state' && callbacks.onStateUpdate) {
              callbacks.onStateUpdate(data.state);
            } else if ((data.type === 'count' || data.type === 'init') && callbacks.onCountUpdate) {
              callbacks.onCountUpdate(data.count);
            } else if (data.type === 'call_roster' && callbacks.onCallRoster) {
              callbacks.onCallRoster(data.participants || []);
            } else if (data.type === 'call_user_state' && callbacks.onUserState) {
              callbacks.onUserState({ id: data.id, isMuted: data.isMuted, isSpeaking: data.isSpeaking });
            } else if (data.type === 'call_force_mute' && callbacks.onForceMute) {
              callbacks.onForceMute(data.targetId);
            } else if (data.type === 'call_force_unmute' && callbacks.onForceUnmute) {
              callbacks.onForceUnmute(data.targetId);
            } else if (data.type === 'call_force_mute_all' && callbacks.onForceMuteAll) {
              callbacks.onForceMuteAll(data.exceptId);
            } else if (data.type === 'call_user_ejected' && callbacks.onUserEjected) {
              callbacks.onUserEjected(data.targetId);
            } else if (data.type === 'webrtc_signal' && callbacks.onSignal) {
              callbacks.onSignal(data);
            }
          } catch (err) {
            console.warn('Error parsing SSE event:', err);
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          reconnectTimeout = setTimeout(connect, 4000);
        };
      } catch (err) {
        console.warn('Failed to start EventSource connection:', err);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) {
        eventSource.close();
      }
    };
  }
};
