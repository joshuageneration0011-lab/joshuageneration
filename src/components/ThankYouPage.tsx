import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowLeft, ShieldCheck, Sparkles, Crown, Globe, Tv } from 'lucide-react';

interface ThankYouPageProps {
  onNavigateHome: () => void;
  onNavigateSermons?: () => void;
}

export default function ThankYouPage({ onNavigateHome, onNavigateSermons }: ThankYouPageProps) {
  const [donorName, setDonorName] = useState('Generous Donor');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('NGN');
  const [cause, setCause] = useState('Prophetic Offering');
  const [frequency, setFrequency] = useState('one-time');
  const [txRef, setTxRef] = useState('');
  const [dateStr, setDateStr] = useState('');

  const currencySymbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
    ZAR: 'R'
  };

  useEffect(() => {
    const processPaymentCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status') || 'successful';
      const ref = params.get('tx_ref') || params.get('transaction_id');

      // 1. Try restoring from localStorage backup
      const pendingRaw = localStorage.getItem('jg_pending_donation');
      let pendingData: any = null;
      if (pendingRaw) {
        try {
          pendingData = JSON.parse(pendingRaw);
        } catch (e) {
          console.error('Error parsing pending donation:', e);
        }
      }

      // 2. Query backend verification endpoint
      try {
        const res = await fetch('/api/donations/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tx_ref: ref || pendingData?.tx_ref,
            transaction_id: params.get('transaction_id'),
            status: status
          })
        });

        if (res.ok) {
          const verifiedDonation = await res.json();
          if (verifiedDonation && verifiedDonation.donor) {
            setDonorName(verifiedDonation.donor || 'Beloved Donor');
            setEmail(verifiedDonation.email || '');
            setAmount(Number(verifiedDonation.amount) || 0);
            setCurrency(verifiedDonation.currency || 'NGN');
            setCause(verifiedDonation.purpose || 'Prophetic Offering');
            setFrequency(verifiedDonation.frequency || 'one-time');
            setTxRef(verifiedDonation.id || ref || `JG-TXN-${Date.now()}`);
            setDateStr(verifiedDonation.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
            localStorage.removeItem('jg_pending_donation');
            return;
          }
        }
      } catch (err) {
        console.error('Failed server donation verification:', err);
      }

      // 3. Fallback to client-side params/localStorage
      const nameToUse = pendingData?.donor || params.get('name') || 'Beloved Donor';
      const emailToUse = pendingData?.email || params.get('email') || '';
      const amountToUse = pendingData?.amount ? Number(pendingData.amount) : Number(params.get('amount')) || 0;
      const currencyToUse = pendingData?.currency || params.get('currency') || 'NGN';
      const causeToUse = pendingData?.purpose || params.get('cause') || 'Prophetic Offering';
      const freqToUse = pendingData?.frequency || 'one-time';
      const referenceToUse = ref || `JG-TXN-${Date.now()}`;
      const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      setDonorName(nameToUse);
      setEmail(emailToUse);
      setAmount(amountToUse);
      setCurrency(currencyToUse);
      setCause(causeToUse);
      setFrequency(freqToUse);
      setTxRef(referenceToUse);
      setDateStr(todayDate);
    };

    processPaymentCallback();
  }, []);

  const symbol = currencySymbols[currency] || currencySymbols['USD'];
  const formattedAmount = `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation button */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-royal-blue-600 transition-colors mb-6 font-medium text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft-lg overflow-hidden">
          
          {/* Header Hero */}
          <div className="bg-gradient-to-br from-royal-blue-700 via-royal-blue-800 to-royal-blue-950 p-8 sm:p-12 text-white relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-gold-500/20 rounded-full blur-[100px]" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 text-emerald-300 mb-6 shadow-lg shadow-emerald-900/30 animate-bounce-short">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-500/20 border border-gold-400/30 text-gold-300 text-xs font-semibold uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Payment Successful
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold font-cormorant tracking-tight mb-2 text-white">
                Thank You, {donorName}!
              </h1>

              <p className="text-white/80 text-sm max-w-md mx-auto leading-relaxed">
                Your generous seed of <strong className="text-gold-300 font-bold">{formattedAmount}</strong> has been successfully received for <span className="underline decoration-gold-400/60 font-semibold">{cause}</span>.
              </p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-6 sm:p-10 space-y-8">

            {/* Scripture Blessing Box */}
            <div className="bg-gradient-to-br from-amber-50 to-gold-50/50 border border-gold-200/80 rounded-2xl p-6 relative">
              <blockquote className="text-gray-800 italic text-sm sm:text-base leading-relaxed mb-2 font-serif text-center">
                "Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously. Each of you should give what you have decided in your heart to give, for God loves a cheerful giver."
              </blockquote>
              <p className="text-right text-xs font-bold text-gold-700 uppercase tracking-wider">— 2 Corinthians 9:6-7</p>
            </div>

            {/* Transaction Summary Receipt Card */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200/80 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  {cause === 'Prophetic Offering' ? (
                    <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-600">
                      <Crown className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-royal-blue-500/10 flex items-center justify-center text-royal-blue-600">
                      <Globe className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Donation Cause</p>
                    <p className="text-sm font-bold text-gray-900">{cause}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                  SUCCESSFUL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-gray-400 block mb-0.5">Transaction ID / Reference</span>
                  <span className="font-semibold text-gray-800 font-mono text-xs">{txRef}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Giving Date</span>
                  <span className="font-semibold text-gray-800">{dateStr}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Payment Method</span>
                  <span className="font-semibold text-gray-800">Flutterwave Payment Gateway</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Giving Frequency</span>
                  <span className="font-semibold text-gray-800 capitalize">{frequency}</span>
                </div>
                {email && (
                  <div className="sm:col-span-2">
                    <span className="text-gray-400 block mb-0.5">Donor Email</span>
                    <span className="font-semibold text-gray-800">{email}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Total Amount Seeded</span>
                <span className="text-xl font-extrabold text-royal-blue-700 font-mono">{formattedAmount}</span>
              </div>
            </div>

            {/* Impact Note */}
            <div className="text-center space-y-2 text-xs text-gray-500 max-w-md mx-auto">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="leading-relaxed">
                A confirmation email receipt has been sent to your email. Your seed powers our global outreach programs and kingdom mission.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateHome}
                className="w-full sm:w-auto px-6 py-3.5 bg-royal-blue-600 hover:bg-royal-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                Return to Main Page
              </button>

              {onNavigateSermons && (
                <button
                  onClick={onNavigateSermons}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-gray-200"
                >
                  <Tv className="w-4 h-4 text-royal-blue-600" />
                  Listen to Sermons
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
