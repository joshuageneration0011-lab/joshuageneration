import { BookOpen, Share2, Bookmark } from 'lucide-react';
import { dailyDevotional } from '@/data/mockData';

export default function DailyDevotional() {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-br from-royal-blue-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Label */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold tracking-wide uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              Daily Devotional
            </span>
          </div>

          {/* Verse Card */}
          <div className="relative p-8 sm:p-12 rounded-3xl bg-white shadow-soft-lg border border-gray-100 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-royal-blue-500/5 rounded-full -ml-12 -mb-12" />

            <div className="relative">
              {/* Scripture */}
              <p className="font-cormorant text-3xl sm:text-4xl italic text-gray-800 leading-relaxed mb-6">
                "{dailyDevotional.text}"
              </p>
              <p className="text-gold-600 font-semibold text-base uppercase tracking-wider">
                — {dailyDevotional.verse}
              </p>

              {/* Divider */}
              <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Reflection */}
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Reflection</h4>
                <p className="text-gray-600 leading-relaxed">{dailyDevotional.reflection}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-gray-100">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-royal-blue-50 text-royal-blue-600 font-medium text-sm hover:bg-royal-blue-100 transition-colors">
                  <BookOpen className="w-4 h-4" />
                  Read Full Devotional
                </button>
                <button className="p-2.5 rounded-xl text-gray-400 hover:text-royal-blue-600 hover:bg-royal-blue-50 transition-all">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-2.5 rounded-xl text-gray-400 hover:text-royal-blue-600 hover:bg-royal-blue-50 transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
