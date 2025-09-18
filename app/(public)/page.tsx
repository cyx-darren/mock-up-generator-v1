'use client';

import React, { useState, useEffect } from 'react';

// Import all Rocket landing page components
import HeroSection from '@/components/rocket-landing/HeroSection';
import ProblemSection from '@/components/rocket-landing/ProblemSection';
import SolutionShowcase from '@/components/rocket-landing/SolutionShowcase';
import TemplateGallery from '@/components/rocket-landing/TemplateGallery';
import IntegrationSection from '@/components/rocket-landing/IntegrationSection';
import SocialProofSection from '@/components/rocket-landing/SocialProofSection';
import PricingSection from '@/components/rocket-landing/PricingSection';
import FAQSection from '@/components/rocket-landing/FAQSection';
import ConversionZone from '@/components/rocket-landing/ConversionZone';
import Footer from '@/components/rocket-landing/Footer';
import NavigationBar from '@/components/navigation/NavigationBar';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSignupClick = () => {
    // Redirect to catalog page
    window.location.href = '/catalog';
  };

  const handleBrowseTemplates = () => {
    const templatesSection = document.getElementById('templates');
    if (templatesSection) {
      templatesSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Mockup Gen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavigationBar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection
          onStartCreating={handleSignupClick}
          onBrowseTemplates={handleBrowseTemplates}
        />

        {/* Problem Section */}
        <ProblemSection />

        {/* Solution Showcase */}
        <div id="how-it-works">
          <SolutionShowcase />
        </div>

        {/* Template Gallery */}
        <div id="templates">
          <TemplateGallery />
        </div>

        {/* Integration Section */}
        <IntegrationSection />

        {/* Social Proof Section */}
        <SocialProofSection />

        {/* Pricing Section */}
        <div id="pricing">
          <PricingSection
            onGetStarted={handleSignupClick}
          />
        </div>

        {/* FAQ Section */}
        <div id="faq">
          <FAQSection />
        </div>

        {/* Conversion Zone */}
        <ConversionZone
          onStartCreating={handleSignupClick}
        />

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}