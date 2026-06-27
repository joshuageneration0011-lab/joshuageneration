import { useState, useMemo } from 'react';
import { Search, Eye, Clock, Headphones, Play, SlidersHorizontal, Calendar, Download } from 'lucide-react';
import type { Sermon } from '@/types';
import { cn } from '@/utils/cn';
import { resolveApiUrl } from '@/utils/api';

interface SermonsPageProps {
  sermons: Sermon[];
  onSermonSelect: (sermon: Sermon) => void;
}

type SortOption = 'newest' | 'views';

export default function SermonsPage({ sermons, onSermonSelect }: SermonsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Categories extraction
  const categories = useMemo(() => {
    const list = new Set(sermons.map((s) => s.category));
    return ['All', ...Array.from(list)];
  }, []);

  // Filter and sort logic
  const filteredAndSortedSermons = useMemo(() => {
    return sermons
      .filter((sermon) => {
        const matchesSearch =
          sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sermon.speaker.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || sermon.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === 'views') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="pt-24 lg:pt-28 pb-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-royal-blue-50 text-royal-blue-600 text-xs font-semibold tracking-wide uppercase mb-4">
            Sermon Library
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Empowering Messages of <span className="text-royal-blue-600">Faith & Grace</span>
          </h1>
          <p className="text-lg text-gray-500">
            Stream, listen, and study life-changing scriptures preached by our pastors and guest speakers.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sermons by title or speaker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
            />
          </div>

          {/* Sort bar */}
          <div className="flex w-full md:w-auto items-center gap-3 justify-end">
            <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
              Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all cursor-pointer"
            >
              <option value="newest">Newest Messages</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 border',
                selectedCategory === category
                  ? 'bg-royal-blue-600 text-white border-royal-blue-600 shadow-md shadow-royal-blue-500/25 scale-[1.02]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sermons Grid */}
        {filteredAndSortedSermons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedSermons.map((sermon, index) => (
              <div
                key={sermon.id}
                onClick={() => onSermonSelect(sermon)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-500 cursor-pointer flex flex-col h-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Audio Card Visual */}
                <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
                  {sermon.thumbnail ? (
                    <img
                      src={resolveApiUrl(sermon.thumbnail)}
                      alt={sermon.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-royal-blue-950/60 to-gray-900" />
                  )}

                  {sermon.thumbnail && (
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />
                  )}

                  {/* Subtle waveform bars */}
                  <div className="absolute inset-0 flex items-end justify-around px-4 pb-4 opacity-20 pointer-events-none">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-royal-blue-400"
                        style={{ height: `${Math.max(8, (Math.sin(i * 0.8 + index) + 1) * 24 + 8)}px` }}
                      />
                    ))}
                  </div>

                  {/* Category badge */}
                  <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-royal-blue-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-md shadow-royal-blue-500/20">
                    {sermon.category}
                  </span>

                  {/* Duration badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {sermon.duration}
                  </div>

                  {/* Headphones icon centered (fallback only) */}
                  {!sermon.thumbnail && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={cn(
                        'w-16 h-16 rounded-full bg-gradient-to-br from-royal-blue-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-royal-blue-500/30 transition-all duration-300',
                        'group-hover:scale-110 group-hover:shadow-royal-blue-500/50'
                      )}>
                        <Headphones className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Play hover overlay */}
                  <div className="absolute inset-0 bg-royal-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-3 right-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-royal-blue-600 text-white text-[10px] font-bold shadow-lg">
                        <Play className="w-3 h-3 fill-white" />
                        Listen Now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sermon.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {sermon.views.toLocaleString()} views
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                    {sermon.title}
                  </h3>

                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-grow">
                    {sermon.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-xs">
                        {sermon.speaker.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-none">{sermon.speaker}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Ministering Pastor</p>
                      </div>
                    </div>

                    {sermon.audioUrl && (
                      <a
                        href={resolveApiUrl(sermon.audioUrl)}
                        download={`${sermon.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sermon.mp3`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-royal-blue-50 text-gray-400 hover:text-royal-blue-600 border border-gray-200 hover:border-royal-blue-100 transition-all flex items-center justify-center"
                        title="Download Sermon Audio"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-soft">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No sermons found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              We couldn't find any sermons matching "{searchQuery}". Try adjusting your keywords or selected category.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-6 px-5 py-2.5 bg-royal-blue-600 hover:bg-royal-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-royal-blue-500/20"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
