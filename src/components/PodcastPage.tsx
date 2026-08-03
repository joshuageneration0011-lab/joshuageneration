import { ArrowLeft, Headphones, ExternalLink, Radio, Volume2 } from 'lucide-react';

interface PodcastPageProps {
  onBack: () => void;
}

export default function PodcastPage({ onBack }: PodcastPageProps) {
  const podcastPlatforms = [
    {
      name: 'Spotify',
      icon: (
        <svg className="w-10 h-10 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.377-1.454-5.37-1.783-8.893-.982-.336.075-.668-.135-.744-.47-.075-.336.135-.668.47-.743 3.856-.88 7.15-.506 9.822 1.13.294.178.385.563.202.858zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.075-1.182-.413.125-.845-.107-.97-.52-.125-.413.107-.847.52-.97 3.665-1.11 8.23-.574 11.338 1.336.368.225.487.708.261 1.076zm.105-2.83C14.492 8.76 8.72 8.567 5.38 9.58c-.513.156-1.05-.133-1.206-.646-.156-.513.133-1.05.646-1.206 3.83-1.163 10.202-.94 14.167 1.414.462.275.614.873.34 1.336-.275.463-.873.614-1.336.34z" />
        </svg>
      ),
      description: 'Stream our latest episodes, subscribe, and take the Word with you on the go.',
      link: 'https://open.spotify.com/show/033NsdQtAF4RjTtaJwlXWk',
      color: 'from-[#1DB954]/10 to-[#1DB954]/5 border-[#1DB954]/20 hover:border-[#1DB954]/60',
      badgeColor: 'bg-[#1DB954] text-white',
      btnColor: 'bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold'
    },
    {
      name: 'Apple Podcasts',
      icon: (
        <svg className="w-10 h-10 text-[#872EC4]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.31 11.83c-.3.26-.64.39-1.03.39s-.73-.13-1.03-.39c-.29-.27-.44-.61-.44-1.01V9.18c0-.4.15-.74.44-1.01.3-.26.64-.39 1.03-.39s.73.13 1.03.39c.29.27.44.61.44 1.01v3.64c0 .4-.15.74-.44 1.01zm-4.31 2c-.44 0-.82-.16-1.12-.47-.31-.3-.47-.69-.47-1.14v-5.6c0-.45.16-.83.47-1.14.3-.31.68-.47 1.12-.47s.82.16 1.12.47c.31.31.47.69.47 1.14v5.6c0 .45-.16.83-.47 1.14-.3.31-.68.47-1.12.47zm-4.31-2c-.3 0-.64-.13-.93-.39-.3-.27-.45-.61-.45-1.01V9.18c0-.4.15-.74.45-1.01.29-.26.63-.39.93-.39s.64.13.93.39c.3.27.45.61.45 1.01v3.64c0 .4-.15.74-.45 1.01-.29.26-.63.39-.93.39z" />
        </svg>
      ),
      description: 'Subscribe on Apple devices to receive new sermon episodes automatically.',
      link: 'https://podcasts.apple.com/us/podcast/joshuas-generation-podcast/id6789819767',
      color: 'from-[#872EC4]/10 to-[#872EC4]/5 border-[#872EC4]/20 hover:border-[#872EC4]/60',
      badgeColor: 'bg-[#872EC4] text-white',
      btnColor: 'bg-[#872EC4] hover:bg-[#9b3fdc] text-white font-bold'
    },
    {
      name: 'Amazon Music',
      icon: (
        <svg className="w-10 h-10 text-[#00A8E1]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.55 12.39c-.19.26-.52.33-.78.16-1.57-1.01-3.69-1.33-6.22-1.06-.31.03-.59-.17-.63-.48-.03-.31.17-.59.48-.63 2.82-.3 5.17.06 6.98 1.23.27.17.33.51.17.78zm1.09-2.28c-.24.33-.67.43-1 .19-1.99-1.46-5.06-1.92-7.85-1.12-.4.12-.81-.11-.93-.51-.12-.4.11-.81.51-.93 3.22-.92 6.69-.42 8.97 1.25.33.24.43.68.2 1.12zm.09-2.39c-.29.39-.81.5-1.2.22C14.77 5.76 9.4 5.56 5.86 6.55c-.5.14-1.02-.15-1.16-.65-.14-.5.15-1.02.65-1.16C9.37 3.59 15.34 3.82 18.57 6.2c.4.29.5.81.21 1.2z" />
        </svg>
      ),
      description: 'Stream on Alexa-enabled devices and Amazon Music platforms.',
      link: 'https://music.amazon.com/podcasts/fba19ef3-b19d-4556-bef4-a2f9531b8490',
      color: 'from-[#00A8E1]/10 to-[#00A8E1]/5 border-[#00A8E1]/20 hover:border-[#00A8E1]/60',
      badgeColor: 'bg-[#00A8E1] text-black',
      btnColor: 'bg-[#00A8E1] hover:bg-[#11beff] text-black font-bold'
    },
    {
      name: 'Pocket Casts',
      icon: (
        <svg className="w-10 h-10 text-[#F43F5E]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
      ),
      description: 'Listen on one of the most popular dedicated podcast clients.',
      link: 'https://pca.st/itunes/6789819767',
      color: 'from-[#F43F5E]/10 to-[#F43F5E]/5 border-[#F43F5E]/20 hover:border-[#F43F5E]/60',
      badgeColor: 'bg-[#F43F5E] text-white',
      btnColor: 'bg-[#F43F5E] hover:bg-[#fb7185] text-white font-bold'
    },
    {
      name: 'Deezer',
      icon: (
        <svg className="w-10 h-15 text-[#EF4444]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 17h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zm-16-4h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4 0h3v3h-3zm-16-4h3v3H4zm4 0h3v3H8zm4 0h3v3h-3zm4 0h3v3h-3zm4-4h3v3h-3z" />
        </svg>
      ),
      description: 'Listen to our high-fidelity digital podcast feed on Deezer.',
      link: 'https://www.deezer.com/show/1003390762',
      color: 'from-[#EF4444]/10 to-[#EF4444]/5 border-[#EF4444]/20 hover:border-[#EF4444]/60',
      badgeColor: 'bg-[#EF4444] text-white',
      btnColor: 'bg-[#EF4444] hover:bg-[#f87171] text-white font-bold'
    },
    {
      name: 'Player FM',
      icon: (
        <svg className="w-10 h-10 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm0-4.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm0-4.5C13 8.33 12.33 9 11.5 9S10 8.33 10 7.5 10.67 6 11.5 6s1.5.67 1.5 1.5z" />
        </svg>
      ),
      description: 'Listen online or offline on the go via the Player FM app.',
      link: 'https://player.fm/series/series-3740553',
      color: 'from-[#F59E0B]/10 to-[#F59E0B]/5 border-[#F59E0B]/20 hover:border-[#F59E0B]/60',
      badgeColor: 'bg-[#F59E0B] text-black',
      btnColor: 'bg-[#F59E0B] hover:bg-[#fbbf24] text-black font-bold'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="mb-10">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-royal-blue-600 transition-colors mb-6 font-medium text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-200/60 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-royal-blue-900 via-royal-blue-950 to-black p-8 sm:p-12 text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(212,163,89,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-grid opacity-[0.03]" />
            <div className="absolute -top-10 -right-10 w-96 h-96 bg-royal-blue-500/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Joshua's Generation Podcasts
              </span>
              
              <h1 className="text-3xl sm:text-5xl font-bold font-cormorant tracking-tight mb-4 text-white">
                Empowering Messages, <span className="text-gold-400 font-sans font-medium text-4xl sm:text-5xl block sm:inline">Anywhere, Anytime</span>
              </h1>
              
              <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
                Take the gospel of Christ with you on your daily commute, workout, or study time. Subscribe to the Joshua's Generation Podcast on your favorite platform and never miss a life-changing word.
              </p>
              
              <div className="flex items-center gap-3 text-xs text-white/50">
                <Headphones className="w-4 h-4 text-gold-400" />
                <span>Available on all major streaming services</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {podcastPlatforms.map((platform) => (
            <div
              key={platform.name}
              className={`bg-white rounded-3xl border p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-b ${platform.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                    {platform.icon}
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${platform.badgeColor}`}>
                    Official Partner
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3">{platform.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{platform.description}</p>
              </div>

              <a
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md ${platform.btnColor}`}
              >
                Access {platform.name}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 text-center bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-sm max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-50 border border-gold-100 text-gold-500 mb-4">
            <Volume2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Want to listen directly on our website?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            You can also browse, stream, and download our complete catalog of audio and video sermons directly through our sermons page.
          </p>
          <button
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-royal-blue-600 hover:bg-royal-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md"
          >
            Go to Sermons Page
          </button>
        </div>

      </div>
    </div>
  );
}
