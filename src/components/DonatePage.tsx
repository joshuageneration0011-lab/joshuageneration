import React, { useState, useEffect } from 'react';
import { Gift, Heart, CheckCircle2, ArrowLeft, Mail, User, ShieldCheck, Sparkles, AlertCircle, Crown, Globe } from 'lucide-react';

const globalCurrencies = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' }
];

interface DonatePageProps {
  onBack: () => void;
  initialCause?: string;
}

export default function DonatePage({ onBack, initialCause }: DonatePageProps) {
  const [step, setStep] = useState(initialCause ? 1 : 0);
  const [cause, setCause] = useState(initialCause || '');
  const [frequency, setFrequency] = useState('one-time');
  const [amount, setAmount] = useState('50');
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [showDropdown, setShowDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  const currencySymbols = globalCurrencies.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.code] = curr.symbol;
    return acc;
  }, {});

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.currency-dropdown-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showDropdown]);
  
  // Errors and Loading
  const [errors, setErrors] = useState<Record<string, string>>({}); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptId, setReceiptId] = useState('');

  // Check for payment callback from Flutterwave redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const txRef = params.get('tx_ref');
    const isSuccess = status === 'successful' || status === 'completed';
    if (isSuccess && txRef) {
      // Payment came back successful — log and show receipt
      setReceiptId(txRef);
      setStep(3);

      // Load pending donation from localStorage and post to backend database
      const pending = localStorage.getItem('jg_pending_donation');
      if (pending) {
        try {
          const donationData = JSON.parse(pending);
          if (donationData.donor) setName(donationData.donor);
          if (donationData.email) setEmail(donationData.email);
          if (donationData.purpose) setCause(donationData.purpose);
          if (donationData.frequency) setFrequency(donationData.frequency);
          if (donationData.currency) setCurrency(donationData.currency);
          if (donationData.amount) {
            setAmount(donationData.amount);
            setCustomAmount('');
          }
          fetch('/api/donations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              donor: donationData.donor,
              email: donationData.email,
              amount: donationData.amount,
              purpose: donationData.purpose,
              frequency: donationData.frequency,
              method: 'Flutterwave',
              currency: donationData.currency || 'USD'
            })
          }).then(res => {
            if (res.ok) {
              console.log('Donation successfully recorded in database');
              localStorage.removeItem('jg_pending_donation');
            }
          }).catch(err => {
            console.error('Failed to record donation in database:', err);
          });
        } catch (e) {
          console.error('Error parsing pending donation:', e);
        }
      }

      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    } else if (status && !isSuccess && txRef) {
      setErrors({ payment: 'Payment was not completed. Please try again.' });
    }
  }, []);

  // Auto-detect currency based on IP address and Timezone
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('status')) return;

    const detectCurrency = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
        
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          if (data.currency && ['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'ZAR'].includes(data.currency)) {
            setCurrency(data.currency);
            return;
          }
        }
      } catch (e) {
        // Silent catch — fall back to timezone method
      }

      // Timezone-based fallback detection
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          const lowerTz = tz.toLowerCase();
          if (lowerTz.includes('lagos') || lowerTz.includes('nairobi') || lowerTz.includes('accra')) {
            setCurrency('NGN');
          } else if (lowerTz.includes('johannesburg')) {
            setCurrency('ZAR');
          } else if (lowerTz.includes('london')) {
            setCurrency('GBP');
          } else if (lowerTz.includes('europe')) {
            setCurrency('EUR');
          } else if (lowerTz.includes('toronto') || lowerTz.includes('vancouver') || lowerTz.includes('canada')) {
            setCurrency('CAD');
          } else {
            setCurrency('USD');
          }
        }
      } catch (err) {
        setCurrency('NGN');
      }
    };

    detectCurrency();
  }, []);

  const getPresetAmounts = (cur: string) => {
    switch (cur) {
      case 'NGN': return ['2000', '5000', '10000', '20000', '50000', '100000'];
      case 'KES': return ['500', '1000', '2500', '5000', '10000', '25000'];
      case 'GHS': return ['50', '100', '250', '500', '1000', '2500'];
      case 'ZAR': return ['100', '250', '500', '1000', '2000', '5000'];
      case 'UGX': return ['10000', '25000', '50000', '100000', '250000', '500000'];
      case 'TZS': return ['10000', '25000', '50000', '100000', '250000', '500000'];
      case 'RWF': return ['5000', '10000', '25000', '50000', '100000', '250000'];
      default: return ['10', '25', '50', '100', '250', '500'];
    }
  };

  // Reset presets event-driven on user selection rather than a global side-effect

  const handlePresetSelect = (val: string) => {
    setAmount(val);
    setCustomAmount('');
    if (errors.amount) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.amount;
        return copy;
      });
    }
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*$/.test(val)) {
      setCustomAmount(val);
      setAmount('custom');
      if (errors.amount) {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy.amount;
          return copy;
        });
      }
    }
  };

  const getFinalAmount = () => {
    return amount === 'custom' ? Number(customAmount) : Number(amount);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const finalAmount = getFinalAmount();
    
    if (!finalAmount || finalAmount <= 0) {
      newErrors.amount = 'Please select or enter a valid donation amount';
    }
    
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleCategorySelect = (category: string) => {
    setCause(category);
    setStep(1);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) {
        handlePaymentSubmit(e);
      }
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsProcessing(true);
    setErrors({});
    try {
      const finalAmount = getFinalAmount();
      const res = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cause, amount: finalAmount, name, email, frequency, currency })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ payment: data.error || 'Payment initiation failed.' });
        setIsProcessing(false);
        return;
      }
      // Save pending donation in localStorage to recover after redirect
      localStorage.setItem('jg_pending_donation', JSON.stringify({
        donor: name,
        email: email,
        amount: finalAmount,
        purpose: cause,
        frequency: frequency,
        currency: currency
      }));

      // Redirect to Flutterwave hosted payment page
      window.location.href = data.payment_link;
    } catch (err: any) {
      setErrors({ payment: err.message || 'Network error. Please try again.' });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-royal-blue-600 transition-colors mb-6 font-medium text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-200/60 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Outer Box */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Side Info Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-royal-blue-600 via-royal-blue-700 to-royal-blue-900 p-8 sm:p-12 text-white relative flex flex-col justify-between">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-500/30 mb-8">
                <Heart className="w-6 h-6 text-gold-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-cormorant tracking-tight mb-4">
                This is a Fertile Ground
              </h2>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Giving is an act of worship that demonstrates your trust in God as your provider. It is an expression of gratitude, love, and obedience that honors Him, advances His Kingdom, and positions your heart to receive His continued provision and blessing according to His will and promises.
              </p>
              
              <blockquote className="border-l-2 border-gold-400 pl-4 py-1 mb-8 italic text-xs text-white/70">
                "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."
                <span className="block mt-1 font-semibold not-italic text-gold-400">- 2 Corinthians 9:7</span>
              </blockquote>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col gap-4 text-xs text-white/60">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-gold-400" />
                <span>Secure 256-bit SSL encrypted transactions</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4.5 h-4.5 text-gold-400" />
                <span>Simulated transaction for demonstration</span>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center min-h-[500px]">
            {/* Step Indicators */}
            {step >= 1 && step < 3 && (
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 1 ? 'bg-royal-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                    {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">Details</span>
                </div>
                <div className="h-px w-8 bg-gray-200" />
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step === 2 ? 'bg-royal-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    2
                  </span>
                  <span className="text-sm font-medium text-gray-500">Payment</span>
                </div>
              </div>
            )}

            {/* Step 0 — Category Selection */}
            {step === 0 && (
              <div className="space-y-6 animate-in">
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Choose Your Offering</h3>
                  <p className="text-sm text-gray-500">Select the category that best reflects your giving intention.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Prophet Offering Card */}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Prophet Offering / Faith Seed')}
                    className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-gold-300 bg-gradient-to-br from-gold-50 to-amber-50 hover:border-gold-500 hover:shadow-xl hover:shadow-gold-200/50 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-lg shadow-gold-300/40 group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Prophet Offering / Faith Seed</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Honor the prophetic ministry and support the anointed work of the prophet in your life.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gold-500 text-white text-xs font-semibold shadow-sm group-hover:bg-gold-600 transition-colors">
                        Give Now →
                      </span>
                    </div>
                  </button>

                  {/* Mission / Outreach Card */}
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('Mission / Outreach')}
                    className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-royal-blue-200 bg-gradient-to-br from-royal-blue-50/50 to-indigo-50/30 hover:border-royal-blue-500 hover:shadow-xl hover:shadow-royal-blue-200/40 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-royal-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-royal-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Mission / Outreach</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Support local and global evangelism, charity programs, and ministry expansion projects.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-royal-blue-600 text-white text-xs font-semibold shadow-sm group-hover:bg-royal-blue-700 transition-colors">
                        Give Now →
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-6 animate-in">
                {/* Selected Category Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${(cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? 'bg-gold-500' : 'bg-royal-blue-600'}`}>
                    {(cause === 'Prophetic Offering' || cause === 'Prophet Offering / Faith Seed') ? <Crown className="w-4 h-4 text-white" /> : <Globe className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium">Giving to</p>
                    <p className="text-sm font-bold text-gray-800">{cause}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs text-royal-blue-600 hover:text-royal-blue-800 font-semibold transition-colors"
                  >
                    Change
                  </button>
                </div>

                {/* Donation Frequency */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    Giving Frequency
                  </label>
                  <div className="inline-flex p-1 rounded-xl bg-gray-100 w-full">
                    {['one-time', 'monthly', 'yearly'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setFrequency(item)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${frequency === item ? 'bg-white text-royal-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Selection Grid */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Select Currency
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'ZAR'].map((cur) => (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => {
                          setCurrency(cur);
                          setShowDropdown(false);
                          const presets = getPresetAmounts(cur);
                          setAmount(presets[2] || '50');
                          setCustomAmount('');
                        }}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${currency === cur ? 'border-gold-500 bg-gold-50 text-gold-800 ring-2 ring-gold-500/20' : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                      >
                        <span className="text-[9px] uppercase font-semibold text-gray-400">{cur}</span>
                        <span className="text-sm">{currencySymbols[cur]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Searchable Dropdown for other currencies */}
                  <div className="relative currency-dropdown-container">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Or select any currency:</span>
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="w-full px-3.5 py-2 text-left border border-gray-200 rounded-xl text-xs bg-white text-gray-700 flex items-center justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                        >
                          <span className="font-semibold text-gray-800">
                            {currency} ({currencySymbols[currency] || ''}) - {globalCurrencies.find(c => c.code === currency)?.name || 'Other Currency'}
                          </span>
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {showDropdown && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-2 space-y-2">
                            <input
                              type="text"
                              placeholder="Type country or currency..."
                              value={currencySearch}
                              onChange={(e) => setCurrencySearch(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/20 bg-gray-50 text-gray-800"
                            />
                            <div className="space-y-1">
                              {globalCurrencies
                                .filter(c =>
                                  c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                  c.name.toLowerCase().includes(currencySearch.toLowerCase())
                                )
                                .map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setCurrency(c.code);
                                      setShowDropdown(false);
                                      setCurrencySearch('');
                                      const presets = getPresetAmounts(c.code);
                                      setAmount(presets[2] || '50');
                                      setCustomAmount('');
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs rounded-lg hover:bg-gray-50 flex items-center justify-between cursor-pointer border-none ${currency === c.code ? 'bg-gold-50 text-gold-900 font-bold' : 'text-gray-700 bg-transparent'}`}
                                  >
                                    <span>{c.code} ({c.symbol}) - {c.name}</span>
                                    {currency === c.code && <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset / Custom Amount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    Donation Amount ({currency})
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {getPresetAmounts(currency).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetSelect(val)}
                        className={`py-3 rounded-xl border font-bold transition-all duration-200 cursor-pointer ${amount === val ? 'border-gold-500 bg-gold-50 text-gold-800' : 'border-gray-200 text-gray-650 hover:border-gray-300 bg-white'}`}
                      >
                        {currencySymbols[currency] || '$'}{val}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount Input */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold">
                      {currencySymbols[currency] || '$'}
                    </span>
                    <input
                      type="text"
                      placeholder={`Enter custom amount in ${currency}`}
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className={`w-full pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm font-semibold ${amount === 'custom' ? 'border-gold-500 bg-gold-50/20' : 'border-gray-200'}`}
                      style={{ paddingLeft: `${(currencySymbols[currency] || '$').length * 8 + 24}px` }}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Billing Info */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Billing Details
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm"
                        />
                      </div>
                      {errors.name && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.payment && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.payment}</span>
                  </div>
                )}

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Proceed to Payment ({currencySymbols[currency] || '$'}{getFinalAmount() || 0})
                    </>
                  )}
                </button>
              </form>

            )}

            {step === 3 && (
              <div className="text-center space-y-6 animate-in py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 mb-4 shadow-soft">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">GOD BLESS YOU{name ? `, ${name}` : ''}!</h3>
                  <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                    Your giving of <strong className="text-gray-850 font-bold">{currencySymbols[currency] || '$'}{getFinalAmount()}</strong> to the <strong>{cause || 'ministry'}</strong> has been successfully simulated and completed. I declare, according to Genesis 27:28, that you have the dew of heaven and the fatness of the earth in the name of Jesus. Your harvest is sure, and we await your testimonies.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="max-w-sm mx-auto bg-gray-50 rounded-2xl border border-gray-100 p-6 text-left space-y-3.5 shadow-sm text-sm">
                  <div className="flex justify-between border-b border-gray-200/60 pb-2.5 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <span>Receipt Summary</span>
                    <span>SUCCESS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-semibold text-gray-800 font-mono">{receiptId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Selected Cause</span>
                    <span className="font-semibold text-gray-800">{cause}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Frequency</span>
                    <span className="font-semibold text-gray-800 capitalize">{frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Donor Email</span>
                    <span className="font-semibold text-gray-800">{email}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200/60 pt-2.5 font-bold text-base text-royal-blue-700">
                    <span>Total Given</span>
                    <span>{currencySymbols[currency] || '$'}{getFinalAmount()}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={onBack}
                    className="px-6 py-3 bg-royal-blue-600 hover:bg-royal-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all duration-200"
                  >
                    Return to Main Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
