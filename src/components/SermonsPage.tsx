import { useState, useMemo, useEffect } from 'react';
import { Search, Eye, Clock, Headphones, Play, SlidersHorizontal, Calendar, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Sermon } from '@/types';
import { cn } from '@/utils/cn';
import { resolveApiUrl } from '@/utils/api';

interface SermonsPageProps {
  sermons: Sermon[];
  onSermonSelect: (sermon: Sermon) => void;
  isLoading?: boolean;
}

type SortOption = 'newest' | 'views';

const SERMONS_PER_PAGE = 12;

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export default function SermonsPage({ sermons, onSermonSelect, isLoading = false }: SermonsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);

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
          return Number(b.id) - Number(a.id);
        } else if (sortBy === 'views') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [searchQuery, selectedCategory, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedSermons.length / SERMONS_PER_PAGE));
  const paginatedSermons = useMemo(() => {
    const start = (currentPage - 1) * SERMONS_PER_PAGE;
    return filteredAndSortedSermons.slice(start, start + SERMONS_PER_PAGE);
  }, [filteredAndSortedSermons, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

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
        {isLoading ? (
          <div className="space-y-6">
            {/* Mobile Skeleton List */}
            <div className="flex flex-col sm:hidden border-t-2 border-black pt-2 mb-8 divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-4 flex items-start justify-between gap-4 animate-pulse">
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded w-11/12" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-20 bg-gray-150 rounded-xl flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* Desktop Skeleton Grid */}
            <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden animate-pulse flex flex-col h-full">
                  <div className="aspect-[16/10] bg-gray-100" />
                  <div className="p-5 flex-grow space-y-3 flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-250" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-11/12" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 flex-grow" />
                    <div className="pt-3 border-t border-gray-100 flex justify-between mt-auto">
                      <div className="h-3 bg-gray-200 rounded w-16" />
                      <div className="h-3 bg-gray-250 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : paginatedSermons.length > 0 ? (
          <>
          {/* Mobile List View (only visible on mobile screens) */}
          <div className="flex flex-col sm:hidden border-t-2 border-black pt-2 mb-8">
            {paginatedSermons.map((sermon) => (
              <div
                key={sermon.id}
                onClick={() => onSermonSelect(sermon)}
                className="group cursor-pointer py-4 flex items-start justify-between gap-4 border-b border-gray-200"
              >
                {/* Left Side: Title, Preacher, Date, and Stats */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-[13px] font-extrabold text-gray-900 leading-snug uppercase tracking-wide group-hover:text-royal-blue-600 transition-colors mb-1">
                    {sermon.title}
                  </h3>
                  <p className="text-[11px] font-bold text-royal-blue-600 uppercase tracking-tight">
                    By {sermon.speaker}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[10px] text-gray-400 font-medium">
                    <span>
                      {new Date(sermon.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3 text-gray-400" /> {formatNumber(sermon.views)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="flex items-center gap-0.5">
                      <Download className="w-3 h-3 text-gray-400" /> {formatNumber(sermon.downloads || 0)}
                    </span>
                  </div>
                </div>

                {/* Right Side: Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-900 flex-shrink-0 relative">
                  {sermon.thumbnail ? (
                    <img loading="lazy" decoding="async"
                      src={resolveApiUrl(sermon.thumbnail)}
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-royal-blue-950 flex items-center justify-center">
                      <Headphones className="w-5 h-5 text-white/50" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Grid View */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedSermons.map((sermon, index) => (
              <div
                key={sermon.id}
                onClick={() => onSermonSelect(sermon)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-soft hover:shadow-soft-lg transition-all duration-500 cursor-pointer flex flex-col h-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Audio Card Visual */}
                <div className="relative aspect-[16/10] bg-gray-900 overflow-hidden">
                  {sermon.thumbnail ? (
                    <img loading="lazy" decoding="async"
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
                <div className="p-5 flex flex-col flex-grow">
                  {/* Speaker Info at the top */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {sermon.speaker.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 leading-none truncate">{sermon.speaker}</p>
                      <p className="text-[9px] text-gray-400 mt-1 leading-none">Ministering Pastor</p>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug mb-1.5">
                    {sermon.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed mb-4 flex-grow">
                    {sermon.description}
                  </p>

                  {/* Bottom Stats Row */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-300" />
                      {new Date(sermon.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5" title={`${sermon.views.toLocaleString()} views`}>
                        <Eye className="w-3.5 h-3.5 text-gray-400" /> {formatNumber(sermon.views)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5" title={`${(sermon.downloads || 0).toLocaleString()} downloads`}>
                        <Download className="w-3.5 h-3.5 text-gray-400" /> {formatNumber(sermon.downloads || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{(currentPage - 1) * SERMONS_PER_PAGE + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(currentPage * SERMONS_PER_PAGE, filteredAndSortedSermons.length)}</span> of{' '}
                <span className="font-semibold text-gray-700">{filteredAndSortedSermons.length}</span> sermons
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className={cn(
                    'p-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                    currentPage === 1
                      ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-gray-200 text-gray-600 hover:bg-royal-blue-50 hover:text-royal-blue-600 hover:border-royal-blue-200'
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={cn(
                        'w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 border',
                        currentPage === page
                          ? 'bg-royal-blue-600 text-white border-royal-blue-600 shadow-md shadow-royal-blue-500/25'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-royal-blue-50 hover:text-royal-blue-600 hover:border-royal-blue-200'
                      )}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className={cn(
                    'p-2.5 rounded-xl border text-sm font-medium transition-all duration-200',
                    currentPage === totalPages
                      ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-gray-200 text-gray-600 hover:bg-royal-blue-50 hover:text-royal-blue-600 hover:border-royal-blue-200'
                  )}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
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
