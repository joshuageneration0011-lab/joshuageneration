import { useState } from 'react';
import { Mail, User, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '@/utils/api';

interface SonsDaughtersPageProps {
  onBack: () => void;
}

export default function SonsDaughtersPage({ onBack }: SonsDaughtersPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('submitting');
    try {
      const res = await api.subscribeSDNewsletter(email.trim(), name.trim() || undefined);
      if (res.success) {
        setStatus('success');
        setName('');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(res.message || res.error || 'Failed to subscribe. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative Blur Background circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-sky-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-[100px] pointer-events-none" />

      {/* Navigation Helper */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white/40 hover:bg-white/60 border border-slate-200/50 hover:border-slate-300/60 transition-all text-xs font-semibold cursor-pointer border-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo and title */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center border border-white/80 backdrop-blur-md shadow-lg relative group overflow-hidden">
            {/* Soft inner glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src="https://joshuasgeneration.com/favicon.png"
              alt="Logo"
              className="w-12 h-12 object-contain relative z-10 filter drop-shadow-sm"
            />
            {/* Sons and Daughters Sparkle Badge */}
            <span className="absolute bottom-1 right-1 bg-white p-0.5 rounded-full border border-indigo-100 shadow-sm" title="Sons & Daughters">
              <Sparkles className="w-3 h-3 text-amber-500" />
            </span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-800 tracking-tight flex flex-col gap-1">
            <span>Sons & <span className="text-amber-500">Daughters</span></span>
            <span className="text-xs text-indigo-650 uppercase tracking-widest font-bold mt-1">Apostolic Mentorship updates ✨</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            Join the Sons & Daughters list to receive mentorship invitations, zoom links, resource releases, and guidance directly from Apostle Joshua Iyemifokhae.
          </p>
        </div>

        {/* Signup Card */}
        <div className="mt-8">
          <div className="bg-white/70 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-white/60 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            {status === 'success' ? (
              <div className="text-center py-6 animate-scale-up">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-800">Welcome to the Family!</h3>
                <p className="mt-2 text-sm text-slate-500 px-4">
                  You have successfully joined the Sons & Daughters Mentorship subscription list. Please check your inbox for our welcome details.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 cursor-pointer border-none"
                >
                  Register another email
                </button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
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
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
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
                      className="w-full pl-10 pr-4 py-3 bg-white/60 border border-slate-200/80 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-950/10 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border-none"
                  >
                    {status === 'submitting' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Joining...</span>
                      </>
                    ) : (
                      <span>Join Mentorship list ✨</span>
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
