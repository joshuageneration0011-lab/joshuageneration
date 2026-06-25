import { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    api.login(email, password)
      .then(() => {
        onLogin();
      })
      .catch((err) => {
        setError(err.message || 'Invalid credentials. Try admin@joshuagen.org / admin123');
        setIsLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-royal-blue-500/5 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-grid opacity-[0.01]" />
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-600 hover:text-royal-blue-600 transition-all text-sm border border-gray-200 shadow-sm"
      >
        ← Back to Platform
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-in">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-blue-500 to-royal-blue-700 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-royal-blue-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1.5">Sign in to manage Joshua Generation</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-8 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 animate-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@joshuagen.org"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-royal-blue-600 focus:ring-royal-blue-500"
                />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <button type="button" className="text-sm text-royal-blue-600 font-medium hover:text-royal-blue-700 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-royal-blue-500 to-royal-blue-700 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-royal-blue-500/25 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Sign In to Admin
                </>
              )}
            </button>

            {/* Hint */}
            <div className="pt-2 text-center">
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Demo: admin@joshuagen.org / admin123
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-gray-400 text-xs font-medium">
          Joshua Generation Digital Ministry Platform v1.0
        </p>
      </div>
    </div>
  );
}
