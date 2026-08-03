import { useState } from 'react';
import { Radio, X, Volume2 } from 'lucide-react';

interface RadioPlayerProps {
  mixlrUrl: string;
  isActive: boolean;
}

export default function RadioPlayer({ mixlrUrl, isActive }: RadioPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isActive || !mixlrUrl) return null;

  // Mixlr embed frame URLs usually look like: https://mixlr.com/users/8375836/embed
  // If they enter a profile link like https://mixlr.com/joshua-generation, we can try to map it,
  // but let's make sure the iframe src points to the embed format.
  let embedUrl = mixlrUrl;
  if (mixlrUrl.includes('mixlr.com') && !mixlrUrl.includes('/embed')) {
    // If it's a simple profile link, try to parse it
    const parts = mixlrUrl.split('/');
    const username = parts[parts.length - 1] || parts[parts.length - 2];
    if (username && username !== 'users') {
      embedUrl = `https://mixlr.com/users/${username}/embed?autoplay=false`;
    }
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 font-sans">
      {isOpen ? (
        <div className="w-80 rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" /> Live Radio
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-850 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Iframe Embed */}
          <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 aspect-video h-[120px] w-full flex items-center justify-center relative">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="no"
              marginHeight={0}
              marginWidth={0}
              title="Mixlr Live Radio Stream"
              className="w-full h-full"
            />
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-2.5 font-medium">
            Broadcasting Sermons, Worship & Word Live
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group border-none"
        >
          <div className="relative flex items-center justify-center">
            <Radio className="w-4 h-4 animate-[bounce_1.5s_infinite]" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">Listen Live</span>
          <Volume2 className="w-3.5 h-3.5 text-royal-blue-200 group-hover:text-white transition-colors" />
        </button>
      )}
    </div>
  );
}
