'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

const ConversionZone = () => {
  const benefits = [
    '5 free mockups to start',
    'No credit card required',
    'Cancel anytime',
    '24/7 support'
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Limited Time Offer
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Transform Your
            <span className="block">Corporate Presentations?</span>
          </h2>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join 150,000+ businesses creating professional mockups in seconds.
            Start free and upgrade when you need more.
          </p>

          {/* Benefits List */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg text-white"
              >
                <CheckCircle className="w-5 h-5 mr-2 text-green-300" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-6"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                View Pricing Plans
              </Button>
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="mt-10 pt-10 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L3.09 5.26C2.46 5.48 2 6.06 2 6.73v5.77c0 5.23 3.62 10.13 8.5 11.33.3.07.7.07 1 0C16.38 22.63 20 17.73 20 12.5V6.73c0-.67-.46-1.25-1.09-1.47L12 2z"/>
                </svg>
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-1zm0-8v6h2V7h-2z"/>
                </svg>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConversionZone;