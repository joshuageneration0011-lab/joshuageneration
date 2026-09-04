import type { Subscriber, Sermon, Book, BlogPost, Donation, Settings, Event, Testimony, CustomForm, FormSubmission } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:5001' : '');

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
      body: JSON.stringify({ email, name }),
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

  async getAdminSermons(): Promise<Sermon[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/sermons`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch admin sermons');
    return res.json();
  },

  async getSermonsByAudience(audience: 'sons-daughters' | 'partners'): Promise<Sermon[]> {
    const res = await fetch(`${API_BASE_URL}/api/sermons/${audience}`);
    if (!res.ok) throw new Error(`Failed to fetch ${audience} sermons`);
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

  async incrementBookViews(id: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/books/${id}/view`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to increment book views');
    const data = await res.json();
    window.dispatchEvent(new Event('books_updated'));
    return data.views;
  },

  async incrementBlogPostViews(id: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/api/blog/${id}/view`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to increment blog views');
    const data = await res.json();
    window.dispatchEvent(new Event('blog_updated'));
    return data.views;
  },

  async getComments(itemType: 'sermon' | 'book' | 'blog', itemId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/comments/${itemType}/${itemId}`);
    if (!res.ok) throw new Error('Failed to retrieve comments');
    return res.json();
  },

  async addComment(itemType: 'sermon' | 'book' | 'blog', itemId: string, comment: { name: string; text: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/comments/${itemType}/${itemId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comment),
    });
    if (!res.ok) throw new Error('Failed to post comment');
    return res.json();
  },

  async getAdminComments(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/comments`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to retrieve admin comments');
    return res.json();
  },

  async approveComment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/admin/comments/${id}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to approve comment');
  },

  async deleteComment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/admin/comments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete comment');
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

  // Admin Settings
  getSettings: async (): Promise<Settings> => {
    const res = await fetch(`${API_BASE_URL}/api/admin/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  getPublicSettings: async (): Promise<Partial<Settings>> => {
    const res = await fetch(`${API_BASE_URL}/api/settings/public`);
    if (!res.ok) throw new Error('Failed to fetch public settings');
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

  // Testimonies
  async getTestimonies(): Promise<Testimony[]> {
    const res = await fetch(`${API_BASE_URL}/api/testimonies`);
    if (!res.ok) throw new Error('Failed to fetch testimonies');
    return res.json();
  },

  async saveTestimony(testimony: Testimony): Promise<Testimony> {
    const res = await fetch(`${API_BASE_URL}/api/testimonies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(testimony)
    });
    await handleResponse(res, 'Failed to save testimony');
    const data = await res.json();
    return data.item || data;
  },

  async deleteTestimony(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/testimonies/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    await handleResponse(res, 'Failed to delete testimony');
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
  },

  // Newsletter
  async subscribeNewsletter(email: string, name?: string, captchaPayload?: { captchaAnswer?: string; captchaToken?: string; hpValue?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, ...captchaPayload }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },
  async subscribeSANewsletter(email: string, name?: string, captchaPayload?: { captchaAnswer?: string; captchaToken?: string; hpValue?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sa/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, ...captchaPayload }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },
  async subscribeSDNewsletter(email: string, name?: string, captchaPayload?: { captchaAnswer?: string; captchaToken?: string; hpValue?: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sd/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, ...captchaPayload }),
      });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  },

  admin: {
    async getSubscribers(): Promise<Subscriber[]> {
      const res = await fetch(`${API_BASE_URL}/api/admin/subscribers`, { headers: getHeaders() });
      return (await handleResponse(res, 'Failed to fetch subscribers')).json();
    },
    async sendBulkEmail(subject: string, htmlBody: string, testEmail?: string): Promise<{ success: boolean; count: number; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/subscribers/email`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ subject, htmlBody, testEmail }),
      });
      return (await handleResponse(res, 'Failed to send bulk email')).json();
    },
    async deleteSubscriber(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/subscribers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return (await handleResponse(res, 'Failed to delete subscriber')).json();
    },
    async getSASubscribers(): Promise<Subscriber[]> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sa/subscribers`, { headers: getHeaders() });
      return (await handleResponse(res, 'Failed to fetch SA subscribers')).json();
    },
    async sendSABulkEmail(subject: string, htmlBody: string, testEmail?: string): Promise<{ success: boolean; count: number; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sa/subscribers/email`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ subject, htmlBody, testEmail }),
      });
      return (await handleResponse(res, 'Failed to send SA bulk email')).json();
    },
    async deleteSASubscriber(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sa/subscribers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return (await handleResponse(res, 'Failed to delete SA subscriber')).json();
    },
    async getSDSubscribers(): Promise<Subscriber[]> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sd/subscribers`, { headers: getHeaders() });
      return (await handleResponse(res, 'Failed to fetch SD subscribers')).json();
    },
    async sendSDBulkEmail(subject: string, htmlBody: string, testEmail?: string): Promise<{ success: boolean; count: number; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sd/subscribers/email`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ subject, htmlBody, testEmail }),
      });
      return (await handleResponse(res, 'Failed to send SD bulk email')).json();
    },
    async deleteSDSubscriber(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/sd/subscribers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return (await handleResponse(res, 'Failed to delete SD subscriber')).json();
    },
    async downloadSiteBackup(): Promise<void> {
      const res = await fetch(`${API_BASE_URL}/api/admin/backup/export`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to download site backup');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jg_site_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
    async restoreSiteBackup(jsonData: any): Promise<{ success: boolean; message: string; restored?: any }> {
      const res = await fetch(`${API_BASE_URL}/api/admin/backup/restore`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jsonData),
      });
      return (await handleResponse(res, 'Failed to restore backup')).json();
    }
  },
  async generateImage(params: { prompt: string; size?: string; n?: number; model?: string; aspect_ratio?: string; image?: string; engine?: string }): Promise<{
    success: boolean;
    output: string[];
    id?: string;
    prompt?: string;
    model?: string;
    modelLabel?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    
    let data: any = {};
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (!res.ok) {
        throw new Error(`Server Service Error (${res.status}): Please try again.`);
      }
      throw new Error('Invalid response received from server.');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate image');
    }
    return data;
  },

  // --- SHORT REDIRECT LINKS (PRETTY LINKS) ---
  async getRedirectLinks(): Promise<RedirectLink[]> {
    const res = await fetch(`${API_BASE_URL}/api/redirect-links`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.links || [];
  },

  async createRedirectLink(link: { slug: string; target_url: string; title?: string; is_active?: boolean }): Promise<RedirectLink> {
    const res = await fetch(`${API_BASE_URL}/api/redirect-links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(link),
    });
    const data = await handleResponse(res, 'Failed to create redirect link');
    const json = await data.json();
    return json.link;
  },

  async updateRedirectLink(id: number | string, link: { slug: string; target_url: string; title?: string; is_active?: boolean }): Promise<RedirectLink> {
    const res = await fetch(`${API_BASE_URL}/api/redirect-links/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(link),
    });
    const data = await handleResponse(res, 'Failed to update redirect link');
    const json = await data.json();
    return json.link;
  },

  async deleteRedirectLink(id: number | string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/redirect-links/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete redirect link');
    return true;
  },

  // --- CUSTOM FORMS ---
  async getForms(): Promise<CustomForm[]> {
    const res = await fetch(`${API_BASE_URL}/api/forms`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch forms');
    const data = await res.json();
    return data.forms || [];
  },

  async getForm(slugOrId: string): Promise<CustomForm> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${slugOrId}`);
    if (!res.ok) throw new Error('Form not found');
    const data = await res.json();
    return data.form;
  },

  async saveForm(form: Partial<CustomForm>): Promise<CustomForm> {
    const isUpdate = !!form.id;
    const url = isUpdate ? `${API_BASE_URL}/api/forms/${form.id}` : `${API_BASE_URL}/api/forms`;
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    await handleResponse(res, 'Failed to save form');
    const data = await res.json();
    return data.form;
  },

  async deleteForm(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete form');
    return true;
  },

  async submitForm(formId: string, answers: Record<string, any>): Promise<{
    success: boolean;
    submissionId: string;
    enableRedirect: boolean;
    redirectButtonLabel: string;
    redirectUrl: string;
    successMessage: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit form');
    }
    return res.json();
  },

  async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    const res = await fetch(`${API_BASE_URL}/api/forms/${formId}/submissions`, {
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to fetch form submissions');
    const data = await res.json();
    return data.submissions || [];
  },

  async deleteFormSubmission(subId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/api/forms/submissions/${subId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    await handleResponse(res, 'Failed to delete submission');
    return true;
  },

  getFormExportUrl(formId: string): string {
    const token = localStorage.getItem('jg_admin_token');
    return `${API_BASE_URL}/api/forms/export/${formId}?token=${encodeURIComponent(token || '')}`;
  }
};

export interface RedirectLink {
  id: number;
  slug: string;
  target_url: string;
  title: string;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function resolveApiUrl(url: string | undefined): string {
  if (!url) return '';
  let finalUrl = url;
  if (url.startsWith('/') && !url.startsWith('//')) {
    finalUrl = `${API_BASE_URL}${url}`;
  }
  
  // Automatically compress massive Unsplash placeholder images
  if (finalUrl.includes('images.unsplash.com') && !finalUrl.includes('w=')) {
    return finalUrl.includes('?') ? `${finalUrl}&w=800&q=80&fm=webp` : `${finalUrl}?w=800&q=80&fm=webp`;
  }
  
  return finalUrl;
}
