import { Cookie, Settings, Shield, Activity, ArrowLeft, Mail, ChevronRight } from 'lucide-react';

interface CookiePolicyPageProps {
  onBack: () => void;
}

export default function CookiePolicyPage({ onBack }: CookiePolicyPageProps) {
  const sections = [
    { id: 'definition', title: '1. What Are Cookies?' },
    { id: 'purpose', title: '2. How We Use Cookies' },
    { id: 'types', title: '3. Categories of Cookies Used' },
    { id: 'management', title: '4. Managing Cookie Settings' },
    { id: 'updates', title: '5. Policy Updates' }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-royal-blue-600 transition-colors mb-8 font-medium text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-200/60 shadow-sm cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>

        {/* Hero Banner Header */}
        <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-royal-blue-900 via-royal-blue-800 to-slate-950 p-8 sm:p-12 shadow-xl shadow-royal-blue-950/20 text-white">
          <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md text-gold-300 rounded-full text-xs font-semibold tracking-wide uppercase border border-white/10">
              <Cookie className="w-3.5 h-3.5 text-gold-500" />
              Cookie Preferences
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-cormorant">
              Cookie Policy
            </h1>
            <p className="text-royal-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              We use cookies and browser storage technologies to personalize your spiritual study dashboard, save playback configurations, and understand traffic patterns.
            </p>
            <p className="text-xs text-royal-blue-200/80 font-medium pt-2">
              Last Updated: July 21, 2026
            </p>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sticky Navigation Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                On This Page
              </h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:text-royal-blue-600 hover:bg-royal-blue-50/50 transition-all font-medium flex items-center justify-between group cursor-pointer"
                  >
                    <span>{section.title}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </nav>
            </div>

            {/* Privacy Promise */}
            <div className="bg-gradient-to-br from-royal-blue-50 to-white rounded-2xl border border-royal-blue-100/50 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-royal-blue-500/10 flex items-center justify-center text-royal-blue-600 mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">Privacy Guarantee</h4>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Cookies stored by our direct domain are secure and encrypted. We do not use advertising cookies to retarget you across other sites.
              </p>
              <a
                href="mailto:hello@joshuagen.org"
                className="inline-flex items-center gap-2 text-xs font-bold text-royal-blue-600 hover:text-royal-blue-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Tech Team
              </a>
            </div>
          </aside>

          {/* Policy Text Column */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-10 shadow-sm space-y-12">
            
            {/* Section 1 */}
            <section id="definition" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  What Are Cookies?
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  Cookies are tiny text files containing small amounts of information that are downloaded and saved to your computer, tablet, or smartphone when you visit a website. 
                </p>
                <p>
                  Additionally, we use browser-level storage objects (such as <strong>Local Storage</strong> and <strong>Session Storage</strong>). These storage methods reside directly in your browser, enabling faster resource rendering and offline support for digital books and cached sermon metadata.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="purpose" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  How We Use Cookies
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  Our primary objective is to make your interaction with Joshua Generation as seamless as possible. We use cookies and local storage to:
                </p>
                <ul className="space-y-2 pl-5 list-disc text-sm">
                  <li>Keep you authenticated in the Admin Dashboard without prompting for a login on every page view.</li>
                  <li>Enable "Speed of Light" page rendering by caching sermon archives, book directories, and newsletter settings on your local drive.</li>
                  <li>Remember volume and player dimensions on our audio player overlays and radio stream player controls.</li>
                  <li>Understand user numbers and stream activity so we can guarantee adequate bandwidth on broadcast days.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="types" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Categories of Cookies We Use
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-6">
                <div className="space-y-4">
                  {/* Category 1 */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-royal-blue-500/10 flex items-center justify-center text-royal-blue-600 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-800 text-sm">A. Essential / Necessary Cookies</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        These cookies and session items are vital for accessing secure components of the site, such as admin controls or newsletter registration handlers. Deactivation prevents access to dashboard tabs.
                      </p>
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-600 shrink-0">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-800 text-sm">B. Preference & Cache Storage</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        We save local cache records like `jg_cache_sermons` and `jg_cache_books` in Local Storage. This allows sermons and books to show up instantly on slow networks while fresh copies are fetched in the background.
                      </p>
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-800 text-sm">C. Performance & Third-Party Integrations</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        We use streaming services like Mixlr for the audio radio player. Mixlr sets cookies to manage audio streams, maintain listening metrics, and handle player widgets. Secure donation frames (e.g. Selar or Stripe) also use cookies to prevent fraudulent card actions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="management" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  4
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Managing Cookie Settings
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  Most browsers allow you to manage cookie options through setting panels. You can configure your browser to reject cookies, request permissions before saving, or wipe your browser cache on close.
                </p>
                <p>
                  Please note: Disabling essential cookies or clearing Local Storage will log you out of your administration panels, reset volume settings, and result in slightly slower load times on initial entry.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section id="updates" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  5
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Policy Updates
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  We may periodically update our Cookie Policy to match changes in technical services or legal frameworks. Any changes will be indicated by updating the "Last Updated" date at the top of this page.
                </p>
                <p>
                  If you have technical questions regarding cookies, storage keys, or secure streams, feel free to contact us at <a href="mailto:hello@joshuagen.org" className="text-royal-blue-600 font-semibold hover:underline">hello@joshuagen.org</a>.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
