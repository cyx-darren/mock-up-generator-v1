'use client';

import React from 'react';
import { Check, Mail, Smartphone, Twitter, Linkedin, Instagram, Youtube, Github, Globe, Shield, Lock, Award, Zap } from 'lucide-react';

interface FooterLink {
  name: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  name: string;
  icon: string;
  href: string;
}

const Footer: React.FC = () => {
  const currentYear = new Date()?.getFullYear();

  const footerSections: FooterSection[] = [
    {
      title: 'Product',
      links: [
        { name: 'Templates', href: '#templates' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'Integrations', href: '#integrations' },
        { name: 'API Documentation', href: '/api-docs' },
        { name: 'Changelog', href: '/changelog' },
        { name: 'Roadmap', href: '/roadmap' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Tutorials', href: '/tutorials' },
        { name: 'Blog', href: '/blog' },
        { name: 'Design Guidelines', href: '/guidelines' },
        { name: 'Template Library', href: '/templates' },
        { name: 'Community', href: '/community' }
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Careers', href: '/careers' },
        { name: 'Press Kit', href: '/press' },
        { name: 'Partners', href: '/partners' },
        { name: 'Affiliate Program', href: '/affiliates' },
        { name: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Cookie Policy', href: '/cookies' },
        { name: 'GDPR', href: '/gdpr' },
        { name: 'License Agreement', href: '/license' },
        { name: 'Refund Policy', href: '/refunds' }
      ]
    }
  ];

  const socialLinks: SocialLink[] = [
    { name: 'Twitter', icon: 'Twitter', href: 'https://twitter.com/mockupgen' },
    { name: 'LinkedIn', icon: 'Linkedin', href: 'https://linkedin.com/company/mockupgen' },
    { name: 'Instagram', icon: 'Instagram', href: 'https://instagram.com/mockupgen' },
    { name: 'YouTube', icon: 'Youtube', href: 'https://youtube.com/mockupgen' },
    { name: 'GitHub', icon: 'Github', href: 'https://github.com/mockupgen' }
  ];

  const features: string[] = [
    'AI-Powered Positioning',
    '500+ Device Templates',
    'Figma & Sketch Plugins',
    'Commercial License',
    '4K Export Quality',
    'API Integration'
  ];

  const getSocialIcon = (iconName: string) => {
    switch (iconName) {
      case 'Twitter':
        return Twitter;
      case 'Linkedin':
        return Linkedin;
      case 'Instagram':
        return Instagram;
      case 'Youtube':
        return Youtube;
      case 'Github':
        return Github;
      default:
        return Twitter;
    }
  };

  return (
    <footer className="bg-slate-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Stay Updated with Mockup Gen</h3>
              <p className="text-slate-300 mb-6">
                Get the latest templates, features, and design tips delivered to your inbox.
                Join 50,000+ designers who never miss an update.
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Check size={16} className="text-green-400" />
                <span>Weekly design tips</span>
                <Check size={16} className="text-green-400" />
                <span>New template alerts</span>
                <Check size={16} className="text-green-400" />
                <span>Exclusive discounts</span>
              </div>
            </div>
            <div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg">
                  <Mail size={16} className="mr-2" />
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                No spam. Unsubscribe anytime. Read our{' '}
                <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Smartphone size={20} color="white" />
              </div>
              <span className="text-xl font-bold">Mockup Gen</span>
            </div>
            <p className="text-slate-300 mb-6 leading-relaxed">
              The fastest way to create professional device mockups. Trusted by 150,000+
              designers worldwide for client presentations, portfolios, and marketing materials.
            </p>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {features?.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check size={14} className="text-green-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">{feature}</span>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks?.map((social) => {
                const IconComponent = getSocialIcon(social?.icon);
                return (
                  <a
                    key={social?.name}
                    href={social?.href}
                    className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    aria-label={social?.name}
                  >
                    <IconComponent size={18} className="text-slate-300" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections?.map((section) => (
            <div key={section?.title}>
              <h4 className="font-semibold text-white mb-4">{section?.title}</h4>
              <ul className="space-y-3">
                {section?.links?.map((link) => (
                  <li key={link?.name}>
                    <a
                      href={link?.href}
                      className="text-slate-300 hover:text-white transition-colors text-sm"
                    >
                      {link?.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-slate-400">
              <span>© {currentYear} Mockup Gen. All rights reserved.</span>
              <div className="flex items-center space-x-4">
                <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                <a href="/cookies" className="hover:text-white transition-colors">Cookies</a>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-400">All systems operational</span>
              </div>

              {/* Language Selector */}
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-slate-400" />
                <select className="bg-transparent text-slate-400 text-sm border-none focus:outline-none cursor-pointer">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-green-400" />
              <span className="text-xs text-slate-400">SSL Secured</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock size={16} className="text-blue-400" />
              <span className="text-xs text-slate-400">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Award size={16} className="text-yellow-400" />
              <span className="text-xs text-slate-400">SOC 2 Certified</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-purple-400" />
              <span className="text-xs text-slate-400">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;