'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock, Zap, X, Check, ArrowRight } from 'lucide-react';

interface ProblemScenario {
  title: string;
  time: string;
  steps: string[];
  frustrations: string[];
}

interface SolutionBenefit {
  title: string;
  time: string;
  steps: string[];
  benefits: string[];
}

interface TimelineStep {
  traditional: string;
  time: string;
  mockupGen: string;
  newTime: string;
}

const ProblemSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  const problemScenarios: ProblemScenario[] = [
    {
      title: 'Manual Mockup Creation',
      time: '2-4 hours',
      steps: [
        'Search for device templates online',
        'Download and organize files',
        'Open design software',
        'Manually position your design',
        'Adjust shadows and reflections',
        'Export in multiple formats'
      ],
      frustrations: [
        'Time-consuming process',
        'Inconsistent quality',
        'Limited template options',
        'Technical skills required'
      ]
    }
  ];

  const solutionBenefits: SolutionBenefit[] = [
    {
      title: 'Automated Mockup Generation',
      time: '30 seconds',
      steps: [
        'Upload your design',
        'Choose from 500+ templates',
        'AI auto-positions perfectly',
        'Download instantly'
      ],
      benefits: [
        'Lightning-fast results',
        'Professional quality',
        'Huge template library',
        'No design skills needed'
      ]
    }
  ];

  const timelineSteps: TimelineStep[] = [
    { traditional: 'Search for templates', time: '15-30 min', mockupGen: 'Browse 500+ templates', newTime: '30 sec' },
    { traditional: 'Download & setup files', time: '10-20 min', mockupGen: 'One-click selection', newTime: '5 sec' },
    { traditional: 'Manual positioning', time: '45-90 min', mockupGen: 'AI auto-positioning', newTime: '10 sec' },
    { traditional: 'Adjust & export', time: '30-60 min', mockupGen: 'Instant download', newTime: '5 sec' }
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
            <AlertTriangle size={16} className="mr-2" />
            The Problem Every Designer Faces
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Stop Wasting Hours on
            <span className="text-red-600 block">Manual Mockup Creation</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Traditional mockup creation is slow, frustrating, and inconsistent.
            See how Mockup Gen transforms your workflow from hours to seconds.
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
              <button
                onClick={() => setActiveTab('before')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'before'
                    ? 'bg-red-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Before: Traditional Way
              </button>
              <button
                onClick={() => setActiveTab('after')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'after' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                After: Mockup Gen
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Before - Traditional Process */}
            <div className={`transition-all duration-500 ${activeTab === 'before' ? 'opacity-100' : 'opacity-50'}`}>
              <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <Clock size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Traditional Process</h3>
                    <p className="text-red-600 font-medium">2-4 hours per mockup</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {problemScenarios[0]?.steps?.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-red-600">{index + 1}</span>
                      </div>
                      <span className="text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Common Frustrations:</h4>
                  <div className="space-y-2">
                    {problemScenarios[0]?.frustrations?.map((frustration, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <X size={16} className="text-red-500" />
                        <span className="text-slate-600 text-sm">{frustration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* After - Mockup Gen Process */}
            <div className={`transition-all duration-500 ${activeTab === 'after' ? 'opacity-100' : 'opacity-50'}`}>
              <div className="bg-white rounded-xl p-8 shadow-lg border border-green-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <Zap size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Mockup Gen Process</h3>
                    <p className="text-green-600 font-medium">30 seconds per mockup</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {solutionBenefits[0]?.steps?.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-green-600">{index + 1}</span>
                      </div>
                      <span className="text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Key Benefits:</h4>
                  <div className="space-y-2">
                    {solutionBenefits[0]?.benefits?.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check size={16} className="text-green-500" />
                        <span className="text-slate-600 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Timeline */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Time Comparison Breakdown</h3>
            <p className="text-slate-600">See exactly where Mockup Gen saves you time</p>
          </div>

          <div className="space-y-6">
            {timelineSteps?.map((step, index) => (
              <div key={index} className="grid md:grid-cols-3 gap-6 items-center">
                {/* Traditional Way */}
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{step?.traditional}</span>
                    <span className="text-sm font-bold text-red-600">{step?.time}</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* VS Arrow */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowRight size={20} className="text-blue-600" />
                  </div>
                </div>

                {/* Mockup Gen Way */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{step?.mockupGen}</span>
                    <span className="text-sm font-bold text-green-600">{step?.newTime}</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">240x</div>
                <div className="text-sm text-slate-600">Faster than traditional methods</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">$2,400</div>
                <div className="text-sm text-slate-600">Average time saved per month*</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">98%</div>
                <div className="text-sm text-slate-600">Less effort required</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">
              *Based on average designer hourly rate of $50 and 20 mockups per month
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;