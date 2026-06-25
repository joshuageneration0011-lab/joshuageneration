import { useState } from 'react';
import { getSavedBlogPosts, saveBlogPosts } from '@/data/blogStore';
import { getSavedBooks, saveBooks } from '@/data/bookStore';
import { getSavedSermons, saveSermons } from '@/data/sermonStore';
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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>(getSavedBooks);
  const [sermons, setSermons] = useState<Sermon[]>(getSavedSermons);
  const [posts, setPosts] = useState<BlogPost[]>(getSavedBlogPosts);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const [mixlrUrl, setMixlrUrl] = useState(() => localStorage.getItem('mixlr_url') || 'https://mixlr.com/users/8375836/embed');
  const [isRadioActive, setIsRadioActive] = useState(() => localStorage.getItem('radio_active') === 'true');

  const handleUpdateRadio = (url: string, active: boolean) => {
    setMixlrUrl(url);
    setIsRadioActive(active);
    localStorage.setItem('mixlr_url', url);
    localStorage.setItem('radio_active', String(active));
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
        onUpdatePosts={(newPosts) => {
          setPosts(newPosts);
          saveBlogPosts(newPosts);
        }}
        books={books}
        onUpdateBooks={(newBooks) => {
          setBooks(newBooks);
          saveBooks(newBooks);
        }}
        sermons={sermons}
        onUpdateSermons={(newSermons) => {
          setSermons(newSermons);
          saveSermons(newSermons);
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
