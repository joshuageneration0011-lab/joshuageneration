import type { Sermon, Book, BlogPost, Donation } from '../types';

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
        return { success: true, token: data.token };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },

  logout() {
    localStorage.removeItem('jg_admin_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jg_admin_token');
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
    return data.views;
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
  }
};

export function resolveApiUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}
