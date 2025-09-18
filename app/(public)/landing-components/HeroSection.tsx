'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Eye, Shield, Users, Zap, Star } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.png';

const HeroSection = ({ onStartCreating, onBrowseTemplates }: {
  onStartCreating?: () => void;
  onBrowseTemplates?: () => void;
}) => {
  const [mockupsGenerated, setMockupsGenerated] = useState(47832);
  const [currentMockup, setCurrentMockup] = useState(0);

  const mockupExamples = [
    'Tote Bags', 'Notebooks', 'Water Bottles', 'T-Shirts', 'Mugs'
  ];

  useEffect(() => {
    const counterInterval = setInterval(() => {
      setMockupsGenerated(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    const mockupInterval = setInterval(() => {
      setCurrentMockup((prev) => (prev + 1) % mockupExamples.length);
    }, 2500);

    return () => {
      clearInterval(counterInterval);
      clearInterval(mockupInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 lg:pt-24 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-5rem)]">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-4 h-4 mr-2" />
              New: AI-Powered Mockup Generation
            </div>

            {/* Main heading with animation */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Create Stunning Mockups for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Corporate Gifts
              </span>
              <div className="text-2xl sm:text-3xl lg:text-4xl mt-2 text-gray-700">
                in Under 30 Seconds
              </div>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
              Transform your logo into professional mockups on {mockupExamples[currentMockup]} and
              500+ corporate gift items. No design skills required – just upload, select, and download.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center lg:justify-start">
              <Link href="/create">
                <Button
                  size="lg"
                  className="group shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/catalog">
                <Button
                  variant="secondary"
                  size="lg"
                  className="group shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Browse Templates
                </Button>
              </Link>
            </div>

            {/* Trust Elements */}
            <div className="space-y-6">
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>{mockupsGenerated.toLocaleString()}+ mockups created</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  Rated 4.9/5 from 2,000+ reviews
                </span>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative h-[400px] lg:h-[600px] animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-3xl" />
            <Image
              src={heroBanner}
              alt="Corporate gift mockup examples showcasing various branded products"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />

            {/* Floating badges */}
            <div className="absolute top-10 right-10 bg-white rounded-lg shadow-lg px-4 py-2 animate-float">
              <div className="text-sm font-semibold text-gray-900">500+ Templates</div>
            </div>
            <div className="absolute bottom-10 left-10 bg-white rounded-lg shadow-lg px-4 py-2 animate-float animation-delay-2000">
              <div className="text-sm font-semibold text-gray-900">AI-Powered</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-scroll" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;