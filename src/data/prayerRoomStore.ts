export interface PrayerMessage {
  id: number | string;
  user_name: string;
  message: string;
  type: 'message' | 'prayer_request' | 'amen' | 'announcement';
  created_at: string;
}

export interface PrayerRoomState {
  current_topic: string;
  scripture: string;
  is_live: boolean;
  background_audio_url: string;
  active_speakers: Array<{ id: string; name: string; role: string; isSpeaking: boolean }>;
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

function getAdminToken(): string | null {
  return localStorage.getItem('jg_admin_token');
}

export const prayerRoomStore = {
  async getState(): Promise<{ state: PrayerRoomState; activeCount: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/state`);
      if (!res.ok) throw new Error('Failed to fetch state');
      return await res.json();
    } catch (e) {
      console.warn('Using offline fallback prayer room state:', e);
      return {
        state: {
          current_topic: '24/7 Global Prayer Altar',
          scripture: '1 Thessalonians 5:17 — Pray without ceasing.',
          is_live: true,
          background_audio_url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-peace-112191.mp3',
          active_speakers: [
            { id: 'leader-1', name: 'Prayer Leader', role: 'Minister', isSpeaking: true }
          ]
        },
        activeCount: 12
      };
    }
  },

  async updateState(newState: Partial<PrayerRoomState>): Promise<boolean> {
    const token = getAdminToken();
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
      console.error('Failed to update room state:', e);
      return false;
    }
  },

  async getMessages(): Promise<PrayerMessage[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      return data.messages || [];
    } catch (e) {
      console.warn('Using default prayer messages:', e);
      return [
        {
          id: 1,
          user_name: 'Joshua Generation Altar',
          message: 'Welcome to the 24/7 Prayer Altar. The Lord is in this place! Type your Amens and prayer points below.',
          type: 'announcement',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          id: 2,
          user_name: 'Sis. Grace',
          message: 'Amen! Standing in agreement from the UK 🙏',
          type: 'message',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ];
    }
  },

  async sendMessage(userName: string, message: string, type: 'message' | 'prayer_request' | 'amen' = 'message'): Promise<PrayerMessage | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, message, type })
      });
      if (!res.ok) throw new Error('Failed to post message');
      const data = await res.json();
      return data.message;
    } catch (e) {
      console.error('Failed to send message:', e);
      return {
        id: `local-${Date.now()}`,
        user_name: userName,
        message,
        type,
        created_at: new Date().toISOString()
      };
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
      // Ignored for fast optimistic reaction display
    }
  },

  async submitPrayerRequest(name: string, request: string, isAnonymous: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/prayer-room/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, request, is_anonymous: isAnonymous })
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to submit prayer request:', e);
      return true;
    }
  },

  subscribeToEvents(callbacks: {
    onMessage?: (msg: PrayerMessage) => void;
    onReaction?: (reaction: ReactionEvent) => void;
    onStateUpdate?: (state: PrayerRoomState) => void;
    onCountUpdate?: (count: number) => void;
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
          // Exponential / delayed retry
          reconnectTimeout = setTimeout(connect, 5000);
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
