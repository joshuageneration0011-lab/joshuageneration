import { useState, useEffect } from 'react';
import { Shield, Lock, ArrowLeft, Mail, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const LOCAL_DEFAULT_PRIVACY = {
  introduction: "This Privacy Policy applies to the digital ministry platforms operated by Joshua Generation Ministry under the spiritual leadership of Apostle Joshua Iyemifokhae. This includes our website, mobile interface, streaming services (Radio and Podcast), newsletter distributions, digital libraries, and online donation channels.\n\nBy visiting our website or using any of our resources, you agree to the collection, use, and handling of information as described in this policy. We prioritize your privacy and will never sell or exploit your data.",
  collection: "To provide a tailored spiritual growth experience and support our operations, we collect the following types of information:\n\nA. Personal Information: Names, email addresses, phone numbers, and optional prayer request information that you provide when subscribing to devotionals, asking for prayers, or registering as a partner.\n\nB. Donation & Payment Data: We collect billing names and transaction records for transparency. All credit card or banking details are processed through secure, PCI-DSS compliant payment gateways (e.g. Stripe, Selar, or Flutterwave). We do not store your financial details.\n\nC. Technical & Interaction Logs: IP addresses, browser details, page interactions, radio player stream metrics, audio buffering latency, and digital book progress. This helps us ensure server stability and app performance.\n\nD. Notification Settings: Preferences regarding push notifications, daily devotional timings, and newsletter topics.",
  usage: "The data we collect is strictly used to serve our community, including:\n\n* Spiritual Resources: Sending your daily devotionals, newsletter digests, and keeping your book reading progress active.\n* Partnerships & Donations: Securing, tracking, and confirming your seeds and partnership declarations.\n* Live Broadcasts: Maintaining connections to our Mixlr radio embed and podcasts, and notifying you when Apostle Joshua Iyemifokhae is live.\n* Continuous Improvement: Identifying server errors, speeding up book resource rendering, and refining navigation flow based on analytics.\n* Security & Anti-Fraud: Authenticating administrator sessions and blocking abusive attempts on our forms and portals.",
  protection: "We recognize our responsibility to protect your digital presence.\n\nCore Commitment: Joshua Generation will never sell, lease, rent, or trade your personal details to advertising agencies, lists, or commercial companies.\n\nInformation is only shared under these strict circumstances:\n\n* Service Providers: Sharing details with specialized companies facilitating payment gateways (e.g. Stripe, Selar), database persistence (e.g. Supabase, PostgreSQL host), or newsletter distribution (e.g. Mailchimp, SendGrid) solely to perform actions on our behalf.\n* Legal Requirement: When obliged to comply with lawful warrants, court orders, or regulations.",
  cookies: "We utilize cookies and standard web storage objects to maintain session credentials, remember volume settings on our audio players, store cache data, and recognize your device for secure admin dashboard entry.\n\nFor in-depth details on cookie categories and opt-out routes, please view our comprehensive Cookie Policy.",
  rights: "You are in control of your personal data. You possess the right to:\n\n* Access & Copy: Request details of the personal data we hold about you.\n* Update & Edit: Request corrections to any outdated or inaccurate name, email, or telephone listings.\n* Erasure (Right to be Forgotten): Request the full deletion of your record, including subscription listings.\n* Opt-Out: Click the \"Unsubscribe\" button in any newsletter email to halt further updates instantly.",
  contact: "For any privacy questions, security concerns, data deletion requests, or explanations of how we protect your personal information, please reach out to our privacy administration:\n\nJoshua Generation Administration\nEmail: hello@joshuagen.org\nResponse Window: 24 - 48 Hours"
};

function renderFormattedContent(text: string) {
  if (!text) return null;
  const blocks = text.split(/\r?\n\r?\n+/).filter(Boolean);
  
  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        const clean = block.trim();
        
        // 1. Core Commitment / License Card
        if (clean.toLowerCase().startsWith('core commitment:') || clean.toLowerCase().startsWith('personal & small group license only')) {
          const isCommitment = clean.toLowerCase().startsWith('core commitment:');
          return (
            <div 
              key={idx} 
              className={isCommitment 
                ? "bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl my-4"
                : "bg-royal-blue-50/50 border border-royal-blue-100 p-4 rounded-xl my-4 space-y-2 text-xs sm:text-sm"
              }
            >
              <p className={isCommitment 
                ? "text-xs sm:text-sm text-amber-900 font-semibold font-sans"
                : "font-bold text-royal-blue-900 font-sans"
              }>
                {isCommitment ? clean : "Personal & Small Group License Only"}
              </p>
              {!isCommitment && (
                <p className="text-gray-600 font-sans">
                  {clean.substring("personal & small group license only".length).replace(/^[:\s]*/, '')}
                </p>
              )}
            </div>
          );
        }
        
        // 2. Grid Cards (A., B., C., D.)
        if (clean.startsWith('A. ') || clean.startsWith('B. ') || clean.startsWith('C. ') || clean.startsWith('D. ')) {
          const colonIdx = clean.indexOf(':');
          let title = '';
          let content = clean;
          if (colonIdx > 0 && colonIdx < 40) {
            title = clean.substring(0, colonIdx).trim();
            content = clean.substring(colonIdx + 1).trim();
          }
          return (
            <div key={idx} className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2 my-2">
              {title ? <h4 className="font-bold text-gray-800 text-sm font-sans">{title}</h4> : null}
              <p className="text-xs text-gray-500 leading-relaxed font-sans">{content}</p>
            </div>
          );
        }
        
        // 3. Bullet List (block with lines starting with - or *)
        if (clean.split('\n').some(line => line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•'))) {
          const items = clean.split('\n').map(item => item.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
          return (
            <ul key={idx} className="space-y-2.5 pl-5 list-disc text-sm text-gray-600 leading-relaxed my-2">
              {items.map((item, i) => {
                const colonIdx = item.indexOf(':');
                if (colonIdx > 0 && colonIdx < 30) {
                  const prefix = item.substring(0, colonIdx).trim();
                  const rest = item.substring(colonIdx + 1).trim();
                  return (
                    <li key={i}>
                      <strong>{prefix}:</strong> {rest}
                    </li>
                  );
                }
                return <li key={i}>{item}</li>;
              })}
            </ul>
          );
        }
        
        // 4. Contact Information Card
        if (clean.includes('Email:') && clean.includes('Joshua Generation Administration')) {
          const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
          return (
            <div key={idx} className="mt-4 p-5 rounded-2xl bg-royal-blue-50/30 border border-royal-blue-100/50 max-w-md space-y-2">
              <p className="font-bold text-gray-800 text-sm font-sans">{lines[0]}</p>
              {lines.slice(1).map((line, i) => (
                <p key={i} className="text-xs text-gray-500 font-sans">{line}</p>
              ))}
            </div>
          );
        }
        
        // 5. Default Paragraph
        return (
          <p key={idx} className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {clean}
          </p>
        );
      })}
    </div>
  );
}

export default function PrivacyPolicyPage({ onBack }: PrivacyPolicyPageProps) {
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  useEffect(() => {
    api.getPublicSettings()
      .then(data => {
        if (data && data.privacyPolicy) {
          setPrivacyPolicy(data.privacyPolicy);
        }
      })
      .catch(err => console.error('Failed to load privacy policy:', err));
  }, []);

  const isHtml = privacyPolicy && !privacyPolicy.trim().startsWith('{');
  
  let sectionsData = LOCAL_DEFAULT_PRIVACY;
  try {
    if (privacyPolicy && !isHtml) {
      sectionsData = JSON.parse(privacyPolicy);
    }
  } catch (e) {
    console.warn('Failed to parse privacy sections:', e);
  }

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
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="py-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-royal-blue-600 transition-colors mb-8 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </button>

        {/* Hero Section */}
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
            {!isHtml && (
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
            )}

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
            {isHtml ? (
              <div 
                className="prose max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: privacyPolicy }}
              />
            ) : (
              <>
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
                  {renderFormattedContent(sectionsData.introduction)}
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
                  {renderFormattedContent(sectionsData.collection)}
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
                  {renderFormattedContent(sectionsData.usage)}
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
                  {renderFormattedContent(sectionsData.protection)}
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
                  {renderFormattedContent(sectionsData.cookies)}
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
                  {renderFormattedContent(sectionsData.rights)}
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
                  {renderFormattedContent(sectionsData.contact)}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
