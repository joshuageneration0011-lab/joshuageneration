import { useState, useEffect } from 'react';
import { ArrowLeft, Type, ChevronLeft, ChevronRight, Menu, BookOpen, Sun, Moon } from 'lucide-react';
import type { Book } from '@/types';
import { cn } from '@/utils/cn';

interface BookReaderProps {
  book: Book;
  onBack: () => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';

export default function BookReader({ book, onBack }: BookReaderProps) {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState(18); // Default 18px font size
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [showConfig, setShowConfig] = useState(false);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);

  const chapters = book.chapters || [
    {
      title: 'Introduction',
      content: 'This book has no chapters loaded yet. Please check back later.'
    }
  ];

  const currentChapter = chapters[currentChapterIdx];

  // Scroll to top of reading area when chapter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentChapterIdx]);

  // Adjust font size helpers
  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 26));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 14));

  const progressPercent = Math.round(((currentChapterIdx + 1) / chapters.length) * 100);

  return (
    <div
      className={cn(
        'min-h-screen pt-20 transition-colors duration-500 pb-20 select-text',
        theme === 'light' && 'bg-white text-gray-900',
        theme === 'sepia' && 'bg-[#f7f1e3] text-[#5d4037]',
        theme === 'dark' && 'bg-gray-950 text-gray-100'
      )}
    >
      {/* Reader Controls Bar */}
      <div
        className={cn(
          'fixed top-16 left-0 right-0 z-30 border-b transition-all duration-300 py-3.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm',
          theme === 'light' && 'bg-white/95 border-gray-100 backdrop-blur-md',
          theme === 'sepia' && 'bg-[#f7f1e3]/95 border-[#e1d8c1] backdrop-blur-md',
          theme === 'dark' && 'bg-gray-950/95 border-gray-800 backdrop-blur-md'
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={cn(
              'p-2 rounded-xl transition-colors',
              theme === 'light' && 'hover:bg-gray-50',
              theme === 'sepia' && 'hover:bg-[#ebdfc3]',
              theme === 'dark' && 'hover:bg-gray-900 text-gray-300'
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold truncate max-w-[200px] md:max-w-[300px]">
              {book.title}
            </h2>
            <p className={cn(
              'text-[10px] mt-0.5',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              By {book.author}
            </p>
          </div>
        </div>

        {/* Reading Progress Indicator */}
        <div className="flex-1 max-w-xs mx-4 hidden md:block">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className={cn(
            'w-full h-1.5 rounded-full overflow-hidden',
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
          )}>
            <div
              className="h-full bg-gold-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Display Settings Controls */}
        <div className="flex items-center gap-2 relative">
          {/* Chapter sidebar mobile toggle */}
          <button
            onClick={() => setShowChaptersMenu(!showChaptersMenu)}
            className={cn(
              'lg:hidden p-2.5 rounded-xl transition-colors',
              theme === 'light' && 'hover:bg-gray-50',
              theme === 'sepia' && 'hover:bg-[#ebdfc3]',
              theme === 'dark' && 'hover:bg-gray-900'
            )}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Reader settings popup toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              'p-2.5 rounded-xl transition-colors',
              theme === 'light' && 'hover:bg-gray-50',
              theme === 'sepia' && 'hover:bg-[#ebdfc3]',
              theme === 'dark' && 'hover:bg-gray-900'
            )}
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Font settings popup */}
          {showConfig && (
            <div
              className={cn(
                'absolute right-0 top-12 w-64 rounded-2xl shadow-xl border p-5 transition-all z-40',
                theme === 'light' && 'bg-white border-gray-100 text-gray-800',
                theme === 'sepia' && 'bg-[#ebdcb9] border-[#d7c49b] text-[#5d4037]',
                theme === 'dark' && 'bg-gray-900 border-gray-800 text-gray-100'
              )}
            >
              {/* Font Resizing */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-65">Text Size</h4>
                <div className="flex items-center justify-between gap-3 bg-black/5 rounded-xl p-1.5">
                  <button
                    onClick={decreaseFont}
                    className="flex-1 py-1.5 rounded-lg text-sm font-bold hover:bg-white/20 active:scale-95 transition-all"
                  >
                    A-
                  </button>
                  <span className="text-sm font-mono font-bold">{fontSize}px</span>
                  <button
                    onClick={increaseFont}
                    className="flex-1 py-1.5 rounded-lg text-sm font-bold hover:bg-white/20 active:scale-95 transition-all"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Theme Settings Selector */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-65">Reading Theme</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mode: 'light' as ReaderTheme, label: 'Light', icon: Sun, bg: 'bg-white text-gray-900 border-gray-200' },
                    { mode: 'sepia' as ReaderTheme, label: 'Sepia', icon: BookOpen, bg: 'bg-[#f7f1e3] text-[#5d4037] border-[#e1d8c1]' },
                    { mode: 'dark' as ReaderTheme, label: 'Dark', icon: Moon, bg: 'bg-gray-950 text-gray-200 border-gray-800' }
                  ].map((t) => (
                    <button
                      key={t.mode}
                      onClick={() => setTheme(t.mode)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all',
                        t.bg,
                        theme === t.mode && 'ring-2 ring-gold-500 scale-102'
                      )}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Chapters Sidebar Index (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 space-y-3">
          <div className="sticky top-32 p-1">
            {/* Book Details & Buy Widget */}
            <div className="mb-6 space-y-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-black/10">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                {book.amazonUrl && (
                  <a
                    href={book.amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-center text-xs font-bold bg-[#FF9900]/10 hover:bg-[#FF9900]/25 text-[#CC6600] border border-[#FF9900]/20 transition-all hover:scale-[1.02] cursor-pointer no-underline"
                  >
                    🛒 Buy on Amazon
                  </a>
                )}
                {book.selarUrl && (
                  <a
                    href={book.selarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-center text-xs font-bold bg-[#E31C25]/10 hover:bg-[#E31C25]/25 text-[#E31C25] border border-[#E31C25]/20 transition-all hover:scale-[1.02] cursor-pointer no-underline"
                  >
                    🚀 Buy on Selar
                  </a>
                )}
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50">Chapters Index</h3>
            <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2">
              {chapters.map((chapter, idx) => {
                const active = idx === currentChapterIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentChapterIdx(idx)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border',
                      active
                        ? 'bg-gold-500 text-white border-gold-500 shadow-md shadow-gold-500/20'
                        : theme === 'dark'
                          ? 'bg-gray-900/40 border-gray-900 text-gray-300 hover:bg-gray-900 hover:text-white'
                          : theme === 'sepia'
                            ? 'bg-[#ebdfc3]/40 border-[#e1d8c1]/40 text-[#5d4037] hover:bg-[#ebdfc3]'
                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {chapter.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Chapters Drawer Menu overlay */}
        {showChaptersMenu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChaptersMenu(false)} />
            <div
              className={cn(
                'absolute top-0 right-0 bottom-0 w-72 p-6 transition-all duration-300 shadow-2xl flex flex-col',
                theme === 'light' && 'bg-white text-gray-900',
                theme === 'sepia' && 'bg-[#f7f1e3] text-[#5d4037]',
                theme === 'dark' && 'bg-gray-950 text-gray-100'
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider mb-6 opacity-60">Chapters Index</h3>
              <div className="space-y-2 overflow-y-auto flex-1">
                {chapters.map((chapter, idx) => {
                  const active = idx === currentChapterIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentChapterIdx(idx);
                        setShowChaptersMenu(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all border',
                        active
                          ? 'bg-gold-500 text-white border-gold-500 shadow-lg'
                          : theme === 'dark'
                            ? 'bg-gray-900/40 border-gray-900'
                            : theme === 'sepia'
                              ? 'bg-[#ebdfc3]/40 border-[#e1d8c1]/40'
                              : 'bg-gray-50 border-gray-150'
                      )}
                    >
                      {chapter.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Reader Text Field */}
        <div className="lg:col-span-3">
          <div className="max-w-2xl mx-auto py-6">
            
            {/* Mobile/Tablet Book Header & Purchase section */}
            {currentChapterIdx === 0 && (
              <div className="lg:hidden mb-8 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold font-sans leading-tight">{book.title}</h2>
                    <p className="text-xs opacity-75 font-semibold mt-0.5">By {book.author}</p>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed font-sans">{book.description}</p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    {book.amazonUrl && (
                      <a
                        href={book.amazonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-[#FF9900]/10 hover:bg-[#FF9900]/25 text-[#CC6600] border border-[#FF9900]/20 transition-all cursor-pointer no-underline"
                      >
                        🛒 Amazon
                      </a>
                    )}
                    {book.selarUrl && (
                      <a
                        href={book.selarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-[#E31C25]/10 hover:bg-[#E31C25]/25 text-[#E31C25] border border-[#E31C25]/20 transition-all cursor-pointer no-underline"
                      >
                        🚀 Selar
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Header info */}
            <div className="border-b border-black/10 pb-6 mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif mb-2 leading-tight">
                {currentChapter.title}
              </h1>
              <div className="flex items-center gap-2 text-xs font-medium opacity-65">
                <span>{book.title}</span>
                <span>•</span>
                <span>By {book.author}</span>
              </div>
            </div>

            {/* Reading Content Area */}
            <article
              className="font-serif leading-relaxed text-justify break-words whitespace-pre-wrap select-text selection:bg-gold-200"
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentChapter.content}
            </article>

            {/* Bottom Chapter Pagination Controls */}
            <div className="border-t border-black/10 mt-16 pt-8 flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentChapterIdx(prev => Math.max(0, prev - 1))}
                disabled={currentChapterIdx === 0}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border disabled:opacity-40 disabled:pointer-events-none',
                  theme === 'dark' ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev Chapter
              </button>

              <div className="text-xs font-bold uppercase tracking-widest opacity-60">
                Chapter {currentChapterIdx + 1} of {chapters.length}
              </div>

              <button
                onClick={() => setCurrentChapterIdx(prev => Math.min(chapters.length - 1, prev + 1))}
                disabled={currentChapterIdx === chapters.length - 1}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border disabled:opacity-40 disabled:pointer-events-none',
                  theme === 'dark' ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-700'
                )}
              >
                Next Chapter
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
