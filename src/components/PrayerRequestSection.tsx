import { useState } from 'react';
import { Hand as PrayerIcon, Lock, AlertCircle, Send } from 'lucide-react';

export default function PrayerRequestSection() {
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden bg-[#f8f6f1]">
      {/* Top decorative border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }}
      />

      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(30,64,175,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Label */}
        <span className="inline-flex items-center gap-2 text-gold-600 text-xs font-bold tracking-widest uppercase mb-6">
          <span className="h-px w-8 bg-gold-500/50 inline-block" />
          Prayer
          <span className="h-px w-8 bg-gold-500/50 inline-block" />
        </span>

        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-7 mx-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
            boxShadow: '0 0 30px rgba(212,175,55,0.1)',
          }}
        >
          <PrayerIcon className="w-8 h-8 text-gold-500" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Need Prayer?
        </h2>
        <p className="text-gray-500 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
          Whatever you're going through, you don't have to face it alone. Share your request — our community stands with you.
        </p>

        {/* Form card */}
        <div
          className="rounded-3xl p-6 sm:p-8 text-left"
          style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <label className="block text-sm font-bold text-gray-700 mb-2">Your Prayer Request</label>
          <textarea
            placeholder="Share your prayer request here..."
            className="w-full h-32 px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm leading-relaxed"
            style={{ focusRingColor: '#d4af37' }}
          />

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                isAnonymous
                  ? 'bg-gold-50 text-gold-700 border-gold-300'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isAnonymous ? 'Anonymous' : 'Show My Name'}
            </button>

            <button
              onClick={() => setIsUrgent(!isUrgent)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                isUrgent
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {isUrgent ? 'Marked Urgent' : 'Mark as Urgent'}
            </button>
          </div>

          <button
            className="mt-5 w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)',
              boxShadow: '0 8px 24px rgba(212,175,55,0.3)',
            }}
          >
            <Send className="w-4 h-4" />
            Submit Prayer Request
          </button>
        </div>
      </div>
    </section>
  );
}
