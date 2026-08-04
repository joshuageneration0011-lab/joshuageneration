import React, { useState, useEffect } from 'react';
import { X, Heart, BookOpen, Tv, Library, Sparkles, Send, Gift, MessageCircle } from 'lucide-react';
import { getLikedItems, toggleLikeItem } from '../data/likesStore';
import { resolveApiUrl } from '../utils/api';
import type { Sermon, Book, BlogPost } from '../types';

interface LovePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export default function LovePopup({ isOpen, onClose, onNavigate }: LovePopupProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'support'>('favorites');
  const [favSubTab, setFavSubTab] = useState<'sermon' | 'book' | 'blog'>('sermon');
  
  // Loaded state for favorites
  const [likedSermons, setLikedSermons] = useState<Sermon[]>([]);
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [likedBlogs, setLikedBlogs] = useState<BlogPost[]>([]);

  // Appreciation form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  // Load liked items on open or when likes change
  const loadLikedItems = () => {
    try {
      const allSermons: Sermon[] = JSON.parse(localStorage.getItem('jg_cache_sermons') || '[]');
      const allBooks: Book[] = JSON.parse(localStorage.getItem('jg_cache_books') || '[]');
      const allBlogs: BlogPost[] = JSON.parse(localStorage.getItem('jg_cache_posts') || '[]');

      const likedSermonIds = getLikedItems('sermon');
      const likedBookIds = getLikedItems('book');
      const likedBlogIds = getLikedItems('blog');

      setLikedSermons(allSermons.filter(s => likedSermonIds.includes(s.id)));
      setLikedBooks(allBooks.filter(b => likedBookIds.includes(b.id)));
      setLikedBlogs(allBlogs.filter(p => likedBlogIds.includes(p.id)));
    } catch (e) {
      console.error('Failed to load liked items in LovePopup:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLikedItems();
      setSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleLikesUpdated = () => {
      loadLikedItems();
    };
    window.addEventListener('likes_updated', handleLikesUpdated);
    return () => window.removeEventListener('likes_updated', handleLikesUpdated);
  }, []);

  if (!isOpen) return null;

  const handleRemoveLike = (e: React.MouseEvent, type: 'sermon' | 'book' | 'blog', id: string) => {
    e.stopPropagation();
    toggleLikeItem(type, id);
  };

  const handleItemClick = (type: 'sermon' | 'book' | 'blog', item: any) => {
    onClose();
    if (type === 'sermon') {
      window.dispatchEvent(new CustomEvent('select-sermon', { detail: item }));
    } else if (type === 'book') {
      window.dispatchEvent(new CustomEvent('select-book', { detail: item }));
    } else if (type === 'blog') {
      window.dispatchEvent(new CustomEvent('select-post', { detail: item }));
    }
  };

  const handleNavigate = (page: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.history.pushState(null, '', `/${page}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Generate floating hearts animation on successful submit
  const triggerHeartBurst = () => {
    const hearts: FloatingHeart[] = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // percentage from left
      y: 80, // starting position from bottom
      size: Math.random() * 20 + 12, // size in pixels
      delay: Math.random() * 0.8, // animation delay in seconds
    }));
    setFloatingHearts(hearts);
    setTimeout(() => {
      setFloatingHearts([]);
    }, 3000);
  };

  const handleAppreciationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      triggerHeartBurst();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      {/* Backdrop Click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white/95 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] animate-scale-up">
        {/* Floating Hearts overlay */}
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-red-500 fill-red-500 pointer-events-none select-none z-50 animate-float-heart"
            style={{
              left: `${heart.x}%`,
              bottom: `${heart.y}%`,
              fontSize: `${heart.size}px`,
              animationDelay: `${heart.delay}s`,
            }}
          >
            ❤️
          </div>
        ))}

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-royal-blue-50/50 via-white to-gold-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Love Hub</h2>
              <p className="text-xs text-gray-500 font-medium">Your favorites and support center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 p-2 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'favorites'
                ? 'bg-white text-royal-blue-600 shadow-sm border border-gray-100/55 scale-[1.01]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'favorites' ? 'text-royal-blue-500' : ''}`} />
            My Loved Items
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeTab === 'support'
                ? 'bg-white text-royal-blue-600 shadow-sm border border-gray-100/55 scale-[1.01]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
            }`}
          >
            <Heart className={`w-4 h-4 text-red-500 ${activeTab === 'support' ? 'fill-red-500' : ''}`} />
            Spread the Love
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'favorites' ? (
            <div className="flex flex-col h-full">
              {/* Sub-tabs for content types */}
              <div className="flex gap-2 mb-6">
                {[
                  { key: 'sermon', label: 'Sermons', icon: Tv, count: likedSermons.length },
                  { key: 'book', label: 'Books', icon: BookOpen, count: likedBooks.length },
                  { key: 'blog', label: 'Blog Posts', icon: Library, count: likedBlogs.length },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFavSubTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      favSubTab === tab.key
                        ? 'bg-royal-blue-50 text-royal-blue-600 border-royal-blue-100'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      favSubTab === tab.key ? 'bg-royal-blue-100 text-royal-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Loved list container */}
              <div className="flex-1">
                {favSubTab === 'sermon' && (
                  likedSermons.length > 0 ? (
                    <div className="space-y-3">
                      {likedSermons.map(sermon => (
                        <div
                          key={sermon.id}
                          onClick={() => handleItemClick('sermon', sermon)}
                          className="group flex items-center justify-between p-3.5 bg-gray-50 hover:bg-royal-blue-50/30 rounded-2xl border border-gray-100 cursor-pointer transition-all duration-300"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gray-250 overflow-hidden flex-shrink-0 relative">
                              {sermon.thumbnail ? (
                                <img
                                  src={resolveApiUrl(sermon.thumbnail)}
                                  alt={sermon.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-royal-blue-600 to-indigo-700 flex items-center justify-center">
                                  <Tv className="w-5 h-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-royal-blue-600 transition-colors uppercase tracking-wide">
                                {sermon.title}
                              </h4>
                              <p className="text-xs font-semibold text-royal-blue-600 mt-0.5">By {sermon.speaker}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveLike(e, 'sermon', sermon.id)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Unlike sermon"
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="sermons" />
                  )
                )}

                {favSubTab === 'book' && (
                  likedBooks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {likedBooks.map(book => (
                        <div
                          key={book.id}
                          onClick={() => handleItemClick('book', book)}
                          className="group flex items-center justify-between p-3 bg-gray-50 hover:bg-royal-blue-50/30 rounded-2xl border border-gray-100 cursor-pointer transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-14 rounded-lg bg-gray-250 overflow-hidden flex-shrink-0 relative shadow-sm border border-gray-200">
                              {book.coverUrl ? (
                                <img
                                  src={resolveApiUrl(book.coverUrl)}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-royal-blue-600 transition-colors uppercase tracking-wide">
                                {book.title}
                              </h4>
                              <p className="text-xs font-semibold text-gray-500 mt-0.5">{book.author}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveLike(e, 'book', book.id)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
                            title="Unlike book"
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="books" />
                  )
                )}

                {favSubTab === 'blog' && (
                  likedBlogs.length > 0 ? (
                    <div className="space-y-3">
                      {likedBlogs.map(blog => (
                        <div
                          key={blog.id}
                          onClick={() => handleItemClick('blog', blog)}
                          className="group flex items-center justify-between p-3.5 bg-gray-50 hover:bg-royal-blue-50/30 rounded-2xl border border-gray-100 cursor-pointer transition-all duration-300"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-16 h-10 rounded-xl bg-gray-250 overflow-hidden flex-shrink-0 relative">
                              {blog.imageUrl ? (
                                <img
                                  src={resolveApiUrl(blog.imageUrl)}
                                  alt={blog.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                                  <Library className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-royal-blue-600 transition-colors uppercase tracking-wide">
                                {blog.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">{blog.date} • {blog.readTime}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveLike(e, 'blog', blog.id)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Unlike blog post"
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState type="blog posts" />
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Spread love intro */}
              <div className="text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Support Joshua Generation</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your prayers, encouragement, and support fuel the spread of the Gospel. Join us in carrying the presence of God to this generation.
                </p>
              </div>

              {/* Quick Actions (Donate / Apostle Love Gift) */}
              <div className="flex justify-center">
                <a
                  href="https://selar.co/showlove/joshuasgeneration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2.5 p-5 w-full max-w-sm bg-gradient-to-br from-gold-50/50 to-gold-100/30 hover:to-gold-100/50 border border-gold-200/40 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20 text-white">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-gold-800 uppercase tracking-wide">SEND A LOVE GIFT TO THE APOSTLE</span>
                  <span className="text-[10px] text-gold-600 font-semibold uppercase tracking-wider">SUPPORT MINISTRY</span>
                </a>
              </div>

              {/* Message of Appreciation Form */}
              <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-royal-blue-500" />
                  Send a Message of Love & Encouragement
                </h4>

                {submitted ? (
                  <div className="text-center py-6 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h5 className="text-sm font-bold text-gray-900">Thank You!</h5>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                      Your message of encouragement has been sent. May God bless you rich!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleAppreciationSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="yourname@example.com"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Message</label>
                      <textarea
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Write a message of love or testimony..."
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 hover:from-royal-blue-700 hover:to-royal-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-royal-blue-600/15 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes float-heart {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-400px) scale(1.4) rotate(${Math.random() > 0.5 ? '45deg' : '-45deg'});
            opacity: 0;
          }
        }
        .animate-float-heart {
          animation: float-heart 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Heart className="w-5 h-5 text-gray-400" />
      </div>
      <h5 className="text-sm font-bold text-gray-800">No loved {type}</h5>
      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
        Click the ❤️ button on any {type.slice(0, -1)} while browsing the site to save it here for quick access!
      </p>
    </div>
  );
}
