import { Quote, Star } from 'lucide-react';
import { testimonies } from '@/data/mockData';

export default function TestimonialsSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Decorative background */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-gold-600 text-xs font-bold tracking-widest uppercase mb-4">
            <span className="h-px w-8 bg-gold-500/50 inline-block" />
            Testimonies
            <span className="h-px w-8 bg-gold-500/50 inline-block" />
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Lives Transformed
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            Hear what God is doing through Joshua Generation
          </p>
        </div>

        {/* Auto-scrolling Cards */}
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, white, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(270deg, white, transparent)' }} />

          <div className="flex gap-5 animate-scroll hover:[animation-play-state:paused]">
            {[...testimonies, ...testimonies].map((testimony, index) => (
              <div
                key={`${testimony.id}-${index}`}
                className="flex-shrink-0 w-[340px] sm:w-[380px] flex flex-col gap-4 p-6 rounded-3xl border border-gray-100 bg-white shadow-soft hover:shadow-soft-lg hover:border-gold-100 transition-all duration-300"
              >
                {/* Quote icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                  <Quote className="w-4 h-4 text-gold-500" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                  ))}
                </div>

                {/* Quote text */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 flex-1">
                  "{testimony.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  <img
                    src={testimony.imageUrl}
                    alt={testimony.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gold-100"
                  />
                  <div>
                    <p className="font-bold text-gray-900 text-sm leading-none">{testimony.name}</p>
                    <p className="text-gray-400 text-[11px] mt-0.5">Member</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 35s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
}
