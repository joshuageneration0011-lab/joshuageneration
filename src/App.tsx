import React, { useState, useEffect, lazy, Suspense } from 'react';
import { getSavedBlogPosts, saveBlogPost, deleteBlogPost } from '@/data/blogStore';
import { getSavedBooks, saveBook, deleteBook } from '@/data/bookStore';
import { getSavedSermons, saveSermon, deleteSermon } from '@/data/sermonStore';
import { getSavedEvents, saveEvent, deleteEvent } from '@/data/eventStore';
import { api } from '@/utils/api';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturedSermons from '@/components/FeaturedSermons';
import BooksSection from '@/components/BooksSection';
import EventsSection from '@/components/EventsSection';
import BlogSection from '@/components/BlogSection';
import PrayerRequestSection from '@/components/PrayerRequestSection';
import DonationBanner from '@/components/DonationBanner';
import TestimonialsSection from '@/components/TestimonialsSection';
import StatsSection from '@/components/StatsSection';

import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import RadioPlayer from '@/components/RadioPlayer';

const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const AdminLogin = lazy(() => import('@/components/AdminLogin'));
const SermonsPage = lazy(() => import('@/components/SermonsPage'));
const SermonPlayer = lazy(() => import('@/components/SermonPlayer'));
const BooksPage = lazy(() => import('@/components/BooksPage'));
const BookReader = lazy(() => import('@/components/BookReader'));
const BlogPage = lazy(() => import('@/components/BlogPage'));
const BlogPostReader = lazy(() => import('@/components/BlogPostReader'));
const DonatePage = lazy(() => import('@/components/DonatePage'));
const PartnershipPage = lazy(() => import('@/components/PartnershipPage'));
const PodcastPage = lazy(() => import('@/components/PodcastPage'));
import type { Sermon, Book, BlogPost, Event } from '@/types';

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-gold-500 border-t-transparent animate-spin" />
      <p className="text-gray-500 text-xs font-semibold tracking-widest uppercase animate-pulse">Loading Presence...</p>
    </div>
  </div>
);


export type Page = 'home' | 'admin' | 'admin-login' | 'sermons' | 'sermon-player' | 'books' | 'book-details' | 'blog' | 'blog-details' | 'donate' | 'partnership' | 'podcast';

const getPageFromPath = (): Page => {
  const path = window.location.pathname.replace(/^\//, '') as Page;
  const validPages: Page[] = ['home', 'admin', 'admin-login', 'sermons', 'sermon-player', 'books', 'book-details', 'blog', 'blog-details', 'donate', 'partnership', 'podcast'];
  if (validPages.includes(path)) {
    return path;
  }
  if (path === '') {
    return 'home';
  }
  return 'home';
};

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromPath());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return api.isAuthenticated() && (api.getRole() === 'admin' || api.getRole() === 'superadmin');
  });
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(() => api.isAuthenticated());
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<{ sermons: number; books: number; members: number } | null>(null);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [isLoadingSermons, setIsLoadingSermons] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [donateCause, setDonateCause] = useState<string | undefined>(undefined);

  const [mixlrUrl, setMixlrUrl] = useState('https://mixlr.com/users/8375836/embed');
  const [isRadioActive, setIsRadioActive] = useState(false);

  // Sync history routing on popstate & handle global auth session expiration
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath();
      setCurrentPage(page);
    };
    const handleUnauthorized = () => {
      setIsAdminAuthenticated(false);
      setIsUserAuthenticated(false);
      navigate('admin-login');
      alert('Session expired. Please log in again.');
    };
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('jg_unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('jg_unauthorized', handleUnauthorized);
    };
  }, []);

  // Listen to events update triggers
  useEffect(() => {
    const handleEventsUpdated = async () => {
      try {
        const loadedEvents = await getSavedEvents();
        setEvents(loadedEvents);
      } catch (err) {
        console.error('Failed to reload events:', err);
      }
    };
    window.addEventListener('events_updated', handleEventsUpdated);
    return () => {
      window.removeEventListener('events_updated', handleEventsUpdated);
    };
  }, []);

  // Listen to sermons update triggers
  useEffect(() => {
    const handleSermonsUpdated = async () => {
      try {
        const loadedSermons = await getSavedSermons();
        setSermons(loadedSermons);
        setSelectedSermon(prev => {
          if (!prev) return null;
          return loadedSermons.find(s => s.id === prev.id) || prev;
        });
      } catch (err) {
        console.error('Failed to reload sermons:', err);
      }
    };
    window.addEventListener('sermons_updated', handleSermonsUpdated);
    return () => {
      window.removeEventListener('sermons_updated', handleSermonsUpdated);
    };
  }, []);

  // Redirect detail views to list views if reloaded with empty state
  useEffect(() => {
    if (currentPage === 'sermon-player' && !selectedSermon) {
      navigate('sermons');
    } else if (currentPage === 'book-details' && !selectedBook) {
      navigate('books');
    } else if (currentPage === 'blog-details' && !selectedPost) {
      navigate('blog');
    }
  }, [currentPage, selectedSermon, selectedBook, selectedPost]);

  // Fetch initial data from Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingSermons(true);
        const loadedSermons = await getSavedSermons();
        setSermons(loadedSermons);
      } catch (err) {
        console.error('Failed to load sermons:', err);
      }

      try {
        const loadedStats = await api.getStats();
        setStats(loadedStats);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }

      try {
        const loadedBooks = await getSavedBooks();
        setBooks(loadedBooks);
      } catch (err) {
        console.error('Failed to load books:', err);
      }

      try {
        const loadedPosts = await getSavedBlogPosts();
        setPosts(loadedPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
      }

      try {
        const loadedEvents = await getSavedEvents();
        setEvents(loadedEvents);
      } catch (err) {
        console.error('Failed to load events:', err);
      }

      try {
        const radio = await api.getRadio();
        setMixlrUrl(radio.url);
        setIsRadioActive(radio.active);
      } catch (err) {
        console.error('Failed to load radio settings:', err);
      }
      setIsLoadingSermons(false);
    };
    fetchData();
  }, []);

  // Fetch users when authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      const fetchUsers = async () => {
        try {
          const loadedUsers = await api.getUsers();
          setUsers(loadedUsers);
        } catch (err) {
          console.error('Failed to load users:', err);
        }
      };
      fetchUsers();
    }
  }, [isAdminAuthenticated]);

  const handleUpdateRadio = async (url: string, active: boolean) => {
    setMixlrUrl(url);
    setIsRadioActive(active);
    try {
      await api.saveRadio(url, active);
    } catch (err) {
      console.error('Failed to save radio settings:', err);
    }
  };

  const reloadStats = async () => {
    try {
      const loadedStats = await api.getStats();
      setStats(loadedStats);
    } catch (err) {
      console.error('Failed to reload stats:', err);
    }
  };

  const handleUpdateUsers = async (newUsers: any[]) => {
    try {
      await api.saveUsers(newUsers);
      setUsers(newUsers);
      await reloadStats();
    } catch (err) {
      console.error('Failed to update users:', err);
      alert('Failed to update users list.');
    }
  };

  const navigate = (page: Page) => {
    console.log('[Routing] Navigating to page:', page);
    const path = page === 'home' ? '/' : `/${page}`;
    window.history.pushState(null, '', path);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const navigateToDonate = (cause?: string) => {
    setDonateCause(cause);
    navigate('donate');
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setIsUserAuthenticated(true);
    navigate('admin');
  };

  const handleLogout = () => {
    api.logout();
    setIsAdminAuthenticated(false);
    setIsUserAuthenticated(false);
    navigate('home');
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      navigate('admin');
    } else {
      navigate('admin-login');
    }
  };

  if (currentPage === 'admin-login') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-royal-blue-600 border-t-transparent animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Loading Login portal...</p>
          </div>
        </div>
      }>
        <AdminLogin
          onLogin={handleAdminLogin}
          onBack={() => navigate('home')}
        />
      </Suspense>
    );
  }

  if (currentPage === 'admin') {
    if (!isAdminAuthenticated) {
      navigate('admin-login');
      return null;
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-royal-blue-600 border-t-transparent animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Loading Dashboard...</p>
          </div>
        </div>
      }>
        <AdminDashboard
          onLogout={handleLogout}
          posts={posts}
          onUpdatePosts={async (newPosts) => {
            if (newPosts.length < posts.length) {
              const deleted = posts.find(p => !newPosts.some(x => x.id === p.id));
              if (deleted) {
                try {
                  await deleteBlogPost(deleted.id);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            } else {
              const changed = newPosts.find(p => {
                const original = posts.find(x => x.id === p.id);
                return !original || JSON.stringify(original) !== JSON.stringify(p);
              });
              if (changed) {
                try {
                  await saveBlogPost(changed);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            }
            setPosts(newPosts);
          }}
          books={books}
          onUpdateBooks={async (newBooks) => {
            if (newBooks.length < books.length) {
              const deleted = books.find(b => !newBooks.some(x => x.id === b.id));
              if (deleted) {
                try {
                  await deleteBook(deleted.id);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            } else {
              const changed = newBooks.find(b => {
                const original = books.find(x => x.id === b.id);
                return !original || JSON.stringify(original) !== JSON.stringify(b);
              });
              if (changed) {
                try {
                  await saveBook(changed);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            }
            setBooks(newBooks);
            await reloadStats();
          }}
          sermons={sermons}
          onUpdateSermons={async (newSermons) => {
            if (newSermons.length < sermons.length) {
              const deleted = sermons.find(s => !newSermons.some(x => x.id === s.id));
              if (deleted) {
                try {
                  await deleteSermon(deleted.id);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            } else {
              const changed = newSermons.find(s => {
                const original = sermons.find(x => x.id === s.id);
                return !original || JSON.stringify(original) !== JSON.stringify(s);
              });
              if (changed) {
                try {
                  await saveSermon(changed);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            }
            setSermons(newSermons);
            await reloadStats();
          }}
          events={events}
          onUpdateEvents={async (newEvents) => {
            if (newEvents.length < events.length) {
              const deleted = events.find(ev => !newEvents.some(x => x.id === ev.id));
              if (deleted) {
                try {
                  await deleteEvent(deleted.id);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            } else {
              const changed = newEvents.find(ev => {
                const original = events.find(x => x.id === ev.id);
                return !original || JSON.stringify(original) !== JSON.stringify(ev);
              });
              if (changed) {
                try {
                  await saveEvent(changed);
                } catch (e) {
                  console.error(e);
                  throw e;
                }
              }
            }
            setEvents(newEvents);
          }}
          mixlrUrl={mixlrUrl}
          isRadioActive={isRadioActive}
          onUpdateRadio={handleUpdateRadio}
          users={users}
          onUpdateUsers={handleUpdateUsers}
        />
      </Suspense>
    );
  }



  if (currentPage === 'sermons') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <SermonsPage
            sermons={sermons}
            isLoading={isLoadingSermons}
            onSermonSelect={(sermon) => {
              setSelectedSermon(sermon);
              navigate('sermon-player');
            }}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'sermon-player' && selectedSermon) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <SermonPlayer
            sermons={sermons}
            sermon={selectedSermon}
            onSermonSelect={(sermon) => {
              setSelectedSermon(sermon);
              window.scrollTo(0, 0);
            }}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'books') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <BooksPage
            books={books}
            onBookSelect={(book) => {
              setSelectedBook(book);
              navigate('book-details');
            }}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'book-details' && selectedBook) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <BookReader
            book={selectedBook}
            onBack={() => navigate('books')}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'blog') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <BlogPage
            posts={posts}
            onPostSelect={(post) => {
              setSelectedPost(post);
              navigate('blog-details');
            }}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'blog-details' && selectedPost) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <BlogPostReader
            posts={posts}
            post={selectedPost}
            onBack={() => navigate('blog')}
            onPostSelect={(post) => {
              setSelectedPost(post);
              window.scrollTo(0, 0);
            }}
          />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'partnership') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <PartnershipPage onBack={() => navigate('home')} onNavigateToDonate={navigateToDonate} />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'donate') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <DonatePage onBack={() => navigate('home')} initialCause={donateCause} />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  if (currentPage === 'podcast') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar
          onLoginClick={() => setIsLoginOpen(true)}
          onNavigate={navigate}
          onAdminClick={handleAdminClick}
          currentPage={currentPage}
          isAuthenticated={isUserAuthenticated}
          onLogoutClick={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
          <PodcastPage onBack={() => navigate('home')} />
        </Suspense>
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onLoginClick={() => setIsLoginOpen(true)}
        onNavigate={navigate}
        onAdminClick={handleAdminClick}
        currentPage={currentPage}
        isAuthenticated={isUserAuthenticated}
        onLogoutClick={handleLogout}
      />
      <main>
        <HeroSection 
          onSermonsClick={() => navigate('sermons')}
          onBooksClick={() => navigate('books')}
          onBlogClick={() => navigate('blog')}
        />
        <StatsSection
          sermonsCount={stats?.sermons}
          booksCount={stats?.books}
          membersCount={stats?.members}
        />
        <FeaturedSermons
          sermons={sermons}
          isLoading={isLoadingSermons}
          onSermonSelect={(sermon) => {
            setSelectedSermon(sermon);
            navigate('sermon-player');
          }}
          onViewAll={() => navigate('sermons')}
        />
        <BooksSection
          books={books}
          onBookSelect={(book) => {
            setSelectedBook(book);
            navigate('book-details');
          }}
          onViewAll={() => navigate('books')}
        />
        <EventsSection events={events} />
        <BlogSection
          posts={posts}
          onPostSelect={(post) => {
            setSelectedPost(post);
            navigate('blog-details');
          }}
          onViewAll={() => navigate('blog')}
        />
        <TestimonialsSection />

        <DonationBanner onGiveClick={navigateToDonate} />
      </main>
      <Footer onNavigate={navigate} />
      <RadioPlayer mixlrUrl={mixlrUrl} isActive={isRadioActive} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLoginSuccess={() => setIsUserAuthenticated(true)} />
    </div>
  );
}
