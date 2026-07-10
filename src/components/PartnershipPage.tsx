import React from 'react';
import { Heart, Crown, Globe, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';

interface PartnershipPageProps {
  onBack: () => void;
  onNavigateToDonate: (cause: string) => void;
}

export default function PartnershipPage({ onBack, onNavigateToDonate }: PartnershipPageProps) {
  const tiers = [
    {
      name: 'Partner with Apostle Joshua Iyemifokhae',
      description: 'Partner with Apostle Joshua Iyemifokhae as he devotes himself to preaching the Gospel, teaching God’s Word, and fulfilling God’s mandate to reach lives around the world.',
      icon: Crown,
      color: 'from-gold-500 to-amber-600',
      shadow: 'shadow-gold-500/15',
      suggestedAmounts: { NGN: '₦30,000', USD: '$50', GBP: '£40' },
      features: [
        'Partner Contact Access to Apostle Joshua Iyemifokhae',
        'Personal New Month Prayer Declarations',
        'Monthly Private Zoom Prayer Meetings'
      ]
    },
    {
      name: 'Partner with the Outreaches',
      description: 'Support evangelistic missions and Gospel campaigns all over the world.',
      icon: Globe,
      color: 'from-royal-blue-500 to-indigo-600',
      shadow: 'shadow-royal-blue-500/15',
      suggestedAmounts: { NGN: '₦50,000', USD: '$80', GBP: '£65' },
      features: [
        'Reserved Seating at Apostolic Retreats',
        'Monthly Partner Zoom Prayer Meetings',
        'New month prayer declarations'
      ]
    }
  ];

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
            As a Partner, we continually pray for you and believe God for His blessings upon your life, family, business, career, and ministry. We trust God to multiply the seed you sow and cause you to abound in every good work according to His Word.
          </p>
          <p className="text-gold-600 font-semibold text-sm italic font-cormorant tracking-wide">
            — 2 Corinthians 9:10
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-8 mb-16">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                onClick={() => onNavigateToDonate(tier.name)}
                className="relative flex flex-col justify-between p-8 rounded-3xl border-2 border-gray-200/80 hover:border-royal-blue-500 hover:ring-4 hover:ring-royal-blue-500/10 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white hover:scale-[1.02] group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white mb-6 shadow-md ${tier.shadow}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-royal-blue-600 transition-colors">{tier.name}</h3>
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
                    className={`w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 bg-gradient-to-r ${tier.color} text-white shadow-lg ${tier.shadow} flex items-center justify-center gap-1.5`}
                  >
                    Partner Now
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
