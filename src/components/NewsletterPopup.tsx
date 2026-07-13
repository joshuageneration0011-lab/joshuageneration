import React, { useState, useEffect } from 'react';
import { X, Send, Mail } from 'lucide-react';
import { api } from '@/utils/api';
import { cn } from '@/utils/cn';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if the user has already seen or dismissed the popup
    const hasSeenPopup = localStorage.getItem('jg_newsletter_dismissed');
    
    if (!hasSeenPopup) {
      // Show popup after 5 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remember that they dismissed it so we don't annoy them
    localStorage.setItem('jg_newsletter_dismissed', 'true');
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    const res = await api.subscribeNewsletter(email, name);
    
    if (res.success) {
      setStatus('success');
      setMessage(res.message || 'Subscribed successfully!');
      localStorage.setItem('jg_newsletter_dismissed', 'true'); // Don't show again if they subscribed
      
      // Auto-close after 3 seconds of success
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } else {
      setStatus('error');
      setMessage(res.error || 'Failed to subscribe. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-royal-blue-900 border border-white/10 shadow-2xl shadow-royal-blue-900/50 animate-in zoom-in-95 duration-500">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-royal-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 sm:p-10 flex flex-col items-center text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30 mb-6 relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse" />
            <Mail className="w-8 h-8 text-royal-blue-950 relative z-10" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Stay Connected
          </h2>
          <p className="text-royal-blue-100/80 text-sm sm:text-base mb-8 leading-relaxed">
            Subscribe to receive daily devotionals, exclusive event updates, and ministry news directly to your inbox.
          </p>

          <form onSubmit={handleSubscribe} className="w-full flex flex-col gap-4">
            
            <div className="flex flex-col gap-3 text-left">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Name (optional)"
                disabled={status === 'loading' || status === 'success'}
                className="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm shadow-inner disabled:opacity-50"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={status === 'loading' || status === 'success'}
                className="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm shadow-inner disabled:opacity-50"
              />
            </div>

            <button 
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="mt-2 w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 text-royal-blue-950 rounded-xl font-bold text-base shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
            >
              {status === 'loading' ? 'Sending...' : status === 'success' ? 'Subscribed!' : 'Subscribe Now'}
              {status !== 'loading' && status !== 'success' && <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
            </button>

            {message && (
              <p className={cn(
                "mt-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-2",
                status === 'error' ? "text-red-400" : "text-emerald-400"
              )}>
                {message}
              </p>
            )}
          </form>
          
          <p className="mt-6 text-xs text-white/40">
            We respect your privacy. No spam, ever.
          </p>

        </div>
      </div>
    </div>
  );
}
