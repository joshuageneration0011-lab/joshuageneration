import { useState, useEffect } from 'react';
import { FileText, Scale, ArrowLeft, Mail, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';

interface TermsOfServicePageProps {
  onBack: () => void;
}

const LOCAL_DEFAULT_TERMS = {
  acceptance: "These Terms of Service govern your access to and use of the website joshuageneration.com, including all audio streams, digital literature libraries, daily devotional newsletters, admin control suites, and donation systems.\n\nBy accessing, browsing, downloading books, or registering an account, you affirm that you have read, understood, and agreed to be legally bound by these terms. If you do not agree, please discontinue using our digital platforms.",
  offerings: "Joshua Generation is a digital ministry offering gospel teachings, prayer platforms, and faith-building publications. Services provided include:\n\n* Sermon Streams: On-demand sermon audio and video playback, and live radio broadcasting via Mixlr embeddings.\n* Books Library: Interactive online reading panel and download portals for books authored by Apostle Joshua Iyemifokhae.\n* Devotional Newsletter: Subscription-based messages and prayer updates.\n* Prayer Wall: Community boards to share testimonies and intercessory prayer requests.\n\nWe reserve the right to modify, suspend, or restrict any segment of these offerings at our discretion and without prior notice.",
  downloads: "All digital books, devotional studies, and sermon outlines offered on the site are protected by copyright. When you download a digital book:\n\nPersonal & Small Group License Only: You are granted a non-exclusive, non-transferable, revocable license to access and read the books for personal development or small group study. You may not print copies for commercial resale, translate the material without written permission, or publish files on other public file shares.",
  giving: "Partnership pledges and seed sowings support missions, local church building, charity outreaches, and digital broadcasting equipment.\n\n* Voluntary Contributions: All monetary donations, seed sowings, and partnership contributions made online or through third-party platforms are entirely voluntary.\n* Refund Policy: In line with standard charitable giving rules, all sowings and partnership gifts represent irreversible donations to the ministry and are non-refundable.\n* Secure Payment: You agree to provide true, accurate, and authorized credit card or bank details to our payment gateway. We are not liable for transaction errors caused by third-party processors.",
  conduct: "As a faith-based digital sanctuary, we maintain a standard of respect, kindness, and spiritual integrity. Users agree not to:\n\n* Post spam, advertising, or promotional solicitations on the Prayer Wall or comments.\n* Harass, insult, or post hateful comments targeting other community members.\n* Attempt to bypass administration login parameters, execute DDoS attacks, or inject malicious scripts.\n* Impersonate Apostle Joshua Iyemifokhae, Joshua Generation ministry leaders, or administrators.\n\nViolations will result in permanent suspension of access and IP ban without warning.",
  copyright: "The logo, design components, site illustrations, audio tracks, written daily devotionals, sermons, and digital books are the exclusive property of Joshua Generation Ministry and Apostle Joshua Iyemifokhae.\n\nYou may not duplicate, copy, screen-record, edit, or modify any media assets from this website for use in commercial applications or other ministry websites without express written consent.",
  disclaimer: "Our services, sermons, broadcasts, and literature are provided on an \"as is\" and \"as available\" basis, without any warranties of any kind, whether express or implied.\n\nJoshua Generation Ministry, including its leaders, speakers, volunteers, and technical developers, will not be liable for any direct or indirect damages resulting from: network outages, loss of audio playback sync, data breaches via third-party libraries, book download download failure, or reliance on information presented within devotionals and blogs.",
  governing: "These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which the ministry is headquarted, without regard to conflict of laws principles.\n\nAny dispute arising from these terms or your use of this digital portal shall be resolved through friendly dialogue first. If unresolved, disputes will be settled within local arbitration tribunals."
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
            <div key={idx} className="p-4 rounded-xl bg-gray-55/50 border border-gray-100 space-y-2 my-2">
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

export default function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
  const [termsOfService, setTermsOfService] = useState('');

  useEffect(() => {
    api.getPublicSettings()
      .then(data => {
        if (data && data.termsOfService) {
          setTermsOfService(data.termsOfService);
        }
      })
      .catch(err => console.error('Failed to load terms of service:', err));
  }, []);

  const isHtml = termsOfService && !termsOfService.trim().startsWith('{');

  let sectionsData = LOCAL_DEFAULT_TERMS;
  try {
    if (termsOfService && !isHtml) {
      sectionsData = JSON.parse(termsOfService);
    }
  } catch (e) {
    console.warn('Failed to parse terms sections:', e);
  }

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'offerings', title: '2. Ministry Digital Offerings' },
    { id: 'downloads', title: '3. Digital Products & Books' },
    { id: 'giving', title: '4. Giving & Partnership' },
    { id: 'conduct', title: '5. Community Code of Conduct' },
    { id: 'copyright', title: '6. Copyright & IP Ownership' },
    { id: 'disclaimer', title: '7. Disclaimer & Liability' },
    { id: 'governing', title: '8. Governing Law' }
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
              <Scale className="w-3.5 h-3.5 text-gold-500" />
              Terms & Conditions
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-cormorant">
              Terms of Service
            </h1>
            <p className="text-royal-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              These terms govern your usage of the Joshua Generation Digital Portal. By using our website, reading books, listening to sermons, or sowed seeds, you enter a covenant of compliance with these guidelines.
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

            {/* Support Info */}
            <div className="bg-gradient-to-br from-royal-blue-50 to-white rounded-2xl border border-royal-blue-100/50 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-royal-blue-500/10 flex items-center justify-center text-royal-blue-600 mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">Have Questions?</h4>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                Our support team is available to assist with resource access, login complications, book downloads, or partnership concerns.
              </p>
              <a
                href="mailto:hello@joshuagen.org"
                className="inline-flex items-center gap-2 text-xs font-bold text-royal-blue-600 hover:text-royal-blue-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Ministry Office
              </a>
            </div>
          </aside>

          {/* Policy Text Column */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/60 p-6 sm:p-10 shadow-sm space-y-12">
            {isHtml ? (
              <div 
                className="prose max-w-none text-gray-600 text-sm sm:text-base leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: termsOfService }}
              />
            ) : (
              <>
                {/* Section 1 */}
                <section id="acceptance" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      1
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Acceptance of Terms
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.acceptance)}
                </section>

                {/* Section 2 */}
                <section id="offerings" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      2
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Ministry Digital Offerings
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.offerings)}
                </section>

                {/* Section 3 */}
                <section id="downloads" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      3
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Digital Products & Books
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.downloads)}
                </section>

                {/* Section 4 */}
                <section id="giving" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      4
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Giving & Partnership
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.giving)}
                </section>

                {/* Section 5 */}
                <section id="conduct" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      5
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Community Code of Conduct
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.conduct)}
                </section>

                {/* Section 6 */}
                <section id="copyright" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      6
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Copyright & IP Ownership
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.copyright)}
                </section>

                {/* Section 7 */}
                <section id="disclaimer" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      7
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Disclaimer & Liability
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.disclaimer)}
                </section>

                {/* Section 8 */}
                <section id="governing" className="space-y-4 scroll-mt-28">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                      8
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                      Governing Law
                    </h2>
                  </div>
                  {renderFormattedContent(sectionsData.governing)}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
