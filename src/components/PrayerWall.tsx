import { Heart, AlertCircle, Clock, Users } from 'lucide-react';
import { prayerRequests } from '@/data/mockData';

export default function PrayerWall() {
  return (
    <section className="relative py-20 sm:py-28 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-royal-blue-50 text-royal-blue-600 text-xs font-semibold tracking-wide uppercase mb-4">
            Prayer Wall
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Praying Together
          </h2>
          <p className="mt-2 text-gray-500 text-lg">Join the community in prayer</p>
        </div>

        {/* Prayer Requests */}
        <div className="space-y-4">
          {prayerRequests.map((prayer) => (
            <div
              key={prayer.id}
              className="p-5 sm:p-6 rounded-2xl bg-white shadow-soft border border-gray-100 hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center text-white text-xs font-bold">
                      {prayer.isAnonymous ? '?' : prayer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {prayer.isAnonymous ? 'Anonymous' : prayer.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{prayer.date}</span>
                      </div>
                    </div>
                    {prayer.isUrgent && (
                      <span className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-500 text-[10px] font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        Urgent
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mt-2">
                    {prayer.request}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-royal-blue-50 text-royal-blue-600 text-xs font-medium hover:bg-royal-blue-100 transition-colors">
                  <Heart className="w-3.5 h-3.5" />
                  <span>I Prayed ({prayer.prayerCount})</span>
                </button>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{prayer.prayerCount} prayers</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-royal-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-royal-blue-700 transition-colors shadow-lg shadow-royal-blue-500/20">
            View All Prayer Requests
          </button>
        </div>
      </div>
    </section>
  );
}
