'use client';

import React from 'react';
import { X, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';

const ProblemSection = () => {
  const problems = [
    {
      icon: Clock,
      title: 'Time-Consuming Design Process',
      description: 'Hours spent creating mockups manually in design software',
      stat: '3-5 hours',
      statLabel: 'per mockup project'
    },
    {
      icon: DollarSign,
      title: 'Expensive Design Resources',
      description: 'Hiring designers or agencies for simple mockup needs',
      stat: '$500+',
      statLabel: 'average design cost'
    },
    {
      icon: Users,
      title: 'Client Presentation Delays',
      description: 'Waiting days for mockup revisions and approvals',
      stat: '72%',
      statLabel: 'of projects delayed'
    },
    {
      icon: AlertCircle,
      title: 'Inconsistent Quality',
      description: 'Varying quality across different designers and tools',
      stat: '45%',
      statLabel: 'require revisions'
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            The Challenge with Traditional Mockup Creation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Businesses struggle with slow, expensive, and inconsistent mockup creation processes
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <X className="w-5 h-5 text-red-500 opacity-50" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {problem.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {problem.description}
                </p>
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {problem.stat}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                    {problem.statLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
            There has to be a better way...
          </p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            And there is! ✨
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;