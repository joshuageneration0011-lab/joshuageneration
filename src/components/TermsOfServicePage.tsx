import { FileText, Scale, ArrowLeft, Mail, ChevronRight } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
}

export default function TermsOfServicePage({ onBack }: TermsOfServicePageProps) {
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
              <Scale className="w-3.5 h-3.5 text-gold-500" />
              Terms of Use
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-cormorant">
              Terms of Service
            </h1>
            <p className="text-royal-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              By accessing the digital ministry portals, newsletters, streams, and resources of Joshua Generation, you agree to comply with and be bound by the following terms and guidelines.
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  These Terms of Service govern your access to and use of the website <strong>joshuageneration.com</strong>, including all audio streams, digital literature libraries, daily devotional newsletters, admin control suites, and donation systems.
                </p>
                <p>
                  By accessing, browsing, downloading books, or registering an account, you affirm that you have read, understood, and agreed to be legally bound by these terms. If you do not agree, please discontinue using our digital platforms.
                </p>
              </div>
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  Joshua Generation is a digital ministry offering gospel teachings, prayer platforms, and faith-building publications. Services provided include:
                </p>
                <ul className="space-y-2 pl-5 list-disc text-sm">
                  <li><strong>Sermon Streams:</strong> On-demand sermon audio and video playback, and live radio broadcasting via Mixlr embeddings.</li>
                  <li><strong>Books Library:</strong> Interactive online reading panel and download portals for books authored by Apostle Joshua Iyemifokhae.</li>
                  <li><strong>Devotional Newsletter:</strong> Subscription-based messages and prayer updates.</li>
                  <li><strong>Prayer Wall:</strong> Community boards to share testimonies and intercessory prayer requests.</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or restrict any segment of these offerings at our discretion and without prior notice.
                </p>
              </div>
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  All digital books, devotional studies, and sermon outlines offered on the site are protected by copyright. When you download a digital book:
                </p>
                <div className="bg-royal-blue-50/50 border border-royal-blue-100 p-4 rounded-xl my-4 space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-royal-blue-900">Personal & Small Group License Only</p>
                  <p className="text-gray-600">
                    You are granted a non-exclusive, non-transferable, revocable license to access and read the books for personal development or small group study. You may not print copies for commercial resale, translate the material without written permission, or publish files on other public file shares.
                  </p>
                </div>
              </div>
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  Partnership pledges and seed sowings support missions, local church building, charity outreaches, and digital broadcasting equipment.
                </p>
                <ul className="space-y-2.5 pl-5 list-disc text-sm">
                  <li><strong>Voluntary Contributions:</strong> All monetary donations, seed sowings, and partnership contributions made online or through third-party platforms are entirely voluntary.</li>
                  <li><strong>Refund Policy:</strong> In line with standard charitable giving rules, all sowings and partnership gifts represent irreversible donations to the ministry and are <strong>non-refundable</strong>.</li>
                  <li><strong>Secure Payment:</strong> You agree to provide true, accurate, and authorized credit card or bank details to our payment gateway. We are not liable for transaction errors caused by third-party processors.</li>
                </ul>
              </div>
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  As a faith-based digital sanctuary, we maintain a standard of respect, kindness, and spiritual integrity. Users agree not to:
                </p>
                <ul className="space-y-2 pl-5 list-disc text-sm">
                  <li>Post spam, advertising, or promotional solicitations on the Prayer Wall or comments.</li>
                  <li>Harass, insult, or post hateful comments targeting other community members.</li>
                  <li>Attempt to bypass administration login parameters, execute DDoS attacks, or inject malicious scripts.</li>
                  <li>Impersonate Apostle Joshua Iyemifokhae, Joshua Generation ministry leaders, or administrators.</li>
                </ul>
                <p>
                  Violations will result in permanent suspension of access and IP ban without warning.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="copyright" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  6
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Copyright & Intellectual Property
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  The logo, design components, site illustrations, audio tracks, written daily devotionals, sermons, and digital books are the exclusive property of <strong>Joshua Generation Ministry</strong> and Apostle Joshua Iyemifokhae. 
                </p>
                <p>
                  You may not duplicate, copy, screen-record, edit, or modify any media assets from this website for use in commercial applications or other ministry websites without express written consent.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="disclaimer" className="space-y-4 scroll-mt-28">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-royal-blue-50 flex items-center justify-center text-royal-blue-600 font-bold text-sm">
                  7
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-cormorant">
                  Disclaimer & Limitation of Liability
                </h2>
              </div>
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3 text-justify">
                <p>
                  Our services, sermons, broadcasts, and literature are provided on an "as is" and "as available" basis, without any warranties of any kind, whether express or implied.
                </p>
                <p>
                  Joshua Generation Ministry, including its leaders, speakers, volunteers, and technical developers, will not be liable for any direct or indirect damages resulting from: network outages, loss of audio playback sync, data breaches via third-party libraries, book download download failure, or reliance on information presented within devotionals and blogs.
                </p>
              </div>
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
              <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-3">
                <p>
                  These Terms of Service are governed by and construed in accordance with the laws of the jurisdiction in which the ministry is headquarted, without regard to conflict of laws principles. 
                </p>
                <p>
                  Any dispute arising from these terms or your use of this digital portal shall be resolved through friendly dialogue first. If unresolved, disputes will be settled within local arbitration tribunals.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
