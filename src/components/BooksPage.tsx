import { resolveApiUrl } from '@/utils/api';
import { useState, useMemo } from 'react';
import { Search, Download, BookOpen, SlidersHorizontal } from 'lucide-react';
import type { Book } from '@/types';
import { cn } from '@/utils/cn';

interface BooksPageProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

export default function BooksPage({ books, onBookSelect }: BooksPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const list = new Set(books.map((b) => b.category));
    return ['All', ...Array.from(list)];
  }, []);

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleDownload = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    const element = document.createElement('a');
    const file = new Blob([`Simulated PDF ebook file for "${book.title}" by ${book.author}.\nCategory: ${book.category}\nDescription: ${book.description}`], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ebook.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-gold-50 text-gold-600 text-xs font-semibold tracking-wide uppercase mb-4">
            E-Book Store
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Transform Your Mind with <span className="text-gold-600">Kingdom Books</span>
          </h1>
          <p className="text-lg text-gray-500">
            Access spiritually enriching literature written to build your prayer life, study kingdom economics, and unlock your purpose.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books by title, author, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 transition-all"
            />
          </div>

          <div className="flex w-full md:w-auto items-center gap-2 text-xs font-medium text-gray-400 justify-end">
            <SlidersHorizontal className="w-4 h-4" />
            Showing {filteredBooks.length} books
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 border',
                selectedCategory === category
                  ? 'bg-gold-500 text-white border-gold-500 shadow-md shadow-gold-500/25 scale-[1.02]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredBooks.map((book, index) => (
              <div
                key={book.id}
                onClick={() => onBookSelect(book)}
                className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-500"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Cover Frame */}
                <div className="relative aspect-[3/4] bg-gray-50 border-b border-gray-100 overflow-hidden">
                  <img loading="lazy" decoding="async"
                    src={resolveApiUrl(book.coverUrl)}
                    alt={book.title}
                    className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Actions overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      onClick={(e) => handleDownload(book, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white rounded-xl text-gray-900 font-bold text-xs hover:bg-gray-50 transition-colors shadow-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookSelect(book);
                      }}
                      className="flex items-center justify-center p-2.5 bg-royal-blue-600 rounded-xl text-white font-medium hover:bg-royal-blue-700 transition-colors shadow-lg"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Details info */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gold-600 mb-1">
                    {book.category}
                  </span>
                  
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors line-clamp-2 leading-snug mb-1">
                    {book.title}
                  </h3>

                  <p className="text-gray-400 text-xs font-semibold mb-3">By {book.author}</p>

                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed flex-grow">
                    {book.description}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookSelect(book);
                    }}
                    className="w-full mt-4 py-2 border border-gray-200 hover:border-royal-blue-500 hover:bg-royal-blue-50/20 text-gray-700 hover:text-royal-blue-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read E-Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-soft">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No books found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              We couldn't find any books matching "{searchQuery}". Try selecting another category or refining your terms.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-6 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-gold-500/20"
            >
              Reset Search
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
