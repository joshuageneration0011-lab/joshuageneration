import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Share2, Link, Check } from 'lucide-react';
import type { BlogPost } from '@/types';
import { updatePageSEO } from '@/utils/seo';

interface BlogPostReaderProps {
  posts: BlogPost[];
  post: BlogPost;
  onBack: () => void;
  onPostSelect: (post: BlogPost) => void;
}

export default function BlogPostReader({ posts, post, onBack, onPostSelect }: BlogPostReaderProps) {
  const [copied, setCopied] = useState(false);

  // Dynamic SEO Configuration for the specific blog post article
  useEffect(() => {
    updatePageSEO({
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      keywords: post.seoKeywords || `${post.category.toLowerCase()}, faith, bible study, sermon`,
      imageUrl: post.imageUrl,
      slug: post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      author: post.author,
      datePublished: post.date,
      type: 'article'
    });
  }, [post]);

  // Retrieve related posts (different from the current post, same category preferred, max 3)
  const relatedPosts = useMemo(() => {
    const list = posts.filter((p) => p.id !== post.id);
    const sameCategory = list.filter((p) => p.category === post.category);
    const others = list.filter((p) => p.category !== post.category);
    return [...sameCategory, ...others].slice(0, 3);
  }, [posts, post.id, post.category]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this insightful article: "${post.title}" - ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out this article: "${post.title}"`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation back */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-royal-blue-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Articles
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Article Content */}
          <div className="lg:col-span-2">
            <span className="inline-block px-3 py-1 rounded-full bg-royal-blue-50 text-royal-blue-600 text-xs font-extrabold tracking-wide uppercase mb-4">
              {post.category}
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
              {post.title}
            </h1>

            {/* Author & Read Time Byline */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-8 text-sm text-gray-500 font-semibold">
              <span>By {post.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>

            {/* Cover Image */}
            <div className="rounded-2xl overflow-hidden aspect-[16/9] mb-8 bg-gray-100">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Body Text */}
            <article className="prose max-w-none text-gray-700 leading-relaxed text-justify font-serif text-lg whitespace-pre-line selection:bg-royal-blue-100/60">
              {post.content || post.excerpt}
            </article>

            {/* Inlined Share Box */}
            <div className="border-t border-b border-gray-100 py-6 my-10 flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-bold text-gray-900">Did you find this helpful? Share this article:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#1DA1F2] fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#25D366]" />
                  WhatsApp
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Author Card Bio */}
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">About the Author</h3>
              <h4 className="text-base font-bold text-gray-900 mb-1">{post.author}</h4>
              <p className="text-gray-400 text-xs font-medium uppercase mb-3">Ministry Editorial Team</p>
              <p className="text-gray-600 text-xs leading-relaxed">
                Dedicated to writing biblical instructions and declarations that motivate spiritual maturity, kingdom service, and deeper connection with Christ.
              </p>
            </div>

            {/* Related Posts */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Related Articles</h3>
              <div className="space-y-4">
                {relatedPosts.map((rPost) => (
                  <div
                    key={rPost.id}
                    onClick={() => onPostSelect(rPost)}
                    className="group cursor-pointer flex gap-4 p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={rPost.imageUrl}
                        alt={rPost.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-royal-blue-600">
                        {rPost.category}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-tight mt-0.5">
                        {rPost.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 block mt-1">{rPost.readTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
