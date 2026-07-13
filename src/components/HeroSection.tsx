import { Play, BookOpen, ArrowRight, Headphones, Users, BookMarked, Radio } from 'lucide-react';

interface HeroSectionProps {
  onSermonsClick?: () => void;
  onBooksClick?: () => void;
  onBlogClick?: () => void;
}

const SPARKLES = [
  { top: '12%', left: '8%', delay: '0s', size: 6 },
  { top: '22%', left: '88%', delay: '0.8s', size: 4 },
  { top: '65%', left: '5%', delay: '1.6s', size: 5 },
  { top: '75%', left: '92%', delay: '0.4s', size: 7 },
  { top: '40%', left: '95%', delay: '2.1s', size: 4 },
  { top: '85%', left: '15%', delay: '1.2s', size: 6 },
  { top: '10%', left: '55%', delay: '2.5s', size: 3 },
  { top: '50%', left: '2%', delay: '0.6s', size: 5 },
];

const WAVE_BARS = 24;

const STATS = [
  { icon: Headphones, label: 'Sermons', value: '500+' },
  { icon: Users, label: 'Believers', value: '12K+' },
  { icon: BookMarked, label: 'Books', value: '80+' },
  { icon: Radio, label: 'Live Streams', value: 'Weekly' },
];

export default function HeroSection({ onSermonsClick, onBooksClick, onBlogClick }: HeroSectionProps) {
  const [settings, setSettings] = useState<Partial<Settings>>({
    homeHeadlinePrefix: 'Experience the ',
    homeHeadlineHighlight: 'Presence',
    homeHeadlineSuffix: ' of God',
    homeSubheading: 'A digital ministry where faith comes alive — through powerful audio sermons, life-changing books, and a growing global community of believers.',
    homeBibleVerse: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.',
    homeBibleReference: 'Joshua 1:9'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const cached = localStorage.getItem('jg_cache_public_settings');
        if (cached) setSettings(JSON.parse(cached));
        
        const data = await api.getPublicSettings();
        setSettings(data);
        localStorage.setItem('jg_cache_public_settings', JSON.stringify(data));
      } catch (err) {
        console.error('Failed to load public settings:', err);
      }
    };
    fetchSettings();
  }, []);
  return (
    <section id="home" className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden">

      {/* ── Deep Layered Background ── */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0f1f6e_0%,_#07103d_40%,_#020818_100%)]" />

        {/* Grid texture */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(92,120,214,0.18),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020818]/80" />
      </div>

      {/* ── Floating Ambient Orbs ── */}
      <div
        className="absolute top-1/4 left-[10%] w-[320px] h-[320px] rounded-full opacity-[0.12] animate-float-orb animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, #3b5bdb 0%, #1e3a8a 50%, transparent 80%)',
          filter: 'blur(60px)',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute bottom-[20%] right-[8%] w-[240px] h-[240px] rounded-full opacity-[0.10] animate-float-orb animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, #d4af37 0%, #b8942f 50%, transparent 80%)',
          filter: 'blur(50px)',
          animationDelay: '3s',
        }}
      />
      <div
        className="absolute top-[60%] left-[40%] w-[180px] h-[180px] rounded-full opacity-[0.08] animate-float-orb"
        style={{
          background: 'radial-gradient(circle, #6d28d9 0%, transparent 80%)',
          filter: 'blur(40px)',
          animationDelay: '5s',
        }}
      />

      {/* ── Sparkle Particles ── */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="absolute animate-sparkle pointer-events-none"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          <svg width={s.size * 2} height={s.size * 2} viewBox="0 0 16 16" fill="none">
            <path
              d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
              fill="rgba(212,175,55,0.75)"
            />
          </svg>
        </span>
      ))}

      {/* ── Rotating Ring Decoration ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-white/[0.04] animate-rotate-slow pointer-events-none"
        style={{ borderStyle: 'dashed' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full border border-gold-500/[0.04] pointer-events-none animate-rotate-slow"
        style={{ animationDirection: 'reverse', animationDuration: '35s' }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 flex flex-col items-center text-center">

        {/* Ministry badge */}
        <div
          className="animate-slide-up opacity-0 mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 backdrop-blur-sm"
          style={{ animationDelay: '0s', animationFillMode: 'forwards' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-400" />
          </span>
          <span className="text-gold-400 text-[10px] font-bold tracking-widest uppercase">Joshua Generation Ministry</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-slide-up opacity-0 text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold text-white leading-[1.05] tracking-tight mb-4"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          {settings.homeHeadlinePrefix}
          <span
            className="relative inline-block"
            style={{
              background: 'linear-gradient(135deg, #e4c34a 0%, #d4af37 40%, #f9efc5 70%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {settings.homeHeadlineHighlight}
            {/* Underline accent */}
            <span
              className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }}
            />
          </span>
          {settings.homeHeadlineSuffix}
        </h1>

        {/* Subheading */}
        <p
          className="animate-slide-up opacity-0 text-base sm:text-lg text-white/55 max-w-xl mx-auto mb-7 leading-relaxed"
          style={{ animationDelay: '0.22s', animationFillMode: 'forwards' }}
        >
          {settings.homeSubheading}
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-slide-up opacity-0 flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          style={{ animationDelay: '0.35s', animationFillMode: 'forwards' }}
        >
          {/* Primary CTA */}
          <button
            onClick={onSermonsClick}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b8942f 100%)',
              boxShadow: '0 0 30px rgba(212,175,55,0.3), 0 6px 18px rgba(0,0,0,0.3)',
            }}
          >
            {/* Shimmer sweep */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
              <Play className="w-3 h-3 fill-white text-white ml-0.5" />
            </span>
            <span className="relative">Listen to Sermons</span>
          </button>

          {/* Secondary CTA */}
          <button
            onClick={onBooksClick}
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white/90 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <BookOpen className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            Read Books
          </button>

          {/* Text CTA */}
          <button
            onClick={onBlogClick}
            className="group inline-flex items-center gap-1.5 px-4 py-3 font-medium text-sm text-white/50 hover:text-white/90 transition-all duration-300"
          >
            Read Our Blog
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>

        {/* ── Audio Waveform ── */}
        <div
          className="animate-slide-up opacity-0 flex items-end justify-center gap-[2px] h-7 mb-10"
          style={{ animationDelay: '0.45s', animationFillMode: 'forwards' }}
        >
          {Array.from({ length: WAVE_BARS }).map((_, i) => {
            const height = Math.max(4, Math.round((Math.sin(i * 0.45) + 1) * 9 + 4));
            return (
              <div
                key={i}
                className="animate-wave-bar rounded-full"
                style={{
                  width: '2px',
                  height: `${height}px`,
                  background: `linear-gradient(to top, rgba(212,175,55,0.8), rgba(92,120,214,0.4))`,
                  animationDelay: `${i * 0.04}s`,
                  transformOrigin: 'bottom',
                }}
              />
            );
          })}
        </div>

        {/* ── Scripture Card ── */}
        <div
          className="animate-slide-up opacity-0 relative w-full max-w-xl mx-auto mb-8 rounded-2xl overflow-hidden"
          style={{
            animationDelay: '0.55s',
            animationFillMode: 'forwards',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Top gold accent line */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-[2px] rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }}
          />
          {/* Left decorative bar */}
          <div
            className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
            style={{ background: 'linear-gradient(to bottom, transparent, #d4af37, transparent)' }}
          />

          <div className="px-7 py-5">
            {/* Quote mark */}
            <div
              className="text-5xl font-serif leading-none mb-0.5 -mt-1"
              style={{ color: 'rgba(212,175,55,0.25)', fontFamily: 'Georgia, serif' }}
            >
              "
            </div>
            <p className="font-cormorant text-base sm:text-lg italic text-white/85 leading-relaxed">
              {settings.homeBibleVerse}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-px flex-1"
                style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.5), transparent)' }}
              />
              <span className="text-gold-400 font-bold text-[10px] tracking-widest uppercase">{settings.homeBibleReference}</span>
              <div
                className="h-px flex-1"
                style={{ background: 'linear-gradient(270deg, rgba(212,175,55,0.5), transparent)' }}
              />
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div
          className="animate-slide-up opacity-0 grid grid-cols-4 gap-2 w-full max-w-lg mx-auto"
          style={{ animationDelay: '0.65s', animationFillMode: 'forwards' }}
        >
          {STATS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-1 rounded-xl py-3 px-2 border border-white/[0.07] hover:border-gold-500/30 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
              <Icon className="w-4 h-4 text-gold-400 opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="text-white font-extrabold text-sm leading-none">{value}</span>
              <span className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-10">
        <span className="text-white/25 text-[9px] uppercase tracking-widest font-bold">Scroll</span>
        <div className="w-5 h-8 rounded-full border border-white/15 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-gold-400/60 animate-pulse" />
        </div>
      </div>

    </section>
  );
}
