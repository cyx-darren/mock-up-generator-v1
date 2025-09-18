import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const HeroSection = ({ onStartCreating, onBrowseTemplates }) => {
  const [currentMockup, setCurrentMockup] = useState(0);
  const [mockupsGenerated, setMockupsGenerated] = useState(47832);

  const mockupFrames = [
    {
      device: 'iPhone 15 Pro',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=600&fit=crop',
      color: '#1d1d1f'
    },
    {
      device: 'MacBook Pro',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      color: '#f5f5f7'
    },
    {
      device: 'iPad Air',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=500&fit=crop',
      color: '#2c2c2e'
    }
  ];

  const companyLogos = [
    { name: 'Spotify', logo: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=120&h=40&fit=crop' },
    { name: 'Airbnb', logo: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=120&h=40&fit=crop' },
    { name: 'Netflix', logo: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=120&h=40&fit=crop' },
    { name: 'Uber', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&h=40&fit=crop' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMockup((prev) => (prev + 1) % mockupFrames?.length);
    }, 3000);

    const counterInterval = setInterval(() => {
      setMockupsGenerated(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(counterInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-5rem)]">
          {/* Left Side - Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Icon name="Zap" size={16} className="mr-2" />
              New: AI-Powered Template Suggestions
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Create Professional
              <span className="text-blue-600 block">Mockups in Seconds</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl">
              Transform your designs into stunning presentations with 500+ device templates. 
              No design skills required – just upload, select, and download.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                variant="default"
                size="lg"
                onClick={onStartCreating}
                iconName="ArrowRight"
                iconPosition="right"
                className="shadow-cta text-lg px-8 py-4"
              >
                Start Creating Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onBrowseTemplates}
                iconName="Eye"
                iconPosition="left"
                className="text-lg px-8 py-4"
              >
                Browse Templates
              </Button>
            </div>

            {/* Trust Elements */}
            <div className="space-y-6">
              <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Icon name="Shield" size={16} className="text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Icon name="Clock" size={16} className="text-blue-500" />
                  <span>Setup in 30 seconds</span>
                </div>
              </div>

              {/* Real-time Counter */}
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 inline-block">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-700 font-medium">
                    {mockupsGenerated?.toLocaleString()} mockups generated today
                  </span>
                </div>
              </div>

              {/* Company Logos */}
              <div className="pt-4">
                <p className="text-sm text-slate-500 mb-4">Trusted by teams at</p>
                <div className="flex items-center justify-center lg:justify-start space-x-8 opacity-60">
                  {companyLogos?.map((company, index) => (
                    <div key={index} className="h-8 w-24 bg-slate-200 rounded flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">{company?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Animated Mockup Generator */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Live Mockup Generator</h3>
                <p className="text-sm text-slate-600">Watch your designs come to life</p>
              </div>

              {/* Mockup Display */}
              <div className="relative h-80 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative transform transition-all duration-1000 ease-in-out">
                    {mockupFrames?.[currentMockup]?.device === 'iPhone 15 Pro' && (
                      <div className="w-48 h-72 bg-slate-800 rounded-3xl p-2 shadow-xl">
                        <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                          <Image
                            src={mockupFrames?.[currentMockup]?.image}
                            alt="App mockup"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {mockupFrames?.[currentMockup]?.device === 'MacBook Pro' && (
                      <div className="w-64 h-40 bg-slate-300 rounded-lg p-2 shadow-xl">
                        <div className="w-full h-full bg-white rounded overflow-hidden">
                          <Image
                            src={mockupFrames?.[currentMockup]?.image}
                            alt="Website mockup"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {mockupFrames?.[currentMockup]?.device === 'iPad Air' && (
                      <div className="w-56 h-72 bg-slate-700 rounded-2xl p-3 shadow-xl">
                        <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                          <Image
                            src={mockupFrames?.[currentMockup]?.image}
                            alt="Tablet mockup"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-xs font-medium text-slate-700">
                    {mockupFrames?.[currentMockup]?.device}
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 bg-green-500 text-white rounded-lg px-3 py-2 shadow-sm">
                  <span className="text-xs font-medium">Ready!</span>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="flex justify-center space-x-2 mb-4">
                {mockupFrames?.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentMockup ? 'bg-blue-500 w-6' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Upload"
                  iconPosition="left"
                  className="flex-1"
                >
                  Upload Design
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  className="flex-1"
                >
                  Download
                </Button>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -top-4 -right-4 bg-blue-500 text-white rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">30s</div>
                <div className="text-xs opacity-90">Average time</div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-green-500 text-white rounded-xl p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-xs opacity-90">Templates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>
    </section>
  );
};

export default HeroSection;