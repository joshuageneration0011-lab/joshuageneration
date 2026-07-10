import { BookOpen, Users, Globe, Tv, Heart } from 'lucide-react';

interface StatsSectionProps {
  sermonsCount?: number;
  booksCount?: number;
  membersCount?: number;
}

export default function StatsSection({ sermonsCount, booksCount, membersCount }: StatsSectionProps) {
  const statItems = [
    { 
      icon: Tv,         
      label: 'Sermons',       
      value: sermonsCount !== undefined ? String(sermonsCount) : '1240', 
      suffix: sermonsCount !== undefined ? '' : '+',  
      format: false 
    },
    { 
      icon: BookOpen,   
      label: 'Books',         
      value: booksCount !== undefined ? String(booksCount) : '28',   
      suffix: '',   
      format: false 
    },
    { 
      icon: Users,      
      label: 'Members',       
      value: membersCount !== undefined ? String(membersCount) : '45',   
      suffix: membersCount !== undefined ? '' : 'K+', 
      format: false 
    },
    { 
      icon: Globe,      
      label: 'Countries',     
      value: '120',  
      suffix: '+',  
      format: false 
    },
    { 
      icon: Heart,      
      label: 'Monthly Givers',
      value: '3',    
      suffix: 'K+', 
      format: false 
    },
  ];
  return (
    <section className="relative py-20 bg-[#0a0f1e] overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid opacity-[0.06]" />

      {/* Gold top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
      />

      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,64,175,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-gold-400 text-xs font-bold tracking-widest uppercase">
            <span className="h-px w-8 bg-gold-400/50 inline-block" />
            Our Impact
            <span className="h-px w-8 bg-gold-400/50 inline-block" />
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 justify-center">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="group flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-white/[0.06] hover:border-gold-500/20 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-400"
            >
              {/* Icon orb */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.04) 100%)',
                  border: '1px solid rgba(212,175,55,0.2)',
                  boxShadow: '0 0 20px rgba(212,175,55,0.08)',
                }}
              >
                <item.icon className="w-5 h-5 text-gold-400" />
              </div>

              {/* Value */}
              <div
                className="text-3xl font-extrabold leading-none"
                style={{
                  background: 'linear-gradient(135deg, #e4c34a 0%, #d4af37 60%, #f9efc5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {item.format && typeof item.value === 'number'
                  ? (item.value / 1000).toFixed(0) + 'K'
                  : item.value}
                {item.suffix}
              </div>

              {/* Label */}
              <div className="text-white/40 text-[11px] font-semibold uppercase tracking-widest leading-none">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Gold bottom border */}
        <div
          className="mt-16 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)' }}
        />
      </div>
    </section>
  );
}
