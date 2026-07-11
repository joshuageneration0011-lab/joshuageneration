import React from 'react';
import { Heart, Mail, MapPin, Phone, Send } from 'lucide-react';
import { cn } from '@/utils/cn';

const quickLinks = [
  { name: 'Sermons', href: '/sermons' },
  { name: 'Books', href: '/books' },
  { name: 'Blog', href: '/blog' },
  { name: 'Events', href: '#events' },
  { name: 'Prayer Requests', href: '#prayer' },
  { name: 'Donate', href: '/donate' },
  { name: 'Careers', href: '#' },
];

const branches = [
  'Jerusalem Headquarters',
  'Nairobi, Kenya',
  'London, UK',
  'New York, USA',
  'Lagos, Nigeria',
  'Sydney, Australia',
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
      {/* Background with Royal Blue Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-royal-blue-900 to-slate-950 pointer-events-none -z-10" />
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-royal-blue-600/20 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Floating Newsletter Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-20 mb-16 z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-royal-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Stay Connected</h3>
            <p className="text-royal-blue-100 text-sm">
              Subscribe to receive daily devotionals, event updates, and ministry news.
            </p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-royal-blue-950/50 border border-royal-blue-400/30 text-white placeholder-royal-blue-200/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm shadow-inner"
            />
            <button className="px-6 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 text-royal-blue-950 rounded-xl font-bold text-sm shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:scale-105 transition-all flex items-center justify-center gap-2 group">
              Subscribe
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 z-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
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
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
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

          {/* Branches */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-gold-500 mb-6 flex items-center gap-2">
              <span className="w-8 h-px bg-gold-500/50"></span>
              Our Branches
            </h4>
            <ul className="space-y-3">
              {branches.map((branch) => (
                <li key={branch} className="flex items-start gap-3 text-royal-blue-100/80 text-sm group">
                  <div className="mt-1 p-1 rounded-full bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors">
                    <MapPin className="w-3 h-3 text-gold-500" />
                  </div>
                  <span className="group-hover:text-white transition-colors">{branch}</span>
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
                <a href="mailto:hello@joshuagen.org" className="hover:text-white transition-colors">hello@joshuagen.org</a>
              </li>
              <li className="flex items-center gap-3 text-royal-blue-100/80 text-sm group">
                <div className="p-2 rounded-xl bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-gold-500" />
                </div>
                <a href="tel:+15551234567" className="hover:text-white transition-colors">+1 (555) 123-4567</a>
              </li>
              <li className="flex items-start gap-3 text-royal-blue-100/80 text-sm group">
                <div className="p-2 rounded-xl bg-royal-blue-800/40 group-hover:bg-gold-500/20 transition-colors mt-0.5">
                  <MapPin className="w-4 h-4 text-gold-500" />
                </div>
                <span className="group-hover:text-white transition-colors">42 Kingdom Way,<br/>Jerusalem, Israel</span>
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
