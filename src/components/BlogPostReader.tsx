import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Share2, Link, Check, MessageSquare } from 'lucide-react';
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
  const [comments, setComments] = useState<{ id: string; name: string; text: string; date: string }[]>([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    const storageKey = `jg_blog_comments_${post.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setComments(JSON.parse(stored));
    } else {
      const initial = [
        {
          id: '1',
          name: 'Sarah Adebayo',
          text: 'This was such a timely and encouraging word. Thank you for sharing these powerful insights!',
          date: '2 hours ago'
        },
        {
          id: '2',
          name: 'Brother David',
          text: 'Amen! The message on divine authority really resonated with me. God bless the ministry team.',
          date: 'Yesterday'
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(initial));
      setComments(initial);
    }
  }, [post.id]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      name: newCommentName.trim(),
      text: newCommentText.trim(),
      date: 'Just now'
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    localStorage.setItem(`jg_blog_comments_${post.id}`, JSON.stringify(updated));

    setNewCommentName('');
    setNewCommentText('');
  };

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

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
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
            <article 
              className="prose max-w-none text-gray-700 leading-relaxed text-justify font-serif text-lg selection:bg-royal-blue-100/60"
              dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
            />

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
                <button
                  onClick={handleShareFacebook}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <button
                  onClick={handleShareLinkedIn}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#0A66C2] fill-current" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12 border-t border-gray-100 pt-10">
              <div className="flex items-center gap-2 mb-8">
                <MessageSquare className="w-5 h-5 text-royal-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Comments ({comments.length})
                </h3>
              </div>

              {/* Comment Form */}
              <form onSubmit={handleAddComment} className="mb-10 bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Leave a Comment</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="comment-name" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Name</label>
                    <input
                      id="comment-name"
                      type="text"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="comment-text" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Comment</label>
                    <textarea
                      id="comment-text"
                      rows={4}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write your thoughts..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newCommentName.trim() || !newCommentText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 hover:from-royal-blue-700 hover:to-royal-blue-800 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-royal-blue-500/10 cursor-pointer"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map((comment) => {
                    const initials = comment.name ? comment.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                    return (
                      <div key={comment.id} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-sm shadow-sm">
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900">{comment.name}</h4>
                            <span className="text-[10px] font-semibold text-gray-400">{comment.date}</span>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
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
