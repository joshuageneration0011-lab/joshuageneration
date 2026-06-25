import { Gift, Heart, Building2, Users, ArrowRight } from 'lucide-react';
import { stats } from '@/data/mockData';

interface DonationBannerProps {
  onGiveClick?: () => void;
}

const GIVE_OPTIONS = [
  { icon: Heart,     label: 'General Ministry', desc: 'Support daily gospel operations' },
  { icon: Building2, label: 'Building Fund',    desc: 'Help build our worship center' },
  { icon: Users,     label: 'Conference',        desc: 'Sponsor the next conference'   },
];

export default function DonationBanner({ onGiveClick }: DonationBannerProps) {
  const progressPercent = Math.min(Math.round((stats.totalDonations / 2000000) * 100), 100);

  return (
    <section id="donate" className="relative py-24 sm:py-32 bg-[#0a0f1e] overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />

      {/* Ambient glows */}
      <div
        className="absolute top-0 left-1/4 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      {/* Top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left: Text + Progress */}
          <div>
            <span className="inline-flex items-center gap-2 text-gold-400 text-xs font-bold tracking-widest uppercase mb-6">
              <span className="h-px w-6 bg-gold-400/60 inline-block" />
              Support the Ministry
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
              Partner With Us<br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #e4c34a 0%, #d4af37 60%, #f9efc5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                To Reach Nations
              </span>
            </h2>

            <p className="text-white/50 text-base leading-relaxed mb-10 max-w-md">
              Your generous giving enables us to preach the gospel of Jesus Christ, disciple believers, and transform communities across the nations.
            </p>

            {/* Progress bar */}
            <div className="mb-10">
              <div className="flex justify-between items-center text-xs mb-2.5">
                <span className="text-white/40 font-medium">Campaign Progress</span>
                <span className="text-gold-400 font-bold">${(stats.totalDonations / 1000000).toFixed(1)}M raised</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #d4af37, #e4c34a)',
                    boxShadow: '0 0 12px rgba(212,175,55,0.5)',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
                <span>{progressPercent}% funded</span>
                <span>Goal: $2,000,000</span>
              </div>
            </div>

            {/* Give button */}
            <button
              onClick={onGiveClick}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)',
                boxShadow: '0 0 40px rgba(212,175,55,0.3), 0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              {/* Shimmer */}
              <span className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </span>
              <Gift className="w-5 h-5 relative" />
              <span className="relative">Give Now</span>
              <ArrowRight className="w-4 h-4 relative group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="mt-3 text-white/25 text-xs">One-time · Monthly · Yearly</p>
          </div>

          {/* Right: Giving options */}
          <div className="flex flex-col gap-4">
            {GIVE_OPTIONS.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                onClick={onGiveClick}
                className="group flex items-center gap-5 p-5 rounded-2xl border border-white/[0.07] hover:border-gold-500/30 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 text-left"
              >
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                    border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <Icon className="w-5 h-5 text-gold-400" />
                </div>

                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm group-hover:text-gold-300 transition-colors">{label}</h4>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>

                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all duration-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
