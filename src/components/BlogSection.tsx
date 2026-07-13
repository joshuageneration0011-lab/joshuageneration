import { Clock, ChevronRight, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/types';

interface BlogSectionProps {
  posts: BlogPost[];
  onPostSelect?: (post: BlogPost) => void;
  onViewAll?: () => void;
}

export default function BlogSection({ posts, onPostSelect, onViewAll }: BlogSectionProps) {
  const activePosts = posts.filter(p => !p.isDeleted);
  const featured = activePosts[0] || null;
  const others = activePosts.slice(1, 4);

  return (
    <section id="blog" className="relative py-24 sm:py-32 bg-[#f8f6f1] overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute -left-40 top-1/3 w-[400px] h-[400px] rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-gold-600 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="h-px w-6 bg-gold-500 inline-block" />
              Blog
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Articles & Insights
            </h2>
            <p className="mt-3 text-gray-500 text-lg max-w-md">
              Deepen your faith through God-centered, scripture-filled writings
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-900/10 hover:border-gold-500/40 bg-white hover:bg-gold-50 text-gray-700 hover:text-gold-700 font-semibold text-sm transition-all duration-300 shadow-soft"
          >
            All Posts
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Magazine Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* Featured Article — takes 3 cols */}
          {featured && (
            <div className="lg:col-span-3">
              <div
                onClick={() => onPostSelect?.(featured)}
                className="group cursor-pointer relative rounded-3xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-500 hover:-translate-y-0.5"
              >
                <div className="aspect-[16/10]">
                  <img loading="lazy" decoding="async"
                    src={featured.imageUrl}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-wider uppercase"
                    style={{ background: 'rgba(212,175,55,0.2)', color: '#e4c34a', border: '1px solid rgba(212,175,55,0.3)' }}
                  >
                    {featured.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 group-hover:text-gold-300 transition-colors leading-snug">
                    {featured.title}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2 mb-4">{featured.excerpt}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/45 text-xs">
                      <span className="font-medium text-white/70">{featured.author}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {featured.readTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-gold-400 text-xs font-bold group-hover:gap-2.5 transition-all duration-300">
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side Articles — takes 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {others.map((post) => (
              <div
                key={post.id}
                onClick={() => onPostSelect?.(post)}
                className="group cursor-pointer flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gold-200 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Thumb */}
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  <img loading="lazy" decoding="async"
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase w-fit"
                    style={{ background: 'rgba(212,175,55,0.1)', color: '#b8942f' }}
                  >
                    {post.category}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <span>{post.date}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
