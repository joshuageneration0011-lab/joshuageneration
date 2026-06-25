import type { Sermon, Book, BlogPost } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('jg_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; token: string }> {
    const data = await request<{ success: boolean; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.token) {
      localStorage.setItem('jg_auth_token', data.token);
      localStorage.setItem('jg_admin_email', email);
    }
    return data;
  },

  logout(): void {
    localStorage.removeItem('jg_auth_token');
    localStorage.removeItem('jg_admin_email');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jg_auth_token');
  },

  // Radio
  async getRadio(): Promise<{ url: string; active: boolean }> {
    return request<{ url: string; active: boolean }>('/api/radio');
  },

  async saveRadio(url: string, active: boolean): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/radio', {
      method: 'POST',
      body: JSON.stringify({ url, active }),
    });
  },

  // Sermons
  async getSermons(): Promise<Sermon[]> {
    return request<Sermon[]>('/api/sermons');
  },

  async saveSermon(sermon: Sermon): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/sermons', {
      method: 'POST',
      body: JSON.stringify(sermon),
    });
  },

  async deleteSermon(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/sermons/${id}`, {
      method: 'DELETE',
    });
  },

  // Books
  async getBooks(): Promise<Book[]> {
    return request<Book[]>('/api/books');
  },

  async saveBook(book: Book): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  },

  async deleteBook(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/books/${id}`, {
      method: 'DELETE',
    });
  },

  // Blog
  async getBlog(): Promise<BlogPost[]> {
    return request<BlogPost[]>('/api/blog');
  },

  async saveBlogPost(post: BlogPost): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/api/blog', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  },

  async deleteBlogPost(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/blog/${id}`, {
      method: 'DELETE',
    });
  },
};
