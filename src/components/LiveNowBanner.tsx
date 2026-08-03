import { Tv, Users } from 'lucide-react';
import { stats } from '@/data/mockData';

interface LiveNowBannerProps {
  onJoinLive?: () => void;
}

export default function LiveNowBanner({ onJoinLive }: LiveNowBannerProps) {
  return (
    <section className="relative py-8 bg-gradient-to-r from-royal-blue-600 to-royal-blue-800 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
              <span className="relative flex w-2.5 h-2.5">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
              </span>
              <span className="text-red-300 text-xs font-bold uppercase tracking-wider">Live</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Sunday Worship Service</h3>
              <p className="text-white/60 text-sm">Apostle Joshua Iyemifokhae</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/70">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{stats.liveViewers.toLocaleString()} watching</span>
            </div>
            <button onClick={onJoinLive} className="px-6 py-2.5 bg-white text-royal-blue-700 rounded-xl font-semibold text-sm hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4" />
                Join Now
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
