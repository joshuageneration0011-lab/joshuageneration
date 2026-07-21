import { Shield, Lock, ArrowLeft, Mail, ChevronRight } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export default function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  const sections = [
    { id: 'introduction', title: '1. Introduction & Scope' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Use Your Information' },
    { id: 'protection', title: '4. Data Protection & Sharing' },
    { id: 'cookies-brief', title: '5. Cookies & Tracking' },
    { id: 'rights', title: '6. Your Rights & Control' },
    { id: 'contact', title: '7. Contact & Support' }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Account for fixed headers if any
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
              <Shield className="w-3.5 h-3.5 text-gold-500" />
              Privacy & Security
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-cormorant">
              Privacy Policy
            </h1>
            <p className="text-royal-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              At Joshua Generation, your trust is sacred. We are committed to protecting your personal data and respecting your privacy as you engage with our digital ministry platform, sermons, books, radio streams, and devotionals.
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

            {/* Quick Contact Card */}
            <div className="bg-gradient-to-br from-royal-blue-50 to-white rounded-2xl border border-royal-blue-100/50 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-royal-blue-500/10 flex items-center justify-center text-royal-blue-600 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">Your Data is Secure</h4>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                We implement industry-standard security and encryption protocols to protect your personal details, donation channels, and study progress.
              </p>
              <a
                href="mailto:hello@joshuagen.org"
                className="inline-flex items-center gap-2 text-xs font-bold text-royal-blue-600 hover:text-royal-blue-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Privacy Officer
              </a>
            </div>
          </aside>

          {/* Policy Text Column */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-10 shadow-sm space-y-12">
            
            {/* Section 1 */}
            <section id="introduction" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Introduction & Scope
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  This Privacy Policy applies to the digital ministry platforms operated by <strong>Joshua Generation Ministry</strong> under the spiritual leadership of <strong>Apostle Joshua Iyemifokhae</strong>. This includes our website, mobile interface, streaming services (Radio and Podcast), newsletter distributions, digital libraries, and online donation channels.
                </p>
                <p>
                  By visiting our website or using any of our resources, you agree to the collection, use, and handling of information as described in this policy. We prioritize your privacy and will never sell or exploit your data.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="collection" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Information We Collect
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  To provide a tailored spiritual growth experience and support our operations, we collect the following types of information:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-800 text-sm">A. Personal Information</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Names, email addresses, phone numbers, and optional prayer request information that you provide when subscribing to devotionals, asking for prayers, or registering as a partner.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-800 text-sm">B. Donation & Payment Data</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      We collect billing names and transaction records for transparency. All credit card or banking details are processed through secure, PCI-DSS compliant payment gateways (e.g. Stripe, Selar, or Flutterwave). We do not store your financial details.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-800 text-sm">C. Technical & Interaction Logs</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      IP addresses, browser details, page interactions, radio player stream metrics, audio buffering latency, and digital book progress. This helps us ensure server stability and app performance.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
                    <h4 className="font-bold text-gray-800 text-sm">D. Notification Settings</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Preferences regarding push notifications, daily devotional timings, and newsletter topics.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="usage" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  How We Use Your Information
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  The data we collect is strictly used to serve our community, including:
                </p>
                <ul className="space-y-2.5 pl-5 list-disc text-sm">
                  <li><strong>Spiritual Resources:</strong> Sending your daily devotionals, newsletter digests, and keeping your book reading progress active.</li>
                  <li><strong>Partnerships & Donations:</strong> Securing, tracking, and confirming your seeds and partnership declarations.</li>
                  <li><strong>Live Broadcasts:</strong> Maintaining connections to our Mixlr radio embed and podcasts, and notifying you when Apostle Joshua Iyemifokhae is live.</li>
                  <li><strong>Continuous Improvement:</strong> Identifying server errors, speeding up book resource rendering, and refining navigation flow based on analytics.</li>
                  <li><strong>Security & Anti-Fraud:</strong> Authenticating administrator sessions and blocking abusive attempts on our forms and portals.</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="protection" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  4
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Data Protection & Sharing
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  We recognize our responsibility to protect your digital presence. 
                </p>
                <div className="bg-amber-50 border-l-4 border-gold-500 p-4 rounded-r-xl my-4">
                  <p className="text-xs sm:text-sm text-gold-900 font-semibold">
                    Core Commitment: Joshua Generation will never sell, lease, rent, or trade your personal details to advertising agencies, lists, or commercial companies.
                  </p>
                </div>
                <p>
                  Information is only shared under these strict circumstances:
                </p>
                <ul className="space-y-2 pl-5 list-disc text-sm">
                  <li><strong>Service Providers:</strong> Sharing details with specialized companies facilitating payment gateways (e.g. Stripe, Selar), database persistence (e.g. Supabase, PostgreSQL host), or newsletter distribution (e.g. Mailchimp, SendGrid) solely to perform actions on our behalf.</li>
                  <li><strong>Legal Requirement:</strong> When obliged to comply with lawful warrants, court orders, or regulations.</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="cookies-brief" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  5
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Cookies & Tracking
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  We utilize cookies and standard web storage objects to maintain session credentials, remember volume settings on our audio players, store cache data, and recognize your device for secure admin dashboard entry.
                </p>
                <p>
                  For in-depth details on cookie categories and opt-out routes, please view our comprehensive <span className="text-royal-blue-600 font-semibold underline cursor-pointer">Cookie Policy</span>.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="rights" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  6
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Your Rights & Control
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  You are in control of your personal data. You possess the right to:
                </p>
                <ul className="space-y-2 pl-5 list-disc text-sm">
                  <li><strong>Access & Copy:</strong> Request details of the personal data we hold about you.</li>
                  <li><strong>Update & Edit:</strong> Request corrections to any outdated or inaccurate name, email, or telephone listings.</li>
                  <li><strong>Erasure (Right to be Forgotten):</strong> Request the full deletion of your record, including subscription listings.</li>
                  <li><strong>Opt-Out:</strong> Click the "Unsubscribe" button in any newsletter email to halt further updates instantly.</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="contact" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  7
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Contact & Support
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  For any privacy questions, security concerns, data deletion requests, or explanations of how we protect your personal information, please reach out to our privacy administration:
                </p>
                <div className="mt-4 p-5 rounded-2xl bg-royal-blue-50/30 border border-royal-blue-100/50 max-w-md space-y-2">
                  <p className="font-bold text-gray-800 text-sm">Joshua Generation Administration</p>
                  <p className="text-xs text-gray-500">Email: <a href="mailto:hello@joshuagen.org" className="text-royal-blue-600 font-semibold hover:underline">hello@joshuagen.org</a></p>
                  <p className="text-xs text-gray-500">Response Window: 24 - 48 Hours</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
