import React from 'react';
import { Heart, Mail, MapPin, Phone, Send } from 'lucide-react';
import { cn } from '@/utils/cn';
import { api } from '@/utils/api';
import { useState, useEffect } from 'react';
import type { Settings } from '@/types';

const quickLinks = [
  { name: 'Sermons', href: '/sermons' },
  { name: 'Books', href: '/books' },
  { name: 'Blog', href: '/blog' },
  { name: 'Events', href: '#events' },
  { name: 'Prayer Requests', href: '#prayer' },
  { name: 'Contact', href: '/contact' },
  { name: 'Donate', href: '/donate' },
];

const socialLinks = [
  { name: 'Facebook', url: '#' },
  { name: 'Twitter', url: '#' },
  { name: 'Instagram', url: '#' },
  { name: 'YouTube', url: '#' },
];

interface FooterProps {
  onNavigate?: (page: any) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    const res = await api.subscribeNewsletter(email, name);
    if (res.success) {
      setStatus('success');
      setMessage(res.message || 'Subscribed!');
      setEmail('');
      setName('');
      setTimeout(() => setStatus('idle'), 5000);
    } else {
      setStatus('error');
      setMessage(res.error || 'Failed to subscribe');
    }
  };
  const [settings, setSettings] = useState<Partial<Settings>>({
    contactEmail: 'hello@joshuagen.org',
    contactPhone: '+1 (555) 123-4567',
    contactAddress: '42 Kingdom Way,\nJerusalem, Israel',
    socialFacebook: '#',
    socialTwitter: '#',
    socialInstagram: '#',
    socialYoutube: '#'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const cached = localStorage.getItem('jg_cache_public_settings');
        if (cached) setSettings(JSON.parse(cached));
        
        const data = await api.getPublicSettings();
        setSettings(data);
        localStorage.setItem('jg_cache_public_settings', JSON.stringify(data));
      } catch (err) {
        console.error('Failed to load public settings:', err);
      }
    };
    fetchSettings();
  }, []);
  const handleLinkClick = (name: string, href: string, e: React.MouseEvent) => {
    if (onNavigate) {
      if (name === 'Sermons') {
        e.preventDefault();
        onNavigate('sermons');
      } else if (name === 'Books') {
        e.preventDefault();
        onNavigate('books');
      } else if (name === 'Blog') {
        e.preventDefault();
        onNavigate('blog');
      } else if (name === 'Donate') {
        e.preventDefault();
        onNavigate('donate');
      } else if (href.startsWith('#')) {
        e.preventDefault();
        onNavigate('home');
        setTimeout(() => {
          const element = document.getElementById(href.replace('#', ''));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  return (
    <footer className="relative mt-24">
      {/* Background Container (overflow hidden so orbs don't spill out, but doesn't clip the newsletter card above) */}
      <div className="absolute inset-0 bg-gradient-to-b from-royal-blue-900 to-slate-950 overflow-hidden rounded-t-[2.5rem]">
        {/* Decorative Blur Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-royal-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-600/10 rounded-full blur-[100px] pointer-events-none" />
      </div>

      {/* Floating Newsletter Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 mb-16 z-10">
        <div className="bg-royal-blue-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-royal-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Stay Connected</h3>
            <p className="text-royal-blue-100 text-sm">
              Subscribe to receive daily devotionals, event updates, and ministry news.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1 max-w-md">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Name (optional)"
                disabled={status === 'loading' || status === 'success'}
                className="w-full px-5 py-3.5 rounded-xl bg-royal-blue-950/50 border border-royal-blue-400/30 text-white placeholder-royal-blue-200/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm shadow-inner disabled:opacity-50"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={status === 'loading' || status === 'success'}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-royal-blue-950/50 border border-royal-blue-400/30 text-white placeholder-royal-blue-200/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm shadow-inner disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="px-6 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 text-royal-blue-950 rounded-xl font-bold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
                >
                  {status === 'loading' ? 'Sending...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
                  {status !== 'loading' && status !== 'success' && <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </div>
            </div>
            {message && (
              <p className={`mt-2 text-xs font-medium ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 z-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand & Socials */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('home');
              }}
              className="flex items-center gap-3 mb-6 group inline-flex"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center shadow-lg shadow-royal-blue-500/30 transition-transform duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">J</span>
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                Joshua<span className="text-gold-500">Gen</span>
              </span>
            </a>
            <p className="text-royal-blue-100/80 text-sm leading-relaxed mb-8 pr-4">
              A digital ministry platform dedicated to raising a generation of believers who know God,
              walk in purpose, and transform their world.
            </p>
            <div className="flex items-center gap-3">
              {[
                { name: 'Facebook', url: settings.socialFacebook },
                { name: 'Twitter', url: settings.socialTwitter },
                { name: 'Instagram', url: settings.socialInstagram },
                { name: 'YouTube', url: settings.socialYoutube }
              ].filter(s => s.url && s.url !== '#').map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-royal-blue-800/40 border border-royal-blue-700/50 flex items-center justify-center hover:bg-gold-500 hover:border-gold-400 text-royal-blue-200 hover:text-royal-blue-950 transition-all duration-300 hover:scale-110 shadow-lg"
                  aria-label={social.name}
                >
                  <span className="text-sm font-bold">{social.name.charAt(0)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-gold-500 mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-gold-500/50"></span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.name, link.href, e)}
                    className="text-royal-blue-100/80 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold-500/0 group-hover:bg-gold-500 transition-colors"></span>
                    <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-gold-500 mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-gold-500/50"></span>
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-royal-blue-100/80 text-sm group">
                <div className="p-2 rounded-xl bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors">
                  <Mail className="w-4 h-4 text-gold-500" />
                </div>
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a>
              </li>
              <li className="flex items-center gap-3 text-royal-blue-100/80 text-sm group">
                <div className="p-2 rounded-xl bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-gold-500" />
                </div>
                <a href={`tel:${settings.contactPhone?.replace(/[^0-9+]/g, '')}`} className="hover:text-white transition-colors">{settings.contactPhone}</a>
              </li>
              <li className="flex items-start gap-3 text-royal-blue-100/80 text-sm group">
                <div className="p-2 rounded-xl bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors mt-0.5">
                  <MapPin className="w-4 h-4 text-gold-500" />
                </div>
                <span className="group-hover:text-white transition-colors whitespace-pre-line">{settings.contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-royal-blue-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-royal-blue-200/60">
            <p className="font-medium">© {new Date().getFullYear()} Joshua Generation. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
            <p className="flex items-center gap-1.5 font-medium">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" /> for His glory
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
