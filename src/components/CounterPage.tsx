import React, { useState, useEffect } from 'react';
import { Eye, Users, Tv, PlayCircle, Home, Heart } from 'lucide-react';
import type { Page } from '@/App';

interface CounterPageProps {
  onNavigate: (page: Page) => void;
}

interface CounterStats {
  pageViews: number;
  registeredUsers: number;
  sermonsCount: number;
  totalSermonViews: number;
}

export default function CounterPage({ onNavigate }: CounterPageProps) {
  const [stats, setStats] = useState<CounterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Increment the view counter
    const incrementViews = async () => {
      try {
        await fetch('/api/counter/increment', { method: 'POST' });
      } catch (err) {
        console.error('Failed to increment counter page view:', err);
      }
    };

    // 2. Fetch all community statistics
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/counter/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch counter page stats:', err);
      } finally {
        setLoading(false);
      }
    };

    const run = async () => {
      await incrementViews();
      await fetchStats();
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none"
      />
      <div 
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gold-500/10 blur-[100px] pointer-events-none"
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full pt-32">
        
        {/* Header Block */}
        <div className="text-center space-y-4 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-semibold uppercase tracking-wider">
            Live Platform Activity
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gold-300 bg-clip-text text-transparent">
            Joshua Generation Counter
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg mx-auto">
            Witness the growth and global outreach of our ministry as we take the gospel to the ends of the earth.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            <span className="text-gold-400 text-xs font-bold uppercase tracking-wider animate-pulse">Loading Counter...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-16">
            
            {/* Page View Counter Card */}
            <div className="bg-[#0b1228] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-gold-500/30 hover:shadow-2xl hover:shadow-gold-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gold-500/10 to-transparent blur-xl opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-400">
                  <Eye className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Views Counter</span>
              </div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Total Page Views</p>
              <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-gold-400 transition-colors duration-300 font-mono">
                {(stats?.pageViews || 0).toLocaleString()}
              </h3>
            </div>

            {/* Registered Users Counter Card */}
            <div className="bg-[#0b1228] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent blur-xl opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Community</span>
              </div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Registered Users</p>
              <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-blue-400 transition-colors duration-300 font-mono">
                {(stats?.registeredUsers || 0).toLocaleString()}
              </h3>
            </div>

            {/* Total Sermon Views */}
            <div className="bg-[#0b1228] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent blur-xl opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Global Outreach</span>
              </div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Teachings Viewed</p>
              <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-300 font-mono">
                {(stats?.totalSermonViews || 0).toLocaleString()}
              </h3>
            </div>

            {/* Total Sermons Count */}
            <div className="bg-[#0b1228] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/5 transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent blur-xl opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Tv className="w-6 h-6" />
                </div>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Media Library</span>
              </div>
              <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Total Audio & Video Sermons</p>
              <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors duration-300 font-mono">
                {(stats?.sermonsCount || 0).toLocaleString()}
              </h3>
            </div>

          </div>
        )}

        {/* Quick Navigation Action Grid */}
        <div className="w-full max-w-2xl bg-[#0b1228]/50 backdrop-blur-md border border-white/5 p-8 rounded-[2rem] text-center space-y-6">
          <h4 className="text-base font-bold text-white/90">Quick Navigation</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Home Page Link */}
            <button
              onClick={() => onNavigate('home')}
              className="group p-4 bg-[#111a37] hover:bg-[#162248] rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Home className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">Home Page</span>
            </button>

            {/* Sermons Link */}
            <button
              onClick={() => onNavigate('sermons')}
              className="group p-4 bg-[#111a37] hover:bg-[#162248] rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Tv className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">Sermons</span>
            </button>

            {/* Give Link */}
            <button
              onClick={() => onNavigate('donate')}
              className="group p-4 bg-[#111a37] hover:bg-gold-500/10 rounded-2xl border border-white/5 hover:border-gold-500/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Heart className="w-5 h-5 text-gold-400" />
              <span className="text-xs font-bold text-gold-400 group-hover:text-gold-300 transition-colors">Give</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
