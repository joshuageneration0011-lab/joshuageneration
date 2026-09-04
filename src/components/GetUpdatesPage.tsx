import { useState, useRef } from 'react';
import { Mail, User, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/utils/api';
import CaptchaChallenge, { CaptchaChallengeRef } from './CaptchaChallenge';

interface GetUpdatesPageProps {
  onBack: () => void;
}

export default function GetUpdatesPage({ onBack }: GetUpdatesPageProps) {
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
      const res = await api.subscribeNewsletter(email.trim(), name.trim() || undefined, payload);
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Blur Background circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-royal-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gold-500/10 blur-[100px] pointer-events-none" />

      {/* Navigation Helper */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/15 backdrop-blur-md shadow-2xl relative group overflow-hidden">
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-royal-blue-500/20 to-gold-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="https://joshuasgeneration.com/favicon.png"
              alt="Logo"
              className="w-12 h-12 object-contain relative z-10 filter drop-shadow-md"
            />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight flex flex-col gap-1">
            <span>Joshua's <span className="text-gold-500">Generation</span></span>
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Join our global family to receive spiritual updates, Zoom mentorship invitations, and midnight prayer reminders.
          </p>
        </div>

        {/* Signup Card */}
        <div className="mt-8">
          <div className="bg-slate-900/60 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {status === 'success' ? (
              <div className="text-center py-6 animate-scale-up">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Welcome Aboard!</h3>
                <p className="mt-2 text-sm text-slate-400 px-4">
                  You have successfully subscribed to Joshua's Generation newsletter. Please check your inbox for our welcome message!
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-5 py-2.5 bg-royal-blue-600 hover:bg-royal-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-royal-blue-500/20 cursor-pointer"
                >
                  Subscribe another email
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="name-input"
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      id="email-input"
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                    />
                  </div>
                </div>

                <CaptchaChallenge ref={captchaRef} onVerify={setIsCaptchaValid} theme="dark" />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting' || !email || !isCaptchaValid}
                    className="w-full py-3 px-4 bg-gradient-to-r from-royal-blue-600 to-royal-blue-700 hover:from-royal-blue-500 hover:to-royal-blue-600 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-royal-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {status === 'submitting' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5 text-gold-400" />
                        <span>Subscribe Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Spiritual footer line */}
        <p className="mt-8 text-center text-xs text-slate-500">
          "A Generation Rising with Spiritual Fire & Purpose"
        </p>
      </div>
    </div>
  );
}
