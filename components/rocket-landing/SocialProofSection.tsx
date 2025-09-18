'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Check, Star, Clock, TrendingUp, Play } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  linkedinVerified: boolean;
  project: string;
  timeSaved: string;
}

interface CaseStudyResults {
  [key: string]: string;
}

interface CaseStudy {
  company: string;
  logo: string;
  challenge: string;
  solution: string;
  results: CaseStudyResults;
  quote: string;
  author: string;
}

interface Metric {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
}

interface CompanyLogo {
  name: string;
  logo: string;
}

interface AnimatedMetrics {
  mockups: number;
  users: number;
  timeSaved: number;
}

const SocialProofSection: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState<number>(0);
  const [animatedMetrics, setAnimatedMetrics] = useState<AnimatedMetrics>({
    mockups: 0,
    users: 0,
    timeSaved: 0
  });

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Senior UX Designer',
      company: 'Spotify',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      content: `Mockup Gen has completely transformed our design presentation workflow. What used to take me 2-3 hours now takes less than 5 minutes. The quality is consistently professional, and our clients love the polished look.`,
      rating: 5,
      linkedinVerified: true,
      project: 'Mobile App Redesign',
      timeSaved: '15 hours/week'
    },
    {
      id: 2,
      name: 'Marcus Rodriguez',
      role: 'Creative Director',
      company: 'Airbnb',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      content: `The Figma integration is seamless. Our entire design team can now create consistent, high-quality mockups without any technical knowledge. It's become an essential part of our toolkit.`,
      rating: 5,
      linkedinVerified: true,
      project: 'Brand Guidelines Update',
      timeSaved: '25 hours/week'
    },
    {
      id: 3,
      name: 'Emily Watson',
      role: 'Freelance Designer',
      company: 'Independent',
      avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      content: `As a freelancer, presentation quality is crucial for winning clients. Mockup Gen helps me deliver professional presentations that compete with large agencies. My client conversion rate has increased by 40%.`,
      rating: 5,
      linkedinVerified: true,
      project: 'E-commerce Platform',
      timeSaved: '12 hours/week'
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Product Manager',
      company: 'Netflix',
      avatar: 'https://randomuser.me/api/portraits/men/35.jpg',
      content: `The API integration allows us to automatically generate mockups for our A/B tests. We can now test design variations 10x faster than before. The ROI has been incredible.`,
      rating: 5,
      linkedinVerified: true,
      project: 'Streaming Interface Tests',
      timeSaved: '30 hours/week'
    }
  ];

  const caseStudies: CaseStudy[] = [
    {
      company: 'TechCorp Agency',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=40&fit=crop',
      challenge: 'Manual mockup creation was taking 40+ hours per client project',
      solution: 'Implemented Mockup Gen across all design workflows',
      results: {
        timeSaved: '85%',
        clientSatisfaction: '+32%',
        projectCapacity: '+150%'
      },
      quote: 'Mockup Gen allowed us to take on 2.5x more clients without hiring additional designers.',
      author: 'Jennifer Park, Creative Director'
    },
    {
      company: 'StartupXYZ',
      logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=40&fit=crop',
      challenge: 'Needed professional presentations for investor meetings on tight budget',
      solution: 'Used Mockup Gen to create investor-ready product mockups',
      results: {
        fundingRaised: '$2.5M',
        presentationTime: '-70%',
        investorFeedback: '+45%'
      },
      quote: 'The professional mockups helped us secure Series A funding. Investors were impressed.',
      author: 'Alex Thompson, CEO'
    }
  ];

  const metrics: Metric[] = [
    { label: 'Mockups Generated', value: 2000000, suffix: '+', prefix: '' },
    { label: 'Happy Designers', value: 150000, suffix: '+', prefix: '' },
    { label: 'Hours Saved Monthly', value: 500000, suffix: '+', prefix: '' },
    { label: 'Countries Served', value: 120, suffix: '+', prefix: '' }
  ];

  const companyLogos: CompanyLogo[] = [
    { name: 'Spotify', logo: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=120&h=40&fit=crop' },
    { name: 'Airbnb', logo: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=120&h=40&fit=crop' },
    { name: 'Netflix', logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=120&h=40&fit=crop' },
    { name: 'Uber', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=40&fit=crop' },
    { name: 'Shopify', logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=40&fit=crop' },
    { name: 'Slack', logo: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=120&h=40&fit=crop' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials?.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials?.length]);

  useEffect(() => {
    const animateMetrics = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;

        setAnimatedMetrics({
          mockups: Math.floor(2000000 * progress),
          users: Math.floor(150000 * progress),
          timeSaved: Math.floor(500000 * progress)
        });

        if (step >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
    };

    animateMetrics();
  }, []);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            <Users size={16} className="mr-2" />
            Trusted by 150,000+ Designers
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Join Thousands of Happy
            <span className="text-green-600 block">Design Professionals</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See why leading companies and independent designers choose Mockup Gen
            for their professional mockup needs.
          </p>
        </div>

        {/* Animated Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics?.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {metric?.prefix}
                {index === 0 ? animatedMetrics?.mockups?.toLocaleString() :
                 index === 1 ? animatedMetrics?.users?.toLocaleString() :
                 index === 2 ? animatedMetrics?.timeSaved?.toLocaleString() :
                 metric?.value?.toLocaleString()}
                {metric?.suffix}
              </div>
              <div className="text-sm text-slate-600">{metric?.label}</div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="mb-16">
          <p className="text-center text-slate-500 mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companyLogos?.map((company, index) => (
              <div key={index} className="h-12 w-32 bg-slate-200 rounded flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">{company?.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Testimonials */}
        <div className="mb-16">
          <div className="relative">
            {/* Main Testimonial */}
            <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-lg border border-slate-200 max-w-4xl mx-auto">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative w-16 h-16">
                    <Image
                      src={testimonials?.[currentTestimonial]?.avatar}
                      alt={testimonials?.[currentTestimonial]?.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  {testimonials?.[currentTestimonial]?.linkedinVerified && (
                    <div className="mt-2 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(testimonials?.[currentTestimonial]?.rating)]?.map((_, i) => (
                      <Star key={i} size={16} className="text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-lg text-slate-700 mb-4 leading-relaxed">
                    "{testimonials?.[currentTestimonial]?.content}"
                  </blockquote>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {testimonials?.[currentTestimonial]?.name}
                      </div>
                      <div className="text-slate-600 text-sm">
                        {testimonials?.[currentTestimonial]?.role} at {testimonials?.[currentTestimonial]?.company}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">Project: {testimonials?.[currentTestimonial]?.project}</div>
                      <div className="text-sm font-medium text-green-600">
                        Saves {testimonials?.[currentTestimonial]?.timeSaved}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentTestimonial ? 'bg-blue-600 w-8' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Floating Cards */}
            <div className="hidden lg:block absolute -left-8 top-1/2 transform -translate-y-1/2">
              <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg max-w-xs">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock size={16} />
                  <span className="text-sm font-medium">Time Saved</span>
                </div>
                <div className="text-2xl font-bold">2.5 hours</div>
                <div className="text-xs opacity-90">per mockup on average</div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-8 top-1/4 transform -translate-y-1/2">
              <div className="bg-blue-500 text-white rounded-lg p-4 shadow-lg max-w-xs">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp size={16} />
                  <span className="text-sm font-medium">Productivity</span>
                </div>
                <div className="text-2xl font-bold">240%</div>
                <div className="text-xs opacity-90">increase reported</div>
              </div>
            </div>
          </div>
        </div>

        {/* Case Studies */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {caseStudies?.map((study, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">{study?.company?.split(' ')?.[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{study?.company}</h3>
                  <p className="text-sm text-slate-600">Case Study</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Challenge</h4>
                  <p className="text-sm text-slate-600">{study?.challenge}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">Solution</h4>
                  <p className="text-sm text-slate-600">{study?.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {Object.entries(study?.results)?.map(([key, value], idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-xl font-bold text-green-600">{value}</div>
                    <div className="text-xs text-slate-500 capitalize">
                      {key?.replace(/([A-Z])/g, ' $1')?.trim()}
                    </div>
                  </div>
                ))}
              </div>

              <blockquote className="text-sm text-slate-700 italic mb-3">
                "{study?.quote}"
              </blockquote>
              <cite className="text-xs text-slate-500">— {study?.author}</cite>
            </div>
          ))}
        </div>

        {/* Video Testimonials */}
        <div className="bg-slate-900 rounded-2xl p-8 lg:p-12 text-white">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">See What Our Users Say</h3>
            <p className="text-slate-300">Watch real designers share their Mockup Gen experience</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3]?.map((video, index) => (
              <div key={index} className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden cursor-pointer group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Play size={24} className="text-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-sm font-medium">Designer Testimonial #{video}</div>
                  <div className="text-xs text-slate-300">2:30 min</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="flex items-center px-8 py-4 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors shadow-lg mx-auto">
              <Play size={16} className="mr-2" />
              Watch All Testimonials
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;