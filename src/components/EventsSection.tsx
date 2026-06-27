import { MapPin, Clock, ChevronRight, Calendar } from 'lucide-react';
import type { Event } from '../types';

interface EventsSectionProps {
  events: Event[];
}

export default function EventsSection({ events }: EventsSectionProps) {
  return (
    <section id="events" className="relative py-24 sm:py-32 bg-[#0a0f1e] overflow-hidden">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />

      {/* Glows */}
      <div
        className="absolute -top-32 left-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', filter: 'blur(50px)' }}
      />

      {/* Top gold line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-gold-400 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="h-px w-6 bg-gold-400/60 inline-block" />
              Events
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Upcoming Programs
            </h2>
            <p className="mt-3 text-white/45 text-lg max-w-md">
              Join us for life-changing gatherings and encounters with God
            </p>
          </div>
          <button className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 hover:border-gold-500/30 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white font-semibold text-sm transition-all duration-300">
            View All Events
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => {
            let day = 1;
            let month = 'Jan';
            try {
              const eventDate = new Date(event.date);
              if (!isNaN(eventDate.getTime())) {
                day = eventDate.getDate();
                month = eventDate.toLocaleString('default', { month: 'short' });
              } else {
                const parts = event.date.split(' ');
                if (parts.length >= 2) {
                  month = parts[0].slice(0, 3);
                  day = parseInt(parts[1]) || 1;
                }
              }
            } catch (e) {
              console.error('Error parsing date:', e);
            }

            return (
              <div
                key={event.id}
                className="group flex flex-col rounded-3xl overflow-hidden border border-white/[0.07] hover:border-gold-500/25 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Date badge */}
                  <div
                    className="absolute top-3 left-3 w-12 h-14 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)', boxShadow: '0 4px 12px rgba(212,175,55,0.4)' }}
                  >
                    <span className="text-white/80 text-[9px] font-bold uppercase tracking-wider">{month}</span>
                    <span className="text-white text-xl font-extrabold leading-none">{day}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 gap-4">
                  <h3 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h3>

                  <div className="space-y-2 text-xs text-white/40 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gold-400/60 flex-shrink-0" />
                      <span>{(event.speakers || []).length} Speaker{((event.speakers || []).length) > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <button
                    className="w-full py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #d4af37, #b8942f)',
                      boxShadow: '0 4px 12px rgba(212,175,55,0.25)',
                      color: '#fff',
                    }}
                  >
                    Register Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
