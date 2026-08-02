import { ArrowLeft, BookOpen, Download, ExternalLink, Heart, MessageSquare, Eye } from 'lucide-react';
import type { Book } from '@/types';
import { useState, useEffect } from 'react';
import { isItemLiked, toggleLikeItem } from '@/data/likesStore';
import { cn } from '@/utils/cn';
import { api } from '@/utils/api';

interface BookReaderProps {
  book: Book;
  onBack: () => void;
}

export default function BookReader({ book, onBack }: BookReaderProps) {
  const [isLiked, setIsLiked] = useState(() => isItemLiked('book', book.id));
  const [localViews, setLocalViews] = useState(book.views || 0);

  // Comments State
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    setIsLiked(isItemLiked('book', book.id));
    setLocalViews(book.views || 0);
  }, [book.id, book.views]);

  useEffect(() => {
    const handleLikesUpdated = () => {
      setIsLiked(isItemLiked('book', book.id));
    };
    window.addEventListener('likes_updated', handleLikesUpdated);
    return () => window.removeEventListener('likes_updated', handleLikesUpdated);
  }, [book.id]);

  useEffect(() => {
    // Increment book views on load
    api.incrementBookViews(book.id)
      .then((newViews) => setLocalViews(newViews))
      .catch((err) => console.error('Failed to increment book views:', err));

    // Fetch comments
    api.getComments('book', book.id)
      .then(data => setComments(data))
      .catch(err => console.error('Failed to load comments:', err));
  }, [book.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentName.trim() || !newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentSuccess(false);

    try {
      const res = await api.addComment('book', book.id, {
        name: newCommentName.trim(),
        text: newCommentText.trim()
      });

      setCommentSuccess(true);
      setNewCommentText('');

      if (res.comment.status === 'approved') {
        setComments(prev => [res.comment, ...prev]);
      } else {
        alert('Thank you! Your comment has been submitted and is awaiting moderation.');
      }
      setTimeout(() => setCommentSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-gray-50">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-contain p-4" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
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
              <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {localViews.toLocaleString()} Views
              </div>
            </div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight">
                {book.title}
              </h1>
              <button
                onClick={() => toggleLikeItem('book', book.id)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0",
                  isLiked
                    ? "bg-red-50 border-red-200 text-red-500 shadow-sm"
                    : "bg-white border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50/20"
                )}
                title={isLiked ? "Unlike book" : "Like book"}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-red-500")} />
              </button>
            </div>
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

        {/* Comments Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-royal-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">
              Comments ({comments.length})
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="mb-8 bg-gray-55 border border-gray-100 p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Leave a Comment</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="book-comment-name" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Name</label>
                <input
                  id="book-comment-name"
                  type="text"
                  value={newCommentName}
                  onChange={(e) => setNewCommentName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all bg-white text-gray-800"
                  required
                />
              </div>
              <div>
                <label htmlFor="book-comment-text" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Your Comment</label>
                <textarea
                  id="book-comment-text"
                  rows={4}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write your comment here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 text-sm transition-all resize-none bg-white text-gray-800"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newCommentName.trim() || !newCommentText.trim() || isSubmittingComment}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 hover:from-royal-blue-700 hover:to-royal-blue-800 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-royal-blue-500/10 cursor-pointer border-none"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No comments yet. Share your thoughts with other readers!</p>
            ) : (
              comments.map((comment) => {
                const initials = comment.name ? comment.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                return (
                  <div key={comment.id} className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-royal-blue-100 to-royal-blue-200 text-royal-blue-700 flex items-center justify-center font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{comment.name}</h4>
                        <span className="text-[9px] font-semibold text-gray-400">
                          {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-gray-650 text-xs leading-relaxed whitespace-pre-line">{comment.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
