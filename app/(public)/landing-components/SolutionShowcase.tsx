'use client';

import React from 'react';
import { Check, Zap, Sparkles, Download, Palette, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const SolutionShowcase = () => {
  const solutions = [
    {
      icon: Zap,
      title: '30-Second Generation',
      description: 'Upload your logo and get professional mockups instantly',
      highlight: '100x faster'
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Intelligence',
      description: 'Smart logo placement and background removal technology',
      highlight: 'Zero effort'
    },
    {
      icon: Palette,
      title: '500+ Premium Templates',
      description: 'Corporate gifts, apparel, stationery, and more',
      highlight: 'Always expanding'
    },
    {
      icon: Download,
      title: 'Multiple Export Formats',
      description: 'Download in PNG, JPG, or WebP at any resolution',
      highlight: 'Print-ready'
    }
  ];

  const beforeAfter = [
    { before: 'Hours of manual work', after: '30 seconds automated' },
    { before: '$500+ design costs', after: 'Free to start' },
    { before: 'Days of back-and-forth', after: 'Instant results' },
    { before: 'Inconsistent quality', after: 'Professional every time' }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium mb-4">
            <Check className="w-4 h-4 mr-2" />
            The Solution
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Mockup Generation,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Reimagined
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Our AI-powered platform transforms how businesses create professional mockups
          </p>
        </div>

        {/* Solution Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-blue-100 dark:border-blue-800"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {solution.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {solution.description}
                    </p>
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
                      {solution.highlight}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before/After Comparison */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 lg:p-12">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            See the Difference
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                ❌ Traditional Way
              </h4>
              {beforeAfter.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item.before}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
                ✅ With Our Platform
              </h4>
              {beforeAfter.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item.after}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link href="/create">
            <Button
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Try It Now - It's Free
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            No credit card required • 5 free mockups to start
          </p>
        </div>
      </div>
    </section>
  );
};

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default SolutionShowcase;