import { useState, useRef } from 'react';
import { Mail, User, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/utils/api';
import CaptchaChallenge, { CaptchaChallengeRef } from './CaptchaChallenge';

interface SouthAfricaUpdatesPageProps {
  onBack: () => void;
}

export default function SouthAfricaUpdatesPage({ onBack }: SouthAfricaUpdatesPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const captchaRef = useRef<CaptchaChallengeRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (captchaRef.current && !captchaRef.current.isValid()) {
      setStatus('error');
      setErrorMessage('Please solve the verification math challenge correctly.');
      return;
    }

    const payload = captchaRef.current?.getPayload();

    setStatus('submitting');
    try {
      const res = await api.subscribeSANewsletter(email.trim(), name.trim() || undefined, payload);
      if (res.success) {
        setStatus('success');
        setName('');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(res.message || res.error || 'Failed to subscribe. Please try again.');
        captchaRef.current?.reset();
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred. Please try again.');
      captchaRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Blur Background circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gold-500/5 blur-[100px] pointer-events-none" />

      {/* Navigation Helper */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-200/40 hover:bg-slate-200/80 border border-slate-200/60 transition-all text-xs font-semibold cursor-pointer border-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border border-slate-200/80 shadow-md relative group overflow-hidden">
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="https://joshuasgeneration.com/favicon.png"
              alt="Logo"
              className="w-12 h-12 object-contain relative z-10 filter drop-shadow-sm"
            />
            {/* SA Flag Badge */}
            <span className="absolute bottom-1 right-1 text-2xl filter drop-shadow-sm" title="South Africa">🇿🇦</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight flex flex-col gap-1">
            <span>Joshua's <span className="text-gold-650">Generation</span></span>
            <span className="text-xs text-emerald-600 uppercase tracking-widest font-bold mt-1">South Africa updates 🇿🇦</span>
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-sm">
            Join our South African family to receive updates, Zoom invitations, and meeting details directly from Apostle Joshua Iyemifokhae.
          </p>
        </div>

        {/* Signup Card */}
        <div className="mt-8">
          <div className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow-xl rounded-3xl border border-slate-200/60 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-250 to-transparent" />

            {status === 'success' ? (
              <div className="text-center py-6 animate-scale-up">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-md">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">Welcome Aboard!</h3>
                <p className="mt-2 text-sm text-slate-600 px-4">
                  You have successfully subscribed to Joshua's Generation South Africa updates list. Please check your inbox for our welcome message!
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer border-none"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <CaptchaChallenge ref={captchaRef} onVerify={setIsCaptchaValid} theme="light" />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting' || !email || !isCaptchaValid}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    {status === 'submitting' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <span>Join SA updates 🇿🇦</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
