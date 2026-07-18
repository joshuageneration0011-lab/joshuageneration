import { resolveApiUrl } from '@/utils/api';
import { useState, useMemo, useEffect } from 'react';
import { Search, Clock, ArrowRight, Tag, Bookmark, TrendingUp, Feather } from 'lucide-react';
import type { BlogPost } from '@/types';
import { cn } from '@/utils/cn';
import { updatePageSEO } from '@/utils/seo';

interface BlogPageProps {
  posts: BlogPost[];
  onPostSelect: (post: BlogPost) => void;
}

const CATEGORY_ACCENT: Record<string, string> = {
  Faith:      '#2563eb',
  Prayer:     '#7c3aed',
  Devotional: '#059669',
  Scripture:  '#d97706',
  Ministry:   '#dc2626',
  Growth:     '#0891b2',
};

function getAccent(cat: string) {
  return CATEGORY_ACCENT[cat] ?? '#1a37a0';
}

/* Estimated word count → reading progress style label */
function readingLabel(readTime: string) {
  return readTime;
}

export default function BlogPage({ posts, onPostSelect }: BlogPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    updatePageSEO({
      title: 'Christian Blog | Faith-Building Articles & Insights',
      description: 'Read inspiring stories, biblical explanations, and study guides written by our pastoral team.',
      keywords: 'christian blog, faith, spiritual growth, daily devotions, bible study',
      type: 'website',
    });
  }, []);

  const categories = useMemo(() => {
    const list = new Set(posts.filter(p => !p.isDeleted).map(p => p.category));
    return ['All', ...Array.from(list)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (post.isDeleted) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q);
      return matchesSearch && (selectedCategory === 'All' || post.category === selectedCategory);
    });
  }, [posts, searchQuery, selectedCategory]);

  const heroPosts = filteredPosts.slice(0, 3);
  const listPosts  = filteredPosts.slice(3);

  return (
    <div className="min-h-screen bg-[#faf9f7] pt-20">

      {/* ══════════════════════════════
          HEADER
      ══════════════════════════════ */}
      <header className="border-b border-[#e8e3db]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)' }}
              >
                <Feather className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#b8942f]">Joshua Generation</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1208] tracking-tight leading-none">
                  The Faith Journal
                </h1>
                <p className="text-[#8a7a6a] text-sm mt-1">{filteredPosts.length} articles for your spiritual growth</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0a090]" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8e3db] rounded-xl text-sm text-[#1a1208] placeholder-[#b0a090] focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto scrollbar-hide pb-1">
            {categories.map(cat => {
              const accent = getAccent(cat);
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex-shrink-0 whitespace-nowrap',
                    isActive ? 'text-white border-transparent shadow-sm' : 'bg-white text-[#5a4a3a] border-[#e8e3db] hover:border-[#d4af37]/50'
                  )}
                  style={isActive ? { background: accent, boxShadow: `0 2px 8px ${accent}40` } : {}}
                >
                  {isActive && <Tag className="w-3 h-3" />}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════
          MAIN LAYOUT: left content + right sidebar
      ══════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* ── LEFT CONTENT ── */}
          <div>
            {filteredPosts.length > 0 ? (
              <>
                {/* HERO CARDS: 3-up grid at top */}
                {heroPosts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    {heroPosts.map((post, i) => {
                      const accent = getAccent(post.category);
                      const isBig = i === 0;
                      return (
                        <div
                          key={post.id}
                          onClick={() => onPostSelect(post)}
                          onMouseEnter={() => setHoveredId(post.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className={cn(
                            'group cursor-pointer rounded-2xl overflow-hidden relative flex flex-col transition-all duration-500',
                            isBig ? 'sm:col-span-2 h-80 sm:h-96' : 'h-64 sm:h-80'
                          )}
                          style={{ boxShadow: hoveredId === post.id ? `0 20px 60px ${accent}25, 0 4px 16px rgba(0,0,0,0.1)` : '0 4px 16px rgba(0,0,0,0.06)' }}
                        >
                          {/* Full-bleed image */}
                          <img loading="lazy" decoding="async"
                            src={resolveApiUrl(post.imageUrl)}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />

                          {/* Content overlay */}
                          <div className="relative flex flex-col justify-end h-full p-5">
                            {/* Category + time */}
                            <div className="flex items-center gap-2 mb-2.5">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                                style={{ background: accent }}
                              >
                                {post.category}
                              </span>
                              <span className="flex items-center gap-1 text-white/60 text-[10px] font-medium">
                                <Clock className="w-3 h-3" />
                                {readingLabel(post.readTime)}
                              </span>
                            </div>

                            <h2
                              className={cn(
                                'font-extrabold text-white leading-snug mb-2 group-hover:text-[#f9efc5] transition-colors',
                                isBig ? 'text-xl sm:text-2xl' : 'text-base'
                              )}
                              style={{ letterSpacing: '-0.01em' }}
                            >
                              {post.title}
                            </h2>

                            {isBig && (
                              <p className="text-white/65 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-white/50 text-[11px] font-medium">{post.author}</span>
                              <span
                                className="flex items-center gap-1 text-[11px] font-black text-white/80 group-hover:text-white group-hover:gap-1.5 transition-all duration-200"
                              >
                                Read <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* LIST POSTS */}
                {listPosts.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <TrendingUp className="w-4 h-4 text-[#b8942f]" />
                      <h2 className="text-sm font-black text-[#1a1208] uppercase tracking-widest">More Articles</h2>
                      <div className="flex-1 h-px bg-[#e8e3db]" />
                    </div>

                    <div className="space-y-2">
                      {listPosts.map((post) => {
                        const accent = getAccent(post.category);
                        return (
                          <div
                            key={post.id}
                            onClick={() => onPostSelect(post)}
                            onMouseEnter={() => setHoveredId(post.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="group cursor-pointer flex gap-4 p-4 rounded-2xl bg-white border border-[#ede8e0] hover:border-[#d4af37]/40 hover:shadow-md transition-all duration-300"
                          >
                            {/* Thumb */}
                            <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                              <img loading="lazy" decoding="async"
                                src={resolveApiUrl(post.imageUrl)}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              {/* Category */}
                              <div>
                                <span
                                  className="text-[9px] font-black uppercase tracking-widest"
                                  style={{ color: accent }}
                                >
                                  {post.category}
                                </span>
                                <h3 className="text-sm font-extrabold text-[#1a1208] group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug mt-0.5">
                                  {post.title}
                                </h3>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-[10px] text-[#9a8a7a] font-medium">
                                  <span>{post.author}</span>
                                  <span className="w-1 h-1 rounded-full bg-[#c0b0a0]" />
                                  <Clock className="w-3 h-3" />
                                  <span>{post.readTime}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-[#c0b0a0] group-hover:text-[#b8942f] group-hover:translate-x-0.5 transition-all duration-200" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-24 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#f0ebe2] flex items-center justify-center">
                  <Feather className="w-7 h-7 text-[#b0a090]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#1a1208]">No articles found</h3>
                <p className="text-[#8a7a6a] text-sm max-w-xs">
                  No articles match "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="space-y-6">

            {/* About the Journal */}
            <div className="bg-white rounded-2xl border border-[#ede8e0] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#b8942f] mb-3">About the Journal</h3>
              <p className="text-sm text-[#6a5a4a] leading-relaxed">
                Faith-building articles crafted by our pastoral team — helping believers grow deeper in scripture, prayer, and purpose.
              </p>
              <div
                className="mt-4 h-px"
                style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
              />
            </div>

            {/* Topics */}
            <div className="bg-white rounded-2xl border border-[#ede8e0] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#b8942f] mb-4">Browse Topics</h3>
              <div className="space-y-2">
                {categories.filter(c => c !== 'All').map(cat => {
                  const accent = getAccent(cat);
                  const count = posts.filter(p => !p.isDeleted && p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                        selectedCategory === cat
                          ? 'text-white'
                          : 'text-[#3a2a1a] hover:bg-[#faf5ec]'
                      )}
                      style={selectedCategory === cat ? { background: accent } : {}}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: accent }}
                        />
                        {cat}
                      </div>
                      <span
                        className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-[#f0ebe2] text-[#8a7a6a]')}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #07103d 0%, #0f2060 100%)' }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}
              />
              <Bookmark className="w-6 h-6 text-[#d4af37] mb-3" />
              <h3 className="text-sm font-black text-white mb-1.5">Weekly Devotional</h3>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                Get faith-building articles delivered to your inbox every week.
              </p>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#d4af37]/50 transition-colors mb-2.5"
              />
              <button
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
              >
                Subscribe Free
              </button>
            </div>

            {/* Latest 3 quick links */}
            <div className="bg-white rounded-2xl border border-[#ede8e0] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#b8942f] mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {posts.filter(p => !p.isDeleted).slice(0, 3).map(post => (
                  <div
                    key={post.id}
                    onClick={() => onPostSelect(post)}
                    className="group cursor-pointer flex gap-3 items-start"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                      <img loading="lazy" decoding="async" src={resolveApiUrl(post.imageUrl)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#1a1208] group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-[10px] text-[#9a8a7a] mt-0.5">{post.readTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
