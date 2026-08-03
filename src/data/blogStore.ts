import { api } from '../utils/api';
import type { BlogPost } from '../types';

export const getSavedBlogPosts = async (): Promise<BlogPost[]> => {
  try {
    return await api.getBlogPosts();
  } catch (e) {
    console.error('Error fetching blog posts from API:', e);
    return [];
  }
};

export const saveBlogPost = async (post: BlogPost): Promise<BlogPost> => {
  const saved = await api.saveBlogPost(post);
  window.dispatchEvent(new Event('blog_posts_updated'));
  return saved;
};

export const deleteBlogPost = async (id: string): Promise<boolean> => {
  const success = await api.deleteBlogPost(id);
  window.dispatchEvent(new Event('blog_posts_updated'));
  return success;
};
