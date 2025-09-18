import React, { useState, useEffect } from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const StickyHeader = ({ onSignupClick, onDemoClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Templates', href: '#templates' },
    { name: 'Integrations', href: '#integrations' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Help', href: '/help' }
  ];

  const scrollToSection = (href) => {
    if (href?.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = href;
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon name="Smartphone" size={20} color="white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Mockup Gen</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems?.map((item) => (
              <button
                key={item?.name}
                onClick={() => scrollToSection(item?.href)}
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                {item?.name}
              </button>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onDemoClick}
              iconName="Play"
              iconPosition="left"
            >
              Watch Demo
            </Button>
            <Button
              variant="default"
              onClick={onSignupClick}
              iconName="ArrowRight"
              iconPosition="right"
              className="shadow-cta"
            >
              Start Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {navItems?.map((item) => (
                <button
                  key={item?.name}
                  onClick={() => scrollToSection(item?.href)}
                  className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium py-2"
                >
                  {item?.name}
                </button>
              ))}
              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={onDemoClick}
                  iconName="Play"
                  iconPosition="left"
                >
                  Watch Demo
                </Button>
                <Button
                  variant="default"
                  fullWidth
                  onClick={onSignupClick}
                  iconName="ArrowRight"
                  iconPosition="right"
                >
                  Start Free
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default StickyHeader;