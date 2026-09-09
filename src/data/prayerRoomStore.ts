export interface PrayerMessage {
  id: number | string;
  user_name: string;
  message: string;
  type: 'message' | 'prayer_request' | 'amen' | 'announcement' | 'sticker';
  sticker?: string;
  created_at: string;
}

export interface PrayerRoomState {
  current_topic: string;
  scripture: string;
  is_live: boolean;
  background_audio_url: string;
  active_speakers: Array<{ id: string; name: string; role: string; isSpeaking: boolean }>;
}

export interface CallParticipant {
  id: string;
  name: string;
  role: 'host' | 'admin' | 'intercessor';
  isMuted: boolean;
  isSpeaking: boolean;
  avatarColor: string;
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
          active_speakers: []
        },
        activeCount: 12
      };
    }
  },

  async updateState(newState: Partial<PrayerRoomState>): Promise<boolean> {
    const token = localStorage.getItem('jg_admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newState)
      });
      return res.ok;
    } catch (e) {
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

  async joinCall(id: string, name: string, role: 'host' | 'admin' | 'intercessor' = 'intercessor', avatarColor?: string): Promise<CallParticipant[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, role, avatarColor })
      });
      if (!res.ok) throw new Error('Failed to join call');
      const data = await res.json();
      return data.participants || [];
    } catch (e) {
      return [];
    }
  },

  async leaveCall(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/prayer-room/call/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
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
    action: 'mute' | 'unmute' | 'mute_all' | 'set_role' | 'remove',
    targetId?: string,
    role?: 'host' | 'admin' | 'intercessor',
    requesterId?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/call/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetId, role, requesterId })
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

  async getMessages(): Promise<PrayerMessage[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      return data.messages || [];
    } catch (e) {
      return [];
    }
  },

  async sendMessage(
    userName: string,
    message: string,
    type: 'message' | 'prayer_request' | 'amen' | 'sticker' = 'message',
    sticker?: string
  ): Promise<PrayerMessage | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, message, type, sticker })
      });
      if (!res.ok) throw new Error('Failed to post message');
      const data = await res.json();
      return data.message;
    } catch (e) {
      return {
        id: `local-${Date.now()}`,
        user_name: userName,
        message,
        type,
        sticker,
        created_at: new Date().toISOString()
      };
    }
  },

  async deleteMessage(id: number | string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async clearMessages(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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

  subscribeToEvents(callbacks: {
    onMessage?: (msg: PrayerMessage) => void;
    onMessageDeleted?: (id: number | string) => void;
    onChatCleared?: () => void;
    onReaction?: (reaction: ReactionEvent) => void;
    onStateUpdate?: (state: PrayerRoomState) => void;
    onCountUpdate?: (count: number) => void;
    onCallRoster?: (participants: CallParticipant[]) => void;
    onUserState?: (data: { id: string; isMuted: boolean; isSpeaking: boolean }) => void;
    onForceMute?: (targetId: string) => void;
    onForceUnmute?: (targetId: string) => void;
    onForceMuteAll?: (exceptId?: string) => void;
    onUserEjected?: (targetId: string) => void;
    onSignal?: (signal: { type: string; fromId: string; toId: string; payload: any }) => void;
  }): () => void {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/prayer-room/stream`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message' && callbacks.onMessage) {
              callbacks.onMessage(data.message);
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
