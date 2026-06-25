import { useState, useEffect } from 'react';
import { getSavedBlogPosts, saveBlogPosts } from '@/data/blogStore';
import { getSavedBooks, saveBooks } from '@/data/bookStore';
import { getSavedSermons, saveSermons } from '@/data/sermonStore';
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
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import SermonsPage from '@/components/SermonsPage';
import SermonPlayer from '@/components/SermonPlayer';
import BooksPage from '@/components/BooksPage';
import BookReader from '@/components/BookReader';
import BlogPage from '@/components/BlogPage';
import BlogPostReader from '@/components/BlogPostReader';
import DonatePage from '@/components/DonatePage';
import type { Sermon, Book, BlogPost } from '@/types';

export type Page = 'home' | 'admin' | 'admin-login' | 'sermons' | 'sermon-player' | 'books' | 'book-details' | 'blog' | 'blog-details' | 'donate';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => api.isAuthenticated());
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      return getSavedBooks();
    } catch {
      return [];
    }
  });
  const [sermons, setSermons] = useState<Sermon[]>(() => {
    try {
      return getSavedSermons();
    } catch {
      return [];
    }
  });
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      return getSavedBlogPosts();
    } catch {
      return [];
    }
  });
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [mixlrUrl, setMixlrUrl] = useState(() => localStorage.getItem('mixlr_url') || 'https://mixlr.com/users/8375836/embed');
  const [isRadioActive, setIsRadioActive] = useState(() => localStorage.getItem('radio_active') === 'true');

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedSermons, fetchedBooks, fetchedPosts, fetchedRadio] = await Promise.all([
          api.getSermons(),
          api.getBooks(),
          api.getBlog(),
          api.getRadio()
        ]);
        
        setSermons(fetchedSermons);
        saveSermons(fetchedSermons);
        
        setBooks(fetchedBooks);
        saveBooks(fetchedBooks);
        
        setPosts(fetchedPosts);
        saveBlogPosts(fetchedPosts);
        
        setMixlrUrl(fetchedRadio.url);
        localStorage.setItem('mixlr_url', fetchedRadio.url);
        setIsRadioActive(fetchedRadio.active);
        localStorage.setItem('radio_active', String(fetchedRadio.active));
      } catch (err) {
        console.error('Failed to sync state with API server:', err);
      }
    }
    loadData();
  }, []);

  const handleUpdateRadio = async (url: string, active: boolean) => {
    setMixlrUrl(url);
    setIsRadioActive(active);
    localStorage.setItem('mixlr_url', url);
    localStorage.setItem('radio_active', String(active));
    try {
      await api.saveRadio(url, active);
    } catch (err) {
      console.error("Failed to sync radio changes with server:", err);
    }
  };

  const navigate = (page: Page) => {
    console.log('[Routing] Navigating to page:', page);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    navigate('admin');
  };

  const handleSignOut = () => {
    api.logout();
    setIsAdminAuthenticated(false);
    navigate('home');
  };

  const handleAdminClick = () => {
    if (api.isAuthenticated()) {
      setIsAdminAuthenticated(true);
      navigate('admin');
    } else {
      setIsAdminAuthenticated(false);
      navigate('admin-login');
    }
  };

  if (currentPage === 'admin-login') {
    return (
      <AdminLogin
        onLogin={handleAdminLogin}
        onBack={() => navigate('home')}
      />
    );
  }

  if (currentPage === 'admin') {
    if (!isAdminAuthenticated) {
      navigate('admin-login');
      return null;
    }
    return (
      <AdminDashboard
        posts={posts}
        onUpdatePosts={async (newPosts) => {
          setPosts(newPosts);
          saveBlogPosts(newPosts);
          try {
            if (newPosts.length < posts.length) {
              const deleted = posts.find(p => !newPosts.some(np => np.id === p.id));
              if (deleted) await api.deleteBlogPost(deleted.id);
            } else {
              const changed = newPosts.find(np => {
                const prev = posts.find(p => p.id === np.id);
                return !prev || JSON.stringify(prev) !== JSON.stringify(np);
              });
              if (changed) await api.saveBlogPost(changed);
            }
            const latest = await api.getBlog();
            setPosts(latest);
            saveBlogPosts(latest);
          } catch (err) {
            console.error("Failed to sync blog changes with server:", err);
          }
        }}
        books={books}
        onUpdateBooks={async (newBooks) => {
          setBooks(newBooks);
          saveBooks(newBooks);
          try {
            if (newBooks.length < books.length) {
              const deleted = books.find(b => !newBooks.some(nb => nb.id === b.id));
              if (deleted) await api.deleteBook(deleted.id);
            } else {
              const changed = newBooks.find(nb => {
                const prev = books.find(b => b.id === nb.id);
                return !prev || JSON.stringify(prev) !== JSON.stringify(nb);
              });
              if (changed) await api.saveBook(changed);
            }
            const latest = await api.getBooks();
            setBooks(latest);
            saveBooks(latest);
          } catch (err) {
            console.error("Failed to sync book changes with server:", err);
          }
        }}
        sermons={sermons}
        onUpdateSermons={async (newSermons) => {
          setSermons(newSermons);
          saveSermons(newSermons);
          try {
            if (newSermons.length < sermons.length) {
              const deleted = sermons.find(s => !newSermons.some(ns => ns.id === s.id));
              if (deleted) await api.deleteSermon(deleted.id);
            } else {
              const changed = newSermons.find(ns => {
                const prev = sermons.find(s => s.id === ns.id);
                return !prev || JSON.stringify(prev) !== JSON.stringify(ns);
              });
              if (changed) await api.saveSermon(changed);
            }
            const latest = await api.getSermons();
            setSermons(latest);
            saveSermons(latest);
          } catch (err) {
            console.error("Failed to sync sermon changes with server:", err);
          }
        }}
        mixlrUrl={mixlrUrl}
        isRadioActive={isRadioActive}
        onUpdateRadio={handleUpdateRadio}
        onSignOut={handleSignOut}
      />
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
        />
        <SermonsPage
          sermons={sermons}
          onSermonSelect={(sermon) => {
            setSelectedSermon(sermon);
            navigate('sermon-player');
          }}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <SermonPlayer
          sermons={sermons}
          sermon={selectedSermon}
          onSermonSelect={(sermon) => {
            setSelectedSermon(sermon);
            window.scrollTo(0, 0);
          }}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <BooksPage
          books={books}
          onBookSelect={(book) => {
            setSelectedBook(book);
            navigate('book-details');
          }}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <BookReader
          book={selectedBook}
          onBack={() => navigate('books')}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <BlogPage
          posts={posts}
          onPostSelect={(post) => {
            setSelectedPost(post);
            navigate('blog-details');
          }}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <BlogPostReader
          posts={posts}
          post={selectedPost}
          onBack={() => navigate('blog')}
          onPostSelect={(post) => {
            setSelectedPost(post);
            window.scrollTo(0, 0);
          }}
        />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
        />
        <DonatePage onBack={() => navigate('home')} />
        <Footer onNavigate={navigate} />
        <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
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
      />
      <main>
        <HeroSection 
          onSermonsClick={() => navigate('sermons')}
          onBooksClick={() => navigate('books')}
          onBlogClick={() => navigate('blog')}
        />
        <StatsSection />
        <FeaturedSermons
          sermons={sermons}
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
        <EventsSection />
        <BlogSection
          posts={posts}
          onPostSelect={(post) => {
            setSelectedPost(post);
            navigate('blog-details');
          }}
          onViewAll={() => navigate('blog')}
        />
        <TestimonialsSection />

        <PrayerRequestSection />
        <DonationBanner onGiveClick={() => navigate('donate')} />
      </main>
      <Footer onNavigate={navigate} />
      <RadioPlayer mixlrUrl={mixlrUrl} isActive={isRadioActive} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
