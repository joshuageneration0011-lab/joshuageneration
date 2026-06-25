import { blogPosts as defaultBlogPosts } from './mockData';
import type { BlogPost } from '../types';

export const getSavedBlogPosts = (): BlogPost[] => {
  const saved = localStorage.getItem('jg_blog_posts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing saved blog posts:', e);
    }
  }
  
  // Backfill slugs and SEO titles for initial blog posts if missing
  const backfilled = defaultBlogPosts.map(post => ({
    ...post,
    slug: post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    seoTitle: post.seoTitle || post.title,
    seoDescription: post.seoDescription || post.excerpt,
    seoKeywords: post.seoKeywords || `${post.category.toLowerCase()}, christian, faith`
  }));
  localStorage.setItem('jg_blog_posts', JSON.stringify(backfilled));
  return backfilled;
};

export const saveBlogPosts = (posts: BlogPost[]) => {
  localStorage.setItem('jg_blog_posts', JSON.stringify(posts));
  // Dispatch a custom event to notify any active listeners
  window.dispatchEvent(new Event('blog_posts_updated'));
};
