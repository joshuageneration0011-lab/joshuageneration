import { useState } from 'react';
import { MapPin, Clock, ChevronRight, Calendar } from 'lucide-react';
import type { Event } from '../types';
import { resolveApiUrl } from '../utils/api';

interface EventsSectionProps {
  events: Event[];
}

export default function EventsSection({ events }: EventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jg_registered_events') || '[]');
    } catch (_) {
      return [];
    }
  });

  const openRegistration = (event: Event) => {
    setSelectedEvent(event);
    setName('');
    setEmail('');
    setPhone('');
    setSuccess(registeredEventIds.includes(event.id));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsRegistering(true);
    // Simulate registration processing for a premium look
    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedIds = [...registeredEventIds, selectedEvent!.id];
    setRegisteredEventIds(updatedIds);
    localStorage.setItem('jg_registered_events', JSON.stringify(updatedIds));

    // Optimistically update registration count locally for UI display
    selectedEvent!.registrations = (selectedEvent!.registrations || 0) + 1;

    setIsRegistering(false);
    setSuccess(true);
  };

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

            const isRegistered = registeredEventIds.includes(event.id);

            return (
              <div
                key={event.id}
                className="group flex flex-col rounded-3xl overflow-hidden border border-white/[0.07] hover:border-gold-500/25 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-500 hover:-translate-y-1"
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={resolveApiUrl(event.imageUrl)}
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
                    onClick={() => openRegistration(event)}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
                    style={{
                      background: isRegistered 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #d4af37, #b8942f)',
                      boxShadow: isRegistered
                        ? '0 4px 12px rgba(16,185,129,0.25)'
                        : '0 4px 12px rgba(212,175,55,0.25)',
                      color: '#fff',
                    }}
                  >
                    {isRegistered ? 'Registered ✓' : 'Register Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0b1329] border border-white/[0.08] rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-400/5 rounded-full blur-[40px] pointer-events-none" />

            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!success ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <span className="text-gold-400 text-[10px] font-bold tracking-wider uppercase">Event Registration</span>
                  <h3 className="text-lg font-bold text-white mt-1 leading-snug">{selectedEvent.title}</h3>
                  <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold-400/60" /> {selectedEvent.date} at {selectedEvent.time}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs font-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs font-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. john@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-white/60 text-xs font-semibold">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 234 567 890"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-[#0a0f1e] transition-all duration-300 hover:scale-[1.01] active:scale-95 shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)' }}
                >
                  {isRegistering ? 'Processing...' : 'Complete Registration'}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">Registration Successful!</h3>
                  <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
                    You have successfully registered for <span className="text-gold-300 font-semibold">{selectedEvent.title}</span>. We look forward to seeing you!
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-6 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer mt-4"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
