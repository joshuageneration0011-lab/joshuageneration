import type { Sermon, Book, BlogPost } from '../types';

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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save sermon');
    }
    const data = await res.json();
    return data.item;
  },

  async deleteSermon(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/sermons/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete sermon');
    }
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save book');
    }
    const data = await res.json();
    return data.item;
  },

  async deleteBook(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/books/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete book');
    }
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save blog post');
    }
    const data = await res.json();
    return data.item;
  },

  async deleteBlogPost(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/blog/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete blog post');
    }
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
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save radio settings');
    }
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
