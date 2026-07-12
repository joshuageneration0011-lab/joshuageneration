import type { Sermon, Book, BlogPost, Donation, Settings, Event } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

function getHeaders() {
  const token = localStorage.getItem('jg_admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res: Response, defaultError: string) {
  if (res.status === 401) {
    localStorage.removeItem('jg_admin_token');
    localStorage.removeItem('jg_admin_role');
    window.dispatchEvent(new Event('jg_unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || defaultError);
  }
  return res;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('jg_admin_token', data.token);
        localStorage.setItem('jg_admin_role', data.role || 'admin');
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },

  async registerRequest(name: string, email: string, password: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to request registration verification.');
    }
    return true;
  },

  async registerVerify(email: string, otp: string): Promise<{ success: boolean; token?: string; role?: string; name?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('jg_admin_token', data.token);
        localStorage.setItem('jg_admin_role', data.role || 'member');
        return { success: true, token: data.token, role: data.role, name: data.name };
      }
      return { success: false, error: data.error || 'Verification failed' };
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },

  async forgotPasswordRequest(email: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to request password reset.');
    }
    return true;
  },

  async forgotPasswordReset(email: string, otp: string, newPassword: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to reset password.');
    }
    return true;
  },

  logout() {
    localStorage.removeItem('jg_admin_token');
    localStorage.removeItem('jg_admin_role');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jg_admin_token');
  },

  getRole(): 'superadmin' | 'admin' | null {
    return localStorage.getItem('jg_admin_role') as any;
  },

  // Sermons
  async getSermons(): Promise<Sermon[]> {
    const res = await fetch(`${API_BASE_URL}/api/sermons`);
    if (!res.ok) throw new Error('Failed to fetch sermons');
    return res.json();
  },

  async saveSermon(sermon: Sermon): Promise<Sermon> {
    const res = await fetch(`${API_BASE_URL}/api/sermons`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sermon),
    });
    await handleResponse(res, 'Failed to save sermon');
    const data = await res.json();
    return data.item;
  },

  async deleteSermon(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/sermons/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete sermon');
    return true;
  },

  // Books
  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${API_BASE_URL}/api/books`);
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
  },

  async saveBook(book: Book): Promise<Book> {
    const res = await fetch(`${API_BASE_URL}/api/books`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(book),
    });
    await handleResponse(res, 'Failed to save book');
    const data = await res.json();
    return data.item;
  },

  async deleteBook(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/books/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete book');
    return true;
  },

  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    const res = await fetch(`${API_BASE_URL}/api/blog`);
    if (!res.ok) throw new Error('Failed to fetch blog posts');
    return res.json();
  },

  async saveBlogPost(post: BlogPost): Promise<BlogPost> {
    const res = await fetch(`${API_BASE_URL}/api/blog`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(post),
    });
    await handleResponse(res, 'Failed to save blog post');
    const data = await res.json();
    return data.item;
  },

  async deleteBlogPost(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/blog/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete blog post');
    return true;
  },

  // Radio
  async getRadio(): Promise<{ url: string; active: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/radio`);
    if (!res.ok) throw new Error('Failed to fetch radio settings');
    return res.json();
  },

  async saveRadio(url: string, active: boolean): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/radio`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, active }),
    });
    await handleResponse(res, 'Failed to save radio settings');
    return true;
  },

  uploadFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${API_BASE_URL}/api/upload?filename=${encodeURIComponent(file.name)}`;
      
      xhr.open('POST', url, true);
      
      const token = localStorage.getItem('jg_admin_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentage = Math.round((e.loaded * 100) / e.total);
            onProgress(percentage);
          }
        });
      }
      
      xhr.onload = () => {
        if (xhr.status === 401) {
          localStorage.removeItem('jg_admin_token');
          localStorage.removeItem('jg_admin_role');
          window.dispatchEvent(new Event('jg_unauthorized'));
          reject(new Error('Session expired. Please log in again.'));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res.url);
          } catch (e) {
            reject(new Error('Invalid upload response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };
      
      xhr.send(file);
    });
  },

  async incrementSermonViews(id: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/sermons/${id}/view`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to increment views');
    const data = await res.json();
    window.dispatchEvent(new Event('sermons_updated'));
    return data.views;
  },

  async incrementSermonDownloads(id: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/sermons/${id}/download`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to increment downloads');
    const data = await res.json();
    window.dispatchEvent(new Event('sermons_updated'));
    return data.downloads;
  },

  async createDonation(donation: Omit<Donation, 'id' | 'date'>): Promise<Donation> {
    const res = await fetch(`${API_BASE_URL}/api/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donation)
    });
    await handleResponse(res, 'Failed to create donation');
    return res.json();
  },

  async getDonations(): Promise<Donation[]> {
    const res = await fetch(`${API_BASE_URL}/api/donations`, {
      method: 'GET',
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to retrieve donations');
    return res.json();
  },

  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async saveSettings(settings: Settings): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    await handleResponse(res, 'Failed to save settings');
    return true;
  },

  async getEvents(): Promise<Event[]> {
    const res = await fetch(`${API_BASE_URL}/api/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async createEvent(event: Partial<Event>): Promise<Event> {
    const res = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(event)
    });
    await handleResponse(res, 'Failed to save event');
    return res.json();
  },

  async deleteEvent(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to delete event');
    return true;
  },

  // Users (Admin only)
  async getUsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to fetch users');
    return res.json();
  },

  async saveUsers(users: any[]): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(users)
    });
    await handleResponse(res, 'Failed to save users');
    return true;
  },

  // Stats (Public)
  async getStats(): Promise<{ sermons: number; books: number; members: number }> {
    const res = await fetch(`${API_BASE_URL}/api/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Messages
  async submitMessage(data: { name: string; email: string; subject: string; message: string }): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit message');
    return true;
  },

  async getMessages(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/messages`, {
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to fetch messages');
    return res.json();
  },

  async updateMessageStatus(id: string | number, status: 'read' | 'unread'): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    await handleResponse(res, 'Failed to update message status');
    return true;
  },

  async deleteMessage(id: string | number): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/admin/messages/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to delete message');
    return true;
  }
};

export function resolveApiUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}
