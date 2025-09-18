'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';

const SocialProofSection = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      company: 'TechCorp Solutions',
      image: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=3B82F6&color=fff',
      content: 'This tool has revolutionized our corporate gift presentations. What used to take days now takes minutes. The quality is exceptional!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      role: 'Brand Manager',
      company: 'Global Retail Inc',
      image: 'https://ui-avatars.com/api/?name=Michael+Rodriguez&background=8B5CF6&color=fff',
      content: 'The AI-powered mockup generation is incredibly accurate. Our clients are impressed with the professional presentations we create.',
      rating: 5
    },
    {
      name: 'Emily Watson',
      role: 'Creative Director',
      company: 'Design Studios Pro',
      image: 'https://ui-avatars.com/api/?name=Emily+Watson&background=EC4899&color=fff',
      content: 'As a design professional, I\'m amazed by the quality. It\'s become an essential tool in our workflow for client presentations.',
      rating: 5
    }
  ];

  const stats = [
    { value: '150K+', label: 'Happy Users' },
    { value: '2M+', label: 'Mockups Created' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '500+', label: 'Templates' }
  ];

  const companies = [
    'TechCorp', 'DesignHub', 'BrandMax', 'Creative Co', 'Marketing Pro', 'Global Retail'
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Trusted by{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              150,000+ Businesses
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From startups to Fortune 500 companies, businesses trust us for their mockup needs
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <Quote className="w-8 h-8 text-blue-200 dark:text-blue-800 mb-4" />

              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center space-x-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company Logos */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            Trusted by leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companies.map((company, index) => (
              <div
                key={index}
                className="text-2xl font-bold text-gray-400 dark:text-gray-600"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;