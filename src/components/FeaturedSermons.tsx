import { Headphones, Clock, Eye, ChevronRight, Download } from 'lucide-react';
import type { Sermon } from '@/types';
import { resolveApiUrl } from '@/utils/api';

interface FeaturedSermonsProps {
  sermons: Sermon[];
  onSermonSelect?: (sermon: Sermon) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export default function FeaturedSermons({ sermons, onSermonSelect, onViewAll, isLoading = false }: FeaturedSermonsProps) {
  const featured = [...sermons]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 4);

  return (
    <section id="sermons" className="relative py-24 sm:py-32 bg-[#f8f6f1] overflow-hidden">
      {/* Warm cream background texture */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(212,175,55,0.06) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(30,64,175,0.04) 0%, transparent 50%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-gold-600 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="h-px w-6 bg-gold-500 inline-block" />
              Featured Sermons
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Latest Messages
            </h2>
            <p className="mt-3 text-gray-500 text-lg max-w-md">
              Spirit-filled messages to strengthen and ignite your faith
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-900/10 hover:border-gold-500/40 bg-white hover:bg-gold-50 text-gray-700 hover:text-gold-700 font-semibold text-sm transition-all duration-300 shadow-soft"
          >
            View All Sermons
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-soft overflow-hidden animate-pulse flex flex-col h-full">
                <div className="h-44 bg-gray-200" />
                <div className="p-5 flex flex-col gap-3 flex-grow">
                  <div className="h-4 bg-gray-200 rounded w-11/12" />
                  <div className="h-3 bg-gray-150 rounded w-2/3" />
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2 mt-auto">
                    <div className="w-7 h-7 rounded-full bg-gray-250 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-gray-200 rounded w-16" />
                      <div className="h-2 bg-gray-150 rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((sermon, index) => (
              <div
                key={sermon.id}
                onClick={() => onSermonSelect?.(sermon)}
                className="group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gold-200 shadow-soft hover:shadow-soft-lg transition-all duration-500 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Audio card visual */}
                <div className="relative h-44 flex flex-col items-center justify-center overflow-hidden bg-gray-900">
                  {sermon.thumbnail ? (
                    <img
                      src={resolveApiUrl(sermon.thumbnail)}
                      alt={sermon.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, #0c1a56 0%, #0f2060 ${40 + index * 8}%, #1a37a0 100%)`,
                      }}
                    />
                  )}

                  {sermon.thumbnail && (
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />
                  )}

                  {/* Waveform deco */}
                  <div className="absolute inset-0 flex items-end justify-around px-3 pb-3 opacity-15 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 rounded-full bg-gold-400"
                        style={{ height: `${Math.max(6, (Math.sin(i * 0.6 + index) + 1) * 18 + 6)}px` }}
                      />
                    ))}
                  </div>

                  {/* Category badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gold-500/20 text-gold-300 text-[10px] font-bold tracking-wider uppercase border border-gold-500/20">
                    {sermon.category}
                  </span>

                  {/* Duration */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-sm text-white/70 text-[10px] font-medium">
                    <Clock className="w-3 h-3" />
                    {sermon.duration}
                  </div>

                  {/* Center Play Button (only shown on hover or fallback without thumbnail) */}
                  {!sermon.thumbnail && (
                    <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center shadow-lg shadow-gold-500/30">
                      <Headphones className="w-5 h-5 text-gray-900" />
                    </div>
                  )}

                  {/* Hover overlay with play button */}
                  <div className="absolute inset-0 bg-gold-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gold-500 text-gray-900 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1 block">
                    {new Date(sermon.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <h3 className="text-[15px] font-bold text-gray-950 group-hover:text-gold-600 transition-colors line-clamp-2 leading-snug mb-4">
                    {sermon.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {sermon.speaker.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-700 leading-none truncate">{sermon.speaker}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" /> {sermon.views.toLocaleString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Download className="w-3 h-3" /> {(sermon.downloads || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
