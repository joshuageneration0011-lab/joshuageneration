import { Download, BookOpen, ChevronRight } from 'lucide-react';
import type { Book } from '@/types';

interface BooksSectionProps {
  books: Book[];
  onBookSelect?: (book: Book) => void;
  onViewAll?: () => void;
}

export default function BooksSection({ books, onBookSelect, onViewAll }: BooksSectionProps) {
  const featuredBooks = books.slice(0, 4);

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
    <section id="books" className="relative py-24 sm:py-32 bg-white overflow-hidden">
      {/* Decorative blob */}
      <div
        className="absolute -right-32 top-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-gold-600 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="h-px w-6 bg-gold-500 inline-block" />
              Book Library
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Featured Books
            </h2>
            <p className="mt-3 text-gray-500 text-lg max-w-md">
              Timeless writings that will transform and renew your mind
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-900/10 hover:border-gold-500/40 bg-gray-50 hover:bg-gold-50 text-gray-700 hover:text-gold-700 font-semibold text-sm transition-all duration-300 shadow-soft"
          >
            Browse Library
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredBooks.map((book, index) => (
            <div
              key={book.id}
              onClick={() => onBookSelect?.(book)}
              className="group cursor-pointer flex flex-col"
            >
              {/* Book cover */}
              <div
                className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-4 shadow-soft hover:shadow-soft-lg transition-all duration-500 hover:-translate-y-1"
                style={{
                  boxShadow: '4px 6px 24px rgba(0,0,0,0.12), -1px 0 0 rgba(0,0,0,0.06)',
                }}
              >
                <img loading="lazy" decoding="async"
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Actions on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    onClick={(e) => { e.stopPropagation(); onBookSelect?.(book); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white transition-all duration-200"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #b8942f)', boxShadow: '0 4px 12px rgba(212,175,55,0.4)' }}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Read Now
                  </button>
                  <button
                    onClick={(e) => handleDownload(book, e)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-sm font-semibold text-xs text-gray-900 hover:bg-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>

                {/* Category pill */}
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 text-[9px] font-bold tracking-wider uppercase">
                  {book.category}
                </span>
              </div>

              {/* Book info */}
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-royal-blue-600 transition-colors leading-snug line-clamp-2">
                {book.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500 font-medium">{book.author}</p>

              {/* Decorative line */}
              <div
                className="mt-2 h-px w-10 transition-all duration-300 group-hover:w-16"
                style={{ background: 'linear-gradient(90deg, #d4af37, transparent)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
