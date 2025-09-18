import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

// Import UI Components
import StickyHeader from '../../components/ui/StickyHeader';
import MobileBottomBar from '../../components/ui/MobileBottomBar';
import ConversionModal from '../../components/ui/ConversionModal';

// Import Page Components
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import SolutionShowcase from './components/SolutionShowcase';
import TemplateGallery from './components/TemplateGallery';
import IntegrationSection from './components/IntegrationSection';
import SocialProofSection from './components/SocialProofSection';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import ConversionZone from './components/ConversionZone';
import Footer from './components/Footer';

const LandingPage = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'signup',
    templateData: null
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const openModal = (type, templateData = null) => {
    setModalState({
      isOpen: true,
      type,
      templateData
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: 'signup',
      templateData: null
    });
  };

  const handleSignupClick = () => {
    openModal('signup');
  };

  const handleDemoClick = () => {
    openModal('demo');
  };

  const handleTemplatePreview = (templateData) => {
    openModal('template-preview', templateData);
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
    <>
      <Helmet>
        <title>Mockup Gen - Create Professional Device Mockups in Seconds</title>
        <meta 
          name="description" 
          content="Transform your designs into stunning presentations with 500+ device templates. AI-powered mockup generation in under 30 seconds. Trusted by 150,000+ designers worldwide." 
        />
        <meta name="keywords" content="mockup generator, device mockups, design tools, figma plugin, sketch plugin, professional mockups" />
        <meta property="og:title" content="Mockup Gen - Create Professional Device Mockups in Seconds" />
        <meta property="og:description" content="Transform your designs into stunning presentations with 500+ device templates. AI-powered mockup generation in under 30 seconds." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mockupgen.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mockup Gen - Create Professional Device Mockups in Seconds" />
        <meta name="twitter:description" content="Transform your designs into stunning presentations with 500+ device templates. AI-powered mockup generation in under 30 seconds." />
        <link rel="canonical" href="https://mockupgen.com" />
      </Helmet>
      <div className="min-h-screen bg-white">
        {/* Sticky Header */}
        <StickyHeader 
          onSignupClick={handleSignupClick}
          onDemoClick={handleDemoClick}
        />

        {/* Main Content */}
        <main>
          {/* Hero Section */}
          <HeroSection 
            onStartCreating={handleSignupClick}
            onBrowseTemplates={handleBrowseTemplates}
          />

          {/* Problem Agitation */}
          <ProblemSection />

          {/* Solution Showcase */}
          <SolutionShowcase />

          {/* Template Gallery */}
          <TemplateGallery 
            onTemplatePreview={handleTemplatePreview}
          />

          {/* Integrations */}
          <IntegrationSection />

          {/* Social Proof */}
          <SocialProofSection />

          {/* Pricing */}
          <PricingSection 
            onSignupClick={handleSignupClick}
          />

          {/* FAQ */}
          <FAQSection />

          {/* Final Conversion Zone */}
          <ConversionZone 
            onSignupClick={handleSignupClick}
          />
        </main>

        {/* Footer */}
        <Footer />

        {/* Mobile Bottom Bar */}
        <MobileBottomBar 
          onSignupClick={handleSignupClick}
          onDemoClick={handleDemoClick}
        />

        {/* Conversion Modal */}
        <ConversionModal
          isOpen={modalState?.isOpen}
          type={modalState?.type}
          templateData={modalState?.templateData}
          onClose={closeModal}
        />
      </div>
    </>
  );
};

export default LandingPage;