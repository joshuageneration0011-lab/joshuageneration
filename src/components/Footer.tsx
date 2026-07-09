import { Heart, Mail, MapPin, Phone, Send } from 'lucide-react';

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
    <footer className="relative bg-gray-900 text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">Stay Connected</h3>
            <p className="text-gray-400 text-sm mb-6">
              Subscribe to receive daily devotionals, event updates, and ministry news.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-all text-sm"
              />
              <button className="px-6 py-3.5 bg-gold-500 text-gray-900 rounded-xl font-semibold text-sm hover:bg-gold-400 transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="font-bold text-lg">
                Joshua<span className="text-gold-500">Gen</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              A digital ministry platform dedicated to raising a generation of believers who know God,
              walk in purpose, and transform their world.
            </p>
            <div className="flex items-center gap-3">
              {[
                { name: 'Facebook', url: '#' },
                { name: 'Twitter', url: '#' },
                { name: 'Instagram', url: '#' },
                { name: 'YouTube', url: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gold-500/20 hover:text-gold-400 transition-all duration-200 text-gray-400"
                >
                  <span className="text-xs font-bold">{social.name.charAt(0)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(link.name, link.href, e)}
                    className="text-gray-400 hover:text-gold-400 text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Branches */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Our Branches</h4>
            <ul className="space-y-2.5">
              {branches.map((branch) => (
                <li key={branch} className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                  <span>{branch}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>hello@joshuagen.org</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <span>42 Kingdom Way, Jerusalem, Israel</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© 2025 Joshua Generation. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
            </div>
            <p className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> for His glory
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
