import { useState, useEffect } from 'react';
import { Menu, X, Search, User, Heart, BookOpen, Tv, Home, Library, Gift, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Page } from '@/App';

const navLinks = [
  { name: 'Home', href: '#home', icon: Home, page: 'home' as Page },
  { name: 'Sermons', href: '#sermons', icon: Tv, page: 'sermons' as Page },
  { name: 'Books', href: '#books', icon: BookOpen, page: 'books' as Page },
  { name: 'Blog', href: '#blog', icon: Library, page: 'blog' as Page },
  { name: 'Events', href: '#events', icon: Gift },
];

interface NavbarProps {
  onLoginClick?: () => void;
  onNavigate?: (page: Page) => void;
  onAdminClick?: () => void;
  currentPage?: Page;
}

export default function Navbar({ onLoginClick, onNavigate, onAdminClick, currentPage = 'home' }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (link: typeof navLinks[0], e: React.MouseEvent) => {
    console.log('[Navbar] Clicked link:', link.name, 'page:', link.page);
    e.preventDefault();
    setIsOpen(false);
    if (link.page && onNavigate) {
      onNavigate(link.page);
    } else {
      if (currentPage !== 'home' && onNavigate) {
        onNavigate('home');
        setTimeout(() => {
          window.location.hash = link.href;
        }, 100);
      } else {
        window.location.hash = link.href;
      }
    }
  };

  const isLinkActive = (link: typeof navLinks[0]) => {
    if (link.page) {
      if (link.page === 'home') {
        return currentPage === 'home' || currentPage === 'sermon-player'; // home is base, or sermon player fallback
      }
      if (link.page === 'books') {
        return currentPage === 'books' || currentPage === 'book-details';
      }
      if (link.page === 'blog') {
        return currentPage === 'blog' || currentPage === 'blog-details';
      }
      return currentPage === link.page;
    }
    // Hash links are active only on home page if the hash matches
    return currentPage === 'home' && window.location.hash === link.href;
  };

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          currentPage !== 'home'
            ? 'bg-white border-b border-gray-200 shadow-sm'
            : isScrolled
              ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100/50'
              : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('home');
              }}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center shadow-lg shadow-royal-blue-500/20 transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className={cn(
                'font-bold text-lg tracking-tight transition-colors duration-300',
                isScrolled || currentPage !== 'home' ? 'text-gray-900' : 'text-white'
              )}>
                Joshua<span className="text-gold-500">Gen</span>
              </span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <button
                    key={link.name}
                    onClick={(e) => handleLinkClick(link, e)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? isScrolled || currentPage !== 'home'
                          ? 'text-royal-blue-600 bg-royal-blue-50/50'
                          : 'text-white bg-white/20'
                        : isScrolled || currentPage !== 'home'
                          ? 'text-gray-600 hover:text-royal-blue-600 hover:bg-royal-blue-50/30'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {link.name}
                  </button>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className={cn(
                    'hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200',
                    isScrolled || currentPage !== 'home'
                      ? 'text-gray-500 hover:text-royal-blue-600 hover:bg-royal-blue-50 border border-gray-200'
                      : 'text-white/60 hover:text-white hover:bg-white/10 border border-white/20'
                  )}
                >
                  Admin
                </button>
              )}
            
              <button className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                isScrolled || currentPage !== 'home'
                  ? 'text-gray-500 hover:text-royal-blue-600 hover:bg-royal-blue-50'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}>
                <Search className="w-5 h-5" />
              </button>
              <button className={cn(
                'p-2.5 rounded-xl transition-all duration-200 hidden sm:block',
                isScrolled || currentPage !== 'home'
                  ? 'text-gray-500 hover:text-royal-blue-600 hover:bg-royal-blue-50'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}>
                <Heart className="w-5 h-5" />
              </button>
              <button
                onClick={onLoginClick}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  isScrolled || currentPage !== 'home'
                    ? 'text-gray-500 hover:text-royal-blue-600 hover:bg-royal-blue-50'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                <User className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('donate')}
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 hover:scale-105 transition-all duration-300"
              >
                <Gift className="w-4 h-4" />
                Donate
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  'lg:hidden p-2.5 rounded-xl transition-all duration-200',
                  isScrolled || currentPage !== 'home'
                    ? 'text-gray-500 hover:text-royal-blue-600 hover:bg-royal-blue-50'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-all duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        <div
          className={cn(
            'absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-soft-lg border border-gray-100 p-6 transition-all duration-300',
            isOpen ? 'translate-y-0' : '-translate-y-4'
          )}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(link, e)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                    active
                      ? 'text-royal-blue-600 bg-royal-blue-50'
                      : 'text-gray-700 hover:text-royal-blue-600 hover:bg-royal-blue-50/50'
                  )}
                >
                  <link.icon className={cn('w-5 h-5', active ? 'text-royal-blue-500' : 'text-gray-400')} />
                  {link.name}
                </a>
              );
            })}
            <div className="h-px bg-gray-100 my-2" />
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-royal-blue-600 hover:bg-royal-blue-50 transition-all duration-200 font-medium">
              <Heart className="w-5 h-5 text-gray-400" />
              Saved
            </button>
            <button onClick={() => { setIsOpen(false); onLoginClick?.(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-royal-blue-600 hover:bg-royal-blue-50 transition-all duration-200 font-medium">
              <User className="w-5 h-5 text-gray-400" />
              Profile
            </button>
            {onAdminClick && (
              <button onClick={() => { setIsOpen(false); onAdminClick(); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-royal-blue-600 hover:bg-royal-blue-50 transition-all duration-200 font-medium">
                <Shield className="w-5 h-5 text-gray-400" />
                Admin Portal
              </button>
            )}
            <button 
              onClick={() => { setIsOpen(false); onNavigate && onNavigate('donate'); }}
              className="mt-3 w-full px-5 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Give Now
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 backdrop-blur-xl border-t border-gray-200/50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {[
            { icon: Home, label: 'Home', page: 'home' as Page },
            { icon: Tv, label: 'Sermons', page: 'sermons' as Page },
            { icon: Library, label: 'Books', page: 'books' as Page },
            { icon: BookOpen, label: 'Blog', page: 'blog' as Page },
            { icon: User, label: 'Profile', page: 'home' as Page },
          ].map((item, idx) => {
            const active = currentPage === item.page ||
              (item.label === 'Home' && currentPage === 'sermon-player') ||
              (item.label === 'Books' && currentPage === 'book-details') ||
              (item.label === 'Blog' && currentPage === 'blog-details');
            return (
              <button
                key={idx}
                onClick={() => onNavigate && onNavigate(item.page)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
                  active
                    ? 'text-royal-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <item.icon className={cn('w-5 h-5', active && 'drop-shadow-sm')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          {/* Floating Donate */}
          <button
            onClick={() => onNavigate && onNavigate('donate')}
            className="flex flex-col items-center gap-1 px-3 py-1.5 relative cursor-pointer"
          >
            <div className="absolute -top-4 w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30 animate-[pulse-glow_2s_ease-in-out_infinite]">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-medium text-gray-400 mt-4">Give</span>
          </button>
        </div>
      </div>
    </>
  );
}
