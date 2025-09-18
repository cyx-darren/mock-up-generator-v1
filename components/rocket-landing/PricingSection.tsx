'use client';

import React, { useState } from 'react';
import { CreditCard, Check, X, Phone, ArrowRight, Zap, Shield, Clock, RefreshCw } from 'lucide-react';

interface PlanPrice {
  monthly: number;
  annual: number;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: PlanPrice;
  features: string[];
  limitations: string[];
  cta: string;
  popular: boolean;
  color: string;
  savings?: string;
}

interface FeatureItem {
  name: string;
  free: string;
  pro: string;
  enterprise: string;
}

interface FeatureCategory {
  category: string;
  items: FeatureItem[];
}

interface FAQItem {
  question: string;
  answer: string;
}

interface PricingSectionProps {
  onSignupClick?: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSignupClick }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out Mockup Gen',
      price: { monthly: 0, annual: 0 },
      features: [
        '5 mockups per month',
        '10 device templates',
        'Basic export formats (PNG)',
        'Watermarked downloads',
        'Community support',
        'Standard resolution (1080p)'
      ],
      limitations: [
        'Limited template access',
        'Watermarked outputs',
        'No priority support',
        'No commercial license'
      ],
      cta: 'Start Free',
      popular: false,
      color: 'slate'
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professional designers and small teams',
      price: { monthly: 29, annual: 24 },
      features: [
        'Unlimited mockups',
        '500+ device templates',
        'All export formats (PNG, JPG, PDF)',
        'No watermarks',
        'Priority email support',
        'High resolution (4K)',
        'Figma & Sketch plugins',
        'Commercial license',
        'Batch processing',
        'Custom backgrounds'
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      popular: true,
      color: 'blue',
      savings: billingCycle === 'annual' ? '17%' : undefined
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and organizations',
      price: { monthly: 99, annual: 79 },
      features: [
        'Everything in Pro',
        'Unlimited team members',
        'Custom device templates',
        'API access & webhooks',
        'SSO integration',
        'Dedicated account manager',
        'Custom branding',
        'Advanced analytics',
        'Priority phone support',
        'SLA guarantee',
        'Custom integrations',
        'White-label options'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
      color: 'purple',
      savings: billingCycle === 'annual' ? '20%' : undefined
    }
  ];

  const features: FeatureCategory[] = [
    {
      category: 'Templates & Devices',
      items: [
        { name: 'Device templates', free: '10', pro: '500+', enterprise: '500+ + Custom' },
        { name: 'Template categories', free: '3', pro: '8', enterprise: '8 + Custom' },
        { name: 'New templates monthly', free: '❌', pro: '✅', enterprise: '✅ + Priority' },
        { name: 'Custom templates', free: '❌', pro: '❌', enterprise: '✅' }
      ]
    },
    {
      category: 'Export & Quality',
      items: [
        { name: 'Export formats', free: 'PNG', pro: 'PNG, JPG, PDF', enterprise: 'All + Custom' },
        { name: 'Maximum resolution', free: '1080p', pro: '4K', enterprise: '8K' },
        { name: 'Watermark', free: '✅', pro: '❌', enterprise: '❌' },
        { name: 'Commercial license', free: '❌', pro: '✅', enterprise: '✅' }
      ]
    },
    {
      category: 'Integrations',
      items: [
        { name: 'Figma plugin', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Sketch plugin', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Adobe CC extension', free: '❌', pro: '✅', enterprise: '✅' },
        { name: 'API access', free: '❌', pro: 'Limited', enterprise: 'Full' }
      ]
    },
    {
      category: 'Support & Team',
      items: [
        { name: 'Support type', free: 'Community', pro: 'Email', enterprise: 'Phone + Email' },
        { name: 'Response time', free: 'Best effort', pro: '24 hours', enterprise: '4 hours' },
        { name: 'Team members', free: '1', pro: '5', enterprise: 'Unlimited' },
        { name: 'Team collaboration', free: '❌', pro: 'Basic', enterprise: 'Advanced' }
      ]
    }
  ];

  const faq: FAQItem[] = [
    {
      question: 'Can I change plans anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
    },
    {
      question: 'What happens to my mockups if I downgrade?',
      answer: 'Your existing mockups remain accessible, but you\'ll be limited by your new plan\'s monthly quota for creating new mockups.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.'
    },
    {
      question: 'Is there a student discount?',
      answer: 'Yes! Students get 50% off Pro plans with a valid .edu email address. Contact support to apply your discount.'
    }
  ];

  const getPrice = (plan: Plan): string => {
    const price = plan?.price?.[billingCycle];
    return price === 0 ? 'Free' : `$${price}`;
  };

  const getSavings = (plan: Plan): string | null => {
    if (billingCycle === 'annual' && plan?.savings) {
      return `Save ${plan?.savings}`;
    }
    return null;
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <CreditCard size={16} className="mr-2" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Choose the Perfect Plan
            <span className="text-blue-600 block">For Your Needs</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free and upgrade as you grow. All plans include our core features
            with no hidden fees or surprise charges.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-md font-medium transition-all relative ${
                billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans?.map((plan) => (
            <div
              key={plan?.id}
              className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
                plan?.popular
                  ? 'border-blue-500 shadow-xl scale-105'
                  : hoveredPlan === plan?.id
                  ? 'border-slate-300 shadow-lg'
                  : 'border-slate-200 shadow-sm'
              }`}
              onMouseEnter={() => setHoveredPlan(plan?.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular Badge */}
              {plan?.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan?.name}</h3>
                  <p className="text-slate-600 mb-6">{plan?.description}</p>

                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">
                      {getPrice(plan)}
                    </span>
                    {plan?.price?.monthly > 0 && (
                      <span className="text-slate-600">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>

                  {getSavings(plan) && (
                    <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {getSavings(plan)}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan?.features?.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </div>
                  ))}

                  {plan?.limitations?.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">Limitations:</p>
                      {plan?.limitations?.map((limitation, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <X size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-500 text-xs">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={plan?.id === 'enterprise' ? undefined : onSignupClick}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all ${
                    plan?.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan?.cta}
                  {plan?.id === 'enterprise' ? (
                    <Phone size={16} className="ml-2" />
                  ) : (
                    <ArrowRight size={16} className="ml-2" />
                  )}
                </button>

                {plan?.id !== 'free' && (
                  <p className="text-center text-xs text-slate-500 mt-3">
                    {plan?.id === 'enterprise' ? 'Custom pricing available' : '14-day free trial included'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Compare All Features</h3>
            <p className="text-slate-600">See exactly what's included in each plan</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-900">Features</th>
                    <th className="text-center p-4 font-semibold text-slate-900">Free</th>
                    <th className="text-center p-4 font-semibold text-blue-600 bg-blue-50">Pro</th>
                    <th className="text-center p-4 font-semibold text-slate-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {features?.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-slate-25">
                        <td colSpan={4} className="p-4 font-semibold text-slate-800 border-t border-slate-200">
                          {category?.category}
                        </td>
                      </tr>
                      {category?.items?.map((item, itemIndex) => (
                        <tr key={itemIndex} className="border-t border-slate-100">
                          <td className="p-4 text-slate-700">{item?.name}</td>
                          <td className="p-4 text-center text-slate-600">{item?.free}</td>
                          <td className="p-4 text-center text-blue-600 bg-blue-25">{item?.pro}</td>
                          <td className="p-4 text-center text-slate-600">{item?.enterprise}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
            <p className="text-slate-600">Got questions? We've got answers.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faq?.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">{item?.question}</h4>
                <p className="text-slate-600 text-sm">{item?.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-12 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Design Workflow?</h3>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join 150,000+ designers who have already made the switch to faster,
            professional mockup creation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onSignupClick}
              className="flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-slate-100 transition-colors shadow-lg"
            >
              <Zap size={16} className="mr-2" />
              Start Free Trial
            </button>
            <button className="flex items-center justify-center px-8 py-4 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors">
              <Phone size={16} className="mr-2" />
              Schedule Demo
            </button>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-blue-100">
            <div className="flex items-center space-x-1">
              <Shield size={16} />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw size={16} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;