import React, { useState, useEffect } from 'react';
import { Gift, Heart, CreditCard, CheckCircle2, ArrowLeft, Mail, User, ShieldCheck, Sparkles, AlertCircle, Crown, Globe } from 'lucide-react';
import { api } from '../utils/api';
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
  
  // Errors and Loading
  const [errors, setErrors] = useState<Record<string, string>>({}); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptId, setReceiptId] = useState('');

  // Check for payment callback from Flutterwave redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const txRef = params.get('tx_ref');
    if (status === 'successful' && txRef) {
      // Payment came back successful — log and show receipt
      setReceiptId(txRef);
      setStep(3);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    } else if (status && status !== 'successful' && txRef) {
      setErrors({ payment: 'Payment was not completed. Please try again.' });
    }
  }, []);

  const presetAmounts = ['10', '25', '50', '100', '250', '500'];

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

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }
    
    // Simple length checks for simulation
    const cleanedCard = cardNumber.replace(/\s+/g, '');
    if (cleanedCard.length < 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }
    
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = 'Use MM/YY format';
    } else {
      const [m, y] = expiry.split('/').map(Number);
      if (m < 1 || m > 12) {
        newErrors.expiry = 'Invalid month';
      }
    }
    
    if (cvv.length < 3) {
      newErrors.cvv = 'CVC is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Format: XXXX XXXX XXXX XXXX
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.slice(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setCvv(value);
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
        body: JSON.stringify({ cause, amount: finalAmount, name, email, frequency })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ payment: data.error || 'Payment initiation failed.' });
        setIsProcessing(false);
        return;
      }
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
                Partner with us in spreading the Gospel
              </h2>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Your generosity powers our global outreach programs, conference events, digital resources, and local community support. Together, we are raising a generation of purpose-driven believers.
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
                    onClick={() => handleCategorySelect('Prophetic Offering')}
                    className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-gold-300 bg-gradient-to-br from-gold-50 to-amber-50 hover:border-gold-500 hover:shadow-xl hover:shadow-gold-200/50 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-500 flex items-center justify-center shadow-lg shadow-gold-300/40 group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Prophetic Offering</h4>
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
                    className="group relative flex flex-col items-center text-center p-8 rounded-2xl border-2 border-royal-blue-200 bg-gradient-to-br from-royal-blue-50 to-blue-50 hover:border-royal-blue-500 hover:shadow-xl hover:shadow-royal-blue-200/50 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-royal-blue-400/5 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-royal-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-royal-blue-300/40 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1">Mission / Outreach</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Fuel global missions, evangelism campaigns, and community outreach around the world.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-royal-blue-600 text-white text-xs font-semibold shadow-sm group-hover:bg-royal-blue-700 transition-colors">
                        Give Now →
                      </span>
                    </div>
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 pt-2">
                  <ShieldCheck className="inline w-3.5 h-3.5 mr-1 text-emerald-400" />
                  All transactions are secure and encrypted
                </p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-6 animate-in">
                {/* Selected Category Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cause === 'Prophetic Offering' ? 'bg-gold-500' : 'bg-royal-blue-600'}`}>
                    {cause === 'Prophetic Offering' ? <Crown className="w-4 h-4 text-white" /> : <Globe className="w-4 h-4 text-white" />}
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

                {/* Preset / Custom Amount */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    Donation Amount ($)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 mb-3">
                    {presetAmounts.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetSelect(val)}
                        className={`py-3 rounded-xl border font-bold transition-all duration-200 ${amount === val ? 'border-gold-500 bg-gold-50 text-gold-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom Amount Input */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-bold">$</span>
                    <input
                      type="text"
                      placeholder="Enter custom amount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm font-semibold ${amount === 'custom' ? 'border-gold-500 bg-gold-50/20' : 'border-gray-200'}`}
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

                {/* Action button */}
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-2xl font-semibold text-base shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Proceed to Payment (${getFinalAmount() || 0})
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6 animate-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">Simulate Payment</h3>
                  <span className="text-lg font-bold text-royal-blue-700">${getFinalAmount()}</span>
                </div>

                {/* Card input controls */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm"
                    />
                    {errors.cardName && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{errors.cardName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm font-mono tracking-wider"
                      />
                    </div>
                    {errors.cardNumber && (
                      <p className="mt-1 text-xs text-red-500 font-medium">{errors.cardNumber}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm font-mono text-center"
                      />
                      {errors.expiry && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.expiry}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">CVC / CVV</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-sm font-mono text-center"
                      />
                      {errors.cvv && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{errors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.payment && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.payment}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-semibold text-sm transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-[2] py-3.5 bg-royal-blue-600 hover:bg-royal-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-royal-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Donate $${getFinalAmount()}`
                    )}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="text-center space-y-6 animate-in py-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 mb-4 shadow-soft">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank you, {name}!</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Your gift of <strong className="text-gray-800">${getFinalAmount()}</strong> to the <strong>{cause}</strong> has been successfully simulated and completed.
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
                    <span>${getFinalAmount()}</span>
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
