import { useState, useEffect } from 'react';
import { getSavedBlogPosts, saveBlogPost, deleteBlogPost } from '@/data/blogStore';
import { getSavedBooks, saveBook, deleteBook } from '@/data/bookStore';
import { getSavedSermons, saveSermon, deleteSermon } from '@/data/sermonStore';
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

const getPageFromHash = (): Page => {
  const hash = window.location.hash.replace('#', '') as Page;
  const validPages: Page[] = ['home', 'admin', 'admin-login', 'sermons', 'sermon-player', 'books', 'book-details', 'blog', 'blog-details', 'donate'];
  if (validPages.includes(hash)) {
    return hash;
  }
  return 'home';
};

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromHash());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => api.isAuthenticated());
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [mixlrUrl, setMixlrUrl] = useState('https://mixlr.com/users/8375836/embed');
  const [isRadioActive, setIsRadioActive] = useState(false);

  // Sync hash routing on popstate/hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Set default hash if not present
    if (!window.location.hash) {
      window.location.hash = 'home';
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
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
        const loadedSermons = await getSavedSermons();
        setSermons(loadedSermons);
      } catch (err) {
        console.error('Failed to load sermons:', err);
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
        const radio = await api.getRadio();
        setMixlrUrl(radio.url);
        setIsRadioActive(radio.active);
      } catch (err) {
        console.error('Failed to load radio settings:', err);
      }
    };
    fetchData();
  }, []);

  const handleUpdateRadio = async (url: string, active: boolean) => {
    setMixlrUrl(url);
    setIsRadioActive(active);
    try {
      await api.saveRadio(url, active);
    } catch (err) {
      console.error('Failed to save radio settings:', err);
    }
  };

  const navigate = (page: Page) => {
    console.log('[Routing] Navigating to page:', page);
    window.location.hash = page;
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    navigate('admin');
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
        }}
        mixlrUrl={mixlrUrl}
        isRadioActive={isRadioActive}
        onUpdateRadio={handleUpdateRadio}
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
