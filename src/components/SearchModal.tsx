import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tv, BookOpen, Library, Calendar, ArrowRight, Loader2, Sparkles, HeartHandshake } from 'lucide-react';
import { api } from '@/utils/api';
import type { Sermon, Book, BlogPost, Event } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, id?: string) => void;
  onSelectSermon?: (sermon: Sermon) => void;
  onSelectBook?: (book: Book) => void;
  onSelectPost?: (post: BlogPost) => void;
}

const SUGGESTED_KEYWORDS = [
  'Prayer',
  'Favour',
  'Holy Spirit',
  'Spiritual Attacks',
  'Bible',
  'Imagination',
  'Righteousness',
  'Authority',
  'Sermons',
  'Books'
];

export default function SearchModal({
  isOpen,
  onClose,
  onNavigate,
  onSelectSermon,
  onSelectBook,
  onSelectPost
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadAllContent();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadAllContent = async () => {
    setLoading(true);
    try {
      const [sermonsRes, booksRes, blogRes, eventsRes] = await Promise.all([
        api.getSermons().catch(() => []),
        api.getBooks().catch(() => []),
        api.getBlogPosts().catch(() => []),
        api.getEvents().catch(() => [])
      ]);
      setSermons(sermonsRes);
      setBooks(booksRes);
      setPosts(blogRes);
      setEvents(eventsRes);
    } catch (err) {
      console.error('Failed to load content for search', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const isPrayerSearch = q && ('prayer'.includes(q) || 'pray'.includes(q) || 'contact'.includes(q) || 'request'.includes(q) || q.includes('pray'));

  const filteredSermons = q
    ? (q === 'sermon' || q === 'sermons')
      ? sermons
      : sermons.filter(s => s.title.toLowerCase().includes(q) || (s.speaker && s.speaker.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q)))
    : [];

  const filteredBooks = q
    ? (q === 'book' || q === 'books')
      ? books
      : books.filter(b => b.title.toLowerCase().includes(q) || (b.author && b.author.toLowerCase().includes(q)) || (b.description && b.description.toLowerCase().includes(q)))
    : [];

  const filteredPosts = q
    ? (q === 'blog' || q === 'article' || q === 'articles')
      ? posts
      : posts.filter(p => p.title.toLowerCase().includes(q) || (p.excerpt && p.excerpt.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)))
    : [];

  const filteredEvents = q
    ? (q === 'event' || q === 'events')
      ? events
      : events.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)))
    : [];

  const totalResults = (isPrayerSearch ? 1 : 0) + filteredSermons.length + filteredBooks.length + filteredPosts.length + filteredEvents.length;

  const handleSelectResult = (page: string) => {
    onClose();
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Header Input */}
        <div className="relative p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sermons, books, articles, events, prayer..."
            className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 font-medium text-base sm:text-lg focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 bg-gray-200/70 hover:bg-gray-300/70 transition-colors flex-shrink-0 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-royal-blue-600" />
              <p className="text-sm font-medium">Searching ministry archive...</p>
            </div>
          ) : !q ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Suggested Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_KEYWORDS.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-royal-blue-50 hover:text-royal-blue-600 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <p className="text-base font-semibold">No results found for "{query}"</p>
              <p className="text-xs text-gray-400">Try searching for keywords like "Prayer", "Favour", "Holy Spirit", or "Bible".</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Prayer Requests / Contact Result */}
              {isPrayerSearch && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><HeartHandshake className="w-4 h-4 text-rose-500" /> Prayer & Contact</span>
                  </div>
                  <div className="bg-rose-50/50 rounded-2xl border border-rose-100 overflow-hidden">
                    <button
                      onClick={() => handleSelectResult('contact')}
                      className="w-full text-left p-4 hover:bg-rose-50 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors">Submit a Prayer Request</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Send your prayer requests and inquiries directly to the ministry team.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all flex-shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sermons */}
              {filteredSermons.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Tv className="w-4 h-4 text-royal-blue-600" /> Sermons ({filteredSermons.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                    {filteredSermons.slice(0, 6).map((sermon) => (
                      <button
                        key={sermon.id}
                        onClick={() => {
                          onClose();
                          if (onSelectSermon) {
                            onSelectSermon(sermon);
                          } else if (onNavigate) {
                            onNavigate('sermon-player', sermon.id);
                          }
                        }}
                        className="w-full text-left p-3.5 hover:bg-white transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-royal-blue-600 transition-colors">{sermon.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{sermon.speaker || 'Joshua’s Generation'} • {sermon.duration || 'Audio Sermon'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-royal-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span>Listen</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Books */}
              {filteredBooks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-gold-500" /> Books ({filteredBooks.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                    {filteredBooks.slice(0, 6).map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          onClose();
                          if (onSelectBook) {
                            onSelectBook(book);
                          } else if (onNavigate) {
                            onNavigate('book-details', book.id);
                          }
                        }}
                        className="w-full text-left p-3.5 hover:bg-white transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-gold-600 transition-colors">{book.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">By {book.author || 'Joshua’s Generation'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span>Read</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Posts */}
              {filteredPosts.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Library className="w-4 h-4 text-emerald-600" /> Articles ({filteredPosts.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                    {filteredPosts.slice(0, 6).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => {
                          onClose();
                          if (onSelectPost) {
                            onSelectPost(post);
                          } else if (onNavigate) {
                            onNavigate('blog-details', post.id);
                          }
                        }}
                        className="w-full text-left p-3.5 hover:bg-white transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">{post.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.excerpt || post.category || 'Article'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span>Read</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {filteredEvents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-purple-600" /> Events ({filteredEvents.length})</span>
                  </div>
                  <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                    {filteredEvents.slice(0, 6).map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => handleSelectResult('home')}
                        className="w-full text-left p-3.5 hover:bg-white transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{evt.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{evt.date || 'Upcoming Event'}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-purple-600 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-400">
          Search across Joshua’s Generation sermons, books, blog posts, and events
        </div>
      </div>
    </div>
  );
}
