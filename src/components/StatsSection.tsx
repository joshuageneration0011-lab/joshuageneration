interface StatsSectionProps {
  sermonsCount?: number;
  booksCount?: number;
  membersCount?: number;
}

export default function StatsSection({ sermonsCount, booksCount, membersCount }: StatsSectionProps) {
  return (
    <section className="relative py-24 bg-[#0a0f1e] overflow-hidden">
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
        {/* Podcast Streaming Links */}
        <div className="flex flex-col items-center">
          <span className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-10 text-center">
            Listen to Joshua's Generation Podcast on
          </span>
          <div className="flex flex-wrap items-center justify-center gap-12 sm:gap-18">
            {/* Spotify */}
            <a
              href="https://open.spotify.com/show/033NsdQtAF4RjTtaJwlXWk"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Spotify"
            >
              <svg className="w-16 h-16 text-[#1DB954] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(29,185,84,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.075-.336.135-.668.47-.743 3.856-.88 7.15-.506 9.822 1.13.294.178.385.563.202.858zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.075-1.182-.413.125-.845-.107-.97-.52-.125-.413.107-.847.52-.97 3.665-1.11 8.23-.574 11.338 1.336.368.225.487.708.261 1.076zm.105-2.83C14.492 8.76 8.72 8.567 5.38 9.58c-.513.156-1.05-.133-1.206-.646-.156-.513.133-1.05.646-1.206 3.83-1.163 10.202-.94 14.167 1.414.462.275.614.873.34 1.336-.275.463-.873.614-1.336.34z" />
              </svg>
            </a>
            {/* Apple Podcasts */}
            <a
              href="https://podcasts.apple.com/us/podcast/joshuas-generation-podcast/id6789819767"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Apple Podcasts"
            >
              <svg className="w-16 h-16 text-[#ab57f2] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(171,87,242,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.31 11.83c-.3.26-.64.39-1.03.39s-.73-.13-1.03-.39c-.29-.27-.44-.61-.44-1.01V9.18c0-.4.15-.74.44-1.01.3-.26.64-.39 1.03-.39s.73.13 1.03.39c.29.27.44.61.44 1.01v3.64c0 .4-.15.74-.44 1.01zm-4.31 2c-.44 0-.82-.16-1.12-.47-.31-.3-.47-.69-.47-1.14v-5.6c0-.45.16-.83.47-1.14.3-.31.68-.47 1.12-.47s.82.16 1.12.47c.31.31.47.69.47 1.14v5.6c0 .45-.16.83-.47 1.14-.3.31-.68.47-1.12.47zm-4.31-2c-.3 0-.64-.13-.93-.39-.3-.27-.45-.61-.45-1.01V9.18c0-.4.15-.74.45-1.01.29-.26.63-.39.93-.39s.64.13.93.39c.3.27.45.61.45 1.01v3.64c0 .4-.15.74-.45 1.01-.29.26-.63.39-.93.39z" />
              </svg>
            </a>
            {/* Amazon Music */}
            <a
              href="https://music.amazon.com/podcasts/fba19ef3-b19d-4556-bef4-a2f9531b8490"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Amazon Music"
            >
              <svg className="w-16 h-16 text-[#00A8E1] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(0,168,225,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.55 12.39c-.19.26-.52.33-.78.16-1.57-1.01-3.69-1.33-6.22-1.06-.31.03-.59-.17-.63-.48-.03-.31.17-.59.48-.63 2.82-.3 5.17.06 6.98 1.23.27.17.33.51.17.78zm1.09-2.28c-.24.33-.67.43-1 .19-1.99-1.46-5.06-1.92-7.85-1.12-.4.12-.81-.11-.93-.51-.12-.4.11-.81.51-.93 3.22-.92 6.69-.42 8.97 1.25.33.24.43.68.2 1.12zm.09-2.39c-.29.39-.81.5-1.2.22C14.77 5.76 9.4 5.56 5.86 6.55c-.5.14-1.02-.15-1.16-.65-.14-.5.15-1.02.65-1.16C9.37 3.59 15.34 3.82 18.57 6.2c.4.29.5.81.21 1.2z" />
              </svg>
            </a>
            {/* Pocket Casts */}
            <a
              href="https://pca.st/itunes/6789819767"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Pocket Casts"
            >
              <svg className="w-16 h-16 text-[#F43F5E] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(244,63,94,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
            </a>
            {/* Deezer */}
            <a
              href="https://www.deezer.com/show/1003390762"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Deezer"
            >
              <svg className="w-18 h-14 text-[#EF4444] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(239,68,68,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 17h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zm-16-4h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zm-16-4h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4-4h3v3h-3z" />
              </svg>
            </a>
            {/* Player FM */}
            <a
              href="https://player.fm/series/series-3740553"
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-all duration-300 hover:scale-115"
              title="Listen on Player FM"
            >
              <svg className="w-16 h-16 text-[#F59E0B] hover:brightness-125 hover:drop-shadow-[0_0_16px_rgba(245,158,11,0.5)] transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm0-4.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm0-4.5C13 8.33 12.33 9 11.5 9S10 8.33 10 7.5 10.67 6 11.5 6s1.5.67 1.5 1.5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
