import { ArrowLeft, BookOpen, Download, ExternalLink } from 'lucide-react';
import type { Book } from '@/types';
import { cn } from '@/utils/cn';

interface BookReaderProps {
  book: Book;
  onBack: () => void;
}

export default function BookReader({ book, onBack }: BookReaderProps) {
  const pdfs = book.pdfs || [];

  return (
    <div className="min-h-screen pt-20 bg-gray-50 text-gray-900 pb-20">
      {/* Top Bar */}
      <div className="fixed top-16 left-0 right-0 z-30 border-b bg-white/95 border-gray-100 backdrop-blur-md py-3.5 px-4 sm:px-6 lg:px-8 flex items-center shadow-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-xl transition-colors hover:bg-gray-100 mr-4 cursor-pointer border-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold truncate max-w-[200px] md:max-w-[300px]">
            {book.title}
          </h2>
          <p className="text-[10px] mt-0.5 text-gray-500">
            By {book.author}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-8 sm:gap-12">
          
          {/* Cover */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-100">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Store Links */}
            <div className="mt-6 space-y-3">
              {book.amazonUrl && (
                <a
                  href={book.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-[#FF9900]/10 hover:bg-[#FF9900]/25 text-[#CC6600] border border-[#FF9900]/20 transition-all cursor-pointer no-underline"
                >
                  <ExternalLink className="w-4 h-4" /> Buy on Amazon
                </a>
              )}
              {book.selarUrl && (
                <a
                  href={book.selarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-[#E31C25]/10 hover:bg-[#E31C25]/25 text-[#E31C25] border border-[#E31C25]/20 transition-all cursor-pointer no-underline"
                >
                  <ExternalLink className="w-4 h-4" /> Buy on Selar
                </a>
              )}
            </div>
          </div>

          {/* Details & PDFs */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="inline-block px-3 py-1 rounded-full bg-royal-blue-50 text-royal-blue-600 text-xs font-bold">
                {book.category}
              </div>
              {Number(book.downloads) > 0 && (
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  {Number(book.downloads).toLocaleString()} Downloads
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight mb-2">
              {book.title}
            </h1>
            <p className="text-gray-500 font-medium mb-6 text-sm">By {book.author}</p>
            
            <div className="prose prose-sm text-gray-600 leading-relaxed mb-10 max-w-none">
              {book.description}
            </div>

            {/* PDFs Section */}
            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
                Available Downloads
              </h3>
              
              {pdfs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pdfs.map((pdf, idx) => (
                    <a
                      key={idx}
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 hover:border-royal-blue-200 hover:shadow-md transition-all bg-white group no-underline"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate m-0 leading-none">{pdf.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 m-0 leading-none">PDF Document</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
                  <p className="text-sm text-gray-500 font-medium">
                    No PDF downloads available for this book yet.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
