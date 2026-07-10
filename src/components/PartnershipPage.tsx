import React, { useState } from 'react';
import { Heart, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, Crown, Globe, Users } from 'lucide-react';
import type { Page } from '../App';

interface PartnershipPageProps {
  onBack: () => void;
  onNavigateToDonate: (cause: string) => void;
}

export default function PartnershipPage({ onBack, onNavigateToDonate }: PartnershipPageProps) {
  const [selectedTier, setSelectedTier] = useState<string>('Partner with Apostle Joshua Iyemifokhae');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tiers = [
    {
      name: 'Partner with Apostle Joshua Iyemifokhae',
      description: 'Support the apostolic calling, prophetic ministry operations, and direct global message broadcasting.',
      icon: Crown,
      color: 'from-gold-500 to-amber-600',
      shadow: 'shadow-gold-500/15',
      suggestedAmounts: { NGN: '₦30,000', USD: '$50', GBP: '£40' },
      features: [
        'Direct connection to apostolic covenant prayers',
        'Special partner updates & counseling alignment options',
        'Priority invitations & seating at physical events'
      ]
    },
    {
      name: 'Partner with the Outreaches',
      description: 'Fuel physical crusades, local church planting, humanitarian aid, and free books/literature distribution.',
      icon: Globe,
      color: 'from-royal-blue-500 to-indigo-600',
      shadow: 'shadow-royal-blue-500/15',
      suggestedAmounts: { NGN: '₦50,000', USD: '$80', GBP: '£65' },
      features: [
        'Monthly physical crusade and souls-won reports',
        'Sponsorship mention in print & digital outreach materials',
        'Exclusive invitations to roundtable planning panels'
      ]
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Direct routing to payment flow with preloaded partnership tier description
    const commitment = `${selectedTier} (${frequency.toUpperCase()})`;
    onNavigateToDonate(commitment);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-royal-blue-600 transition-colors mb-8 font-medium text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-200/60 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-royal-blue-50 text-royal-blue-600 rounded-full text-xs font-semibold tracking-wide uppercase border border-royal-blue-100/50">
            <Heart className="w-3.5 h-3.5 fill-royal-blue-600" />
            Kingdom Partnership
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight font-cormorant">
            Partner with Apostle Joshua Iyemifokhae
          </h1>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            Join hands with us in taking the gospel message to the ends of the earth. Your committed support helps us build local altars, empower young believers, and release dynamic digital ministry resources globally.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-8 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isSelected = selectedTier === tier.name;
            return (
              <div
                key={tier.name}
                onClick={() => setSelectedTier(tier.name)}
                className={`relative flex flex-col justify-between p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer bg-white ${
                  isSelected
                    ? 'border-royal-blue-500 ring-4 ring-royal-blue-500/10 shadow-xl scale-[1.02]'
                    : 'border-gray-200/80 hover:border-gray-300 shadow-md hover:scale-[1.01]'
                }`}
              >
                <div>
                  {/* Selector Badge */}
                  <div className="absolute top-6 right-6">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'border-royal-blue-500 bg-royal-blue-500 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>

                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white mb-6 shadow-md ${tier.shadow}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2">{tier.name}</h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed mb-6">{tier.description}</p>
                  
                  {/* Price info */}
                  <div className="border-t border-b border-gray-100 py-4 mb-6">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Suggested Commitment</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-gray-900">{tier.suggestedAmounts.USD}</span>
                      <span className="text-sm text-gray-400">/ month</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Equivalent to: {tier.suggestedAmounts.NGN} or {tier.suggestedAmounts.GBP}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    className={`w-full py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      isSelected
                        ? `bg-gradient-to-r ${tier.color} text-white shadow-lg ${tier.shadow}`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    Select {tier.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Commitment Form Box */}
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-soft-lg overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Side Panel Info */}
          <div className="md:col-span-5 bg-gradient-to-br from-royal-blue-600 via-royal-blue-700 to-royal-blue-900 p-8 text-white relative flex flex-col justify-between">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 mb-6">
                <Sparkles className="w-5 h-5 text-gold-400" />
              </div>
              <h4 className="text-xl font-bold font-cormorant tracking-tight mb-3">Partner Covenant</h4>
              <p className="text-white/75 text-xs sm:text-sm leading-relaxed mb-4">
                "We pray for our partners daily, releasing the covenant blessings of grace, health, and abundance upon your household."
              </p>
              <blockquote className="border-l-2 border-gold-400 pl-4 py-1 italic text-xs text-white/60">
                Apostle Joshua Iyemifokhae
              </blockquote>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col gap-3 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <span>Flexible updates at any time</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Make Your Commitment</h3>
              <p className="text-xs text-gray-400">Selected tier: <strong className="text-royal-blue-600">{selectedTier}</strong></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Commitment Frequency
                </label>
                <div className="inline-flex p-1 rounded-xl bg-gray-100 w-full">
                  {['one-time', 'monthly', 'quarterly'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFrequency(item)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                        frequency === item ? 'bg-white text-royal-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-xs sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-xs sm:text-sm"
                />
                {errors.email && <p className="mt-1 text-[10px] text-red-500 font-semibold">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-royal-blue-500/20 focus:border-royal-blue-500 transition-all text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                Proceed to Secure Giving
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
