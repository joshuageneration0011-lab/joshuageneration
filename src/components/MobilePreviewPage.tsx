import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Battery, ChevronRight, Play,
  DollarSign, ArrowRight, Compass,
  PlayCircle, CheckCircle, Zap, Volume2, BookOpen as BookIcon, Radio
} from 'lucide-react';

interface Sermon {
  id: string;
  title: string;
  preacher: string;
  audioUrl: string;
  duration: string;
  thumbnail: string;
  category: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  thumbnail: string;
  pages: number;
}

export const MobilePreviewPage = () => {
  // Mobile app navigation state: 'onboarding' | 'app'
  const [appState, setAppState] = useState<'onboarding' | 'app'>('onboarding');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  
  // App navigation state: 'home' | 'sermons' | 'books' | 'donate'
  const [activeTab, setActiveTab] = useState<'home' | 'sermons' | 'books' | 'donate'>('home');
  
  // App Data & Session States
  const [sermons] = useState<Sermon[]>([
    {
      id: '1',
      title: 'Discerning the Voice of God',
      preacher: 'Apostle Joshua Selman',
      audioUrl: '',
      duration: '1h 12m',
      thumbnail: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&fit=crop',
      category: 'Spiritual Growth'
    },
    {
      id: '2',
      title: 'The Law of Mental Renewal',
      preacher: 'Apostle Joshua Selman',
      audioUrl: '',
      duration: '1h 45m',
      thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&fit=crop',
      category: 'Mindset'
    }
  ]);

  const [books] = useState<Book[]>([
    {
      id: '1',
      title: 'Defining Prophetic Seasons',
      author: 'Apostle Joshua Selman',
      price: 2500,
      thumbnail: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&fit=crop',
      pages: 180
    },
    {
      id: '2',
      title: 'The Altar of Prayer',
      author: 'Apostle Joshua Selman',
      price: 3000,
      thumbnail: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&fit=crop',
      pages: 220
    }
  ]);

  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [isPlayingSermon, setIsPlayingSermon] = useState(false);
  
  // Donation States
  const [donationAmount, setDonationAmount] = useState('5000');
  const [donationCause, setDonationCause] = useState('Global Missions');
  const [isDonating, setIsDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Status Bar Clock
  const [currentTime, setCurrentTime] = useState('09:41');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
      setCurrentTime(`${hoursStr}:${minutesStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDonating(true);
    setTimeout(() => {
      setIsDonating(false);
      setDonationSuccess(true);
      setTimeout(() => {
        setDonationSuccess(false);
        setDonationAmount('5000');
      }, 3000);
    }, 1500);
  };

  // Onboarding Slides
  const onboardingSlides = [
    {
      title: 'Joshua Generation App',
      subtitle: 'Experience digital spiritual resources, sermons, and apostolic streams anywhere.',
      image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&fit=crop'
    },
    {
      title: 'Apostolic Sermons',
      subtitle: 'Stream and download life-transforming audio sermons from Apostle Joshua Selman.',
      image: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&fit=crop'
    },
    {
      title: 'Kingdom Bookstore',
      subtitle: 'Get spiritual books and materials to renew your mind and empower your spirit.',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&fit=crop'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center py-16 px-4 relative overflow-hidden select-none">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Product/Features Info */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-amber-500/15 border border-purple-500/35">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">Joshua Gen Android App</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Joshua Generation <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-purple-600 bg-clip-text text-transparent">
              Mobile Portal
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            We have integrated a premium Android Mobile app simulator into the Joshua Generation web application. Look inside the interactive simulator on the right to preview the custom audio sermon player, bookstore listings, and donation workflows!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0 pt-4">
            {[
              { title: 'Interactive Onboarding', desc: 'Sleek, fluid welcome presentation' },
              { title: 'Sermons Library', desc: 'Browse and stream audio sermons directly' },
              { title: 'Kingdom Bookstore', desc: 'Browse books and read spiritual summaries' },
              { title: 'Secure Donation Portal', desc: 'Streamlined cause backing and payments' }
            ].map((f, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-bold text-sm text-white">{f.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Smartphone Simulator */}
        <div className="lg:col-span-5 flex justify-center">
          
          {/* Smartphone Frame Wrapper */}
          <div className="relative w-[360px] h-[740px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col ring-1 ring-white/10">
            
            {/* Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
              <div className="w-12 h-1 bg-slate-950 rounded-full"></div>
            </div>

            {/* Simulated Status Bar */}
            <div className="h-9 bg-slate-950 px-6 flex items-center justify-between z-40 text-xs font-bold text-white/90">
              <span>{currentTime}</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-[10px] tracking-widest font-mono">5G</span>
                <Battery className="w-4 h-4 fill-white/80" />
              </div>
            </div>

            {/* Screen Content Wrapper */}
            <div className="flex-1 bg-slate-900 text-white overflow-hidden flex flex-col relative select-none">
              
              <AnimatePresence mode="wait">
                
                {/* ONBOARDING SCREEN */}
                {appState === 'onboarding' && (
                  <motion.div
                    key="onboarding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900 justify-between p-6 relative"
                  >
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-extrabold text-sm text-amber-400">JOSHUA GEN</span>
                      <button onClick={() => setAppState('app')} className="text-xs font-bold text-white/60 hover:text-white">Skip</button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center my-4 space-y-6">
                      <img 
                        src={onboardingSlides[onboardingIndex].image} 
                        alt="slide" 
                        className="w-48 h-48 object-cover rounded-3xl shadow-lg border border-white/10"
                      />
                      <div className="space-y-3 text-center">
                        <h3 className="text-xl font-black">{onboardingSlides[onboardingIndex].title}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed max-w-[260px] mx-auto">
                          {onboardingSlides[onboardingIndex].subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      {/* Dots */}
                      <div className="flex gap-2">
                        {onboardingSlides.map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all ${onboardingIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/30'}`}
                          />
                        ))}
                      </div>

                      {/* Next button */}
                      <button
                        onClick={() => {
                          if (onboardingIndex === onboardingSlides.length - 1) {
                            setAppState('app');
                          } else {
                            setOnboardingIndex(prev => prev + 1);
                          }
                        }}
                        className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-950 font-bold hover:scale-105 transition-transform"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* MAIN APP SHELL */}
                {appState === 'app' && (
                  <motion.div
                    key="app"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col h-full relative"
                  >
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                      
                      {/* HOME TAB */}
                      {activeTab === 'home' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                          
                          {/* Welcome Greeting */}
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Welcome back,</span>
                              <h3 className="text-lg font-bold">Watchman</h3>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center font-bold text-sm text-slate-950">
                              W
                            </div>
                          </div>

                          {/* Live Radio Player banner */}
                          <div className="p-4 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-red-500 tracking-wider animate-pulse">LIVE BROADCAST</span>
                              </div>
                              <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                            </div>
                            <h4 className="font-bold text-sm mt-3">Joshua Gen Ministries Radio</h4>
                            <p className="text-[10px] text-indigo-200 mt-1">
                              Apostle Joshua Selman preaching live.
                            </p>
                            <button
                              onClick={() => alert('Streaming live radio on mobile...')}
                              className="mt-4 px-3 py-1.5 bg-white text-indigo-900 font-bold rounded-lg text-[10px] flex items-center gap-1.5"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen Live</span>
                            </button>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center space-y-1">
                              <span className="text-xs text-gray-400 font-bold">Sermons Played</span>
                              <p className="text-lg font-black text-amber-400">12</p>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center space-y-1">
                              <span className="text-xs text-gray-400 font-bold">Books Downloaded</span>
                              <p className="text-lg font-black text-amber-400">4</p>
                            </div>
                          </div>

                          {/* Featured Sermon */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Featured Sermon</h4>
                            <div 
                              onClick={() => {
                                setSelectedSermon(sermons[0]);
                                setActiveTab('sermons');
                              }}
                              className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
                            >
                              <img src={sermons[0].thumbnail} alt="thumb" className="w-16 h-10 object-cover rounded-lg" />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-white truncate">{sermons[0].title}</h5>
                                <p className="text-[9px] text-gray-400">{sermons[0].duration}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </div>
                          </div>

                        </motion.div>
                      )}

                      {/* SERMONS LIBRARY TAB */}
                      {activeTab === 'sermons' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          
                          {selectedSermon ? (
                            <div className="space-y-4">
                              <button 
                                onClick={() => {
                                  setSelectedSermon(null);
                                  setIsPlayingSermon(false);
                                }}
                                className="text-xs font-bold text-amber-400 flex items-center gap-1"
                              >
                                ← Back to Sermons
                              </button>

                              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
                                <img src={selectedSermon.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  {isPlayingSermon ? (
                                    <div className="text-center space-y-2">
                                      <div className="flex gap-1 justify-center items-end h-8">
                                        <div className="w-1.5 bg-amber-400 h-6 animate-pulse"></div>
                                        <div className="w-1.5 bg-amber-400 h-8 animate-pulse delay-75"></div>
                                        <div className="w-1.5 bg-amber-400 h-4 animate-pulse delay-150"></div>
                                      </div>
                                      <button 
                                        onClick={() => setIsPlayingSermon(false)}
                                        className="text-[10px] font-bold text-red-400"
                                      >
                                        Pause Sermon
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setIsPlayingSermon(true)}
                                      className="p-3 bg-amber-400 text-slate-950 rounded-full hover:scale-105 transition-transform"
                                    >
                                      <Play className="w-6 h-6 fill-slate-950" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">{selectedSermon.category}</span>
                                <h3 className="font-extrabold text-base pt-1">{selectedSermon.title}</h3>
                                <p className="text-xs text-gray-400">By {selectedSermon.preacher}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <h3 className="text-lg font-bold">Sermons Library</h3>
                                <p className="text-[10px] text-gray-400">Stream spiritual keys and teachings</p>
                              </div>

                              <div className="space-y-3">
                                {sermons.map((s) => (
                                  <div 
                                    key={s.id} 
                                    onClick={() => setSelectedSermon(s)}
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
                                  >
                                    <img src={s.thumbnail} alt="thumb" className="w-16 h-12 object-cover rounded-xl" />
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[8px] text-amber-400 font-bold uppercase">{s.category}</span>
                                      <h5 className="font-bold text-xs text-white truncate mt-0.5">{s.title}</h5>
                                      <p className="text-[9px] text-gray-400">Duration: {s.duration}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                        </motion.div>
                      )}

                      {/* BOOKSTORE TAB */}
                      {activeTab === 'books' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <div>
                            <h3 className="text-lg font-bold">Kingdom Bookstore</h3>
                            <p className="text-[10px] text-gray-400">Spiritual books for mental renewal</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {books.map((b) => (
                              <div key={b.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-2 text-center">
                                <img src={b.thumbnail} alt="thumb" className="h-28 w-20 object-cover rounded-lg mx-auto shadow-md" />
                                <div className="space-y-1">
                                  <h4 className="font-bold text-[10px] text-white truncate">{b.title}</h4>
                                  <p className="text-[8px] text-gray-400">Author: {b.author}</p>
                                  <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-black text-amber-400">₦{b.price}</span>
                                    <button 
                                      onClick={() => alert(`Purchasing ${b.title}...`)}
                                      className="px-2 py-1 bg-amber-400 text-slate-950 rounded text-[8px] font-bold"
                                    >
                                      Get
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* DONATE TAB */}
                      {activeTab === 'donate' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <div>
                            <h3 className="text-lg font-bold">Sow a Seed</h3>
                            <p className="text-[10px] text-gray-400">Back our global kingdom missions</p>
                          </div>

                          {donationSuccess ? (
                            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-center space-y-2">
                              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                              <h4 className="font-bold text-xs">Sowing Logged Successfully</h4>
                              <p className="text-[10px] text-gray-400">Thank you for backing Joshua Gen ministries.</p>
                            </div>
                          ) : (
                            <form onSubmit={handleDonateSubmit} className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Donation Cause</label>
                                <select 
                                  value={donationCause}
                                  onChange={e => setDonationCause(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                >
                                  <option value="Global Missions">Global Missions</option>
                                  <option value="Sermon Production">Sermon Production</option>
                                  <option value="Welfare Support">Welfare Support</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Amount (₦)</label>
                                <input 
                                  type="number"
                                  value={donationAmount}
                                  onChange={e => setDonationAmount(e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                  placeholder="5000"
                                  required
                                />
                              </div>

                              <button 
                                type="submit"
                                disabled={isDonating}
                                className="w-full bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs"
                              >
                                {isDonating ? 'Processing Seed...' : 'Sow Seed Now'}
                              </button>
                            </form>
                          )}
                        </motion.div>
                      )}

                    </div>

                    {/* Bottom Nav Bar */}
                    <div className="h-14 bg-slate-950 border-t border-white/5 flex items-center justify-around text-[9px] font-bold text-gray-500 select-none flex-shrink-0">
                      {[
                        { id: 'home', label: 'Home', icon: Compass },
                        { id: 'sermons', label: 'Sermons', icon: PlayCircle },
                        { id: 'books', label: 'Bookstore', icon: BookIcon },
                        { id: 'donate', label: 'Give', icon: DollarSign }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSelectedSermon(null);
                            setActiveTab(tab.id as any);
                          }}
                          className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-amber-400' : 'text-gray-500'}`}
                        >
                          <tab.icon className="w-4.5 h-4.5" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

              {/* Home indicator bar (Simulated iOS/Android swipe) */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full pointer-events-none"></div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default MobilePreviewPage;
