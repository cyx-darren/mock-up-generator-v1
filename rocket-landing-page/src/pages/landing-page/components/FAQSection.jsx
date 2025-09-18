import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const FAQSection = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'general', name: 'General', icon: 'HelpCircle' },
    { id: 'pricing', name: 'Pricing & Plans', icon: 'CreditCard' },
    { id: 'technical', name: 'Technical', icon: 'Settings' },
    { id: 'licensing', name: 'Licensing', icon: 'FileText' },
    { id: 'integrations', name: 'Integrations', icon: 'Puzzle' }
  ];

  const faqs = [
    {
      category: 'general',
      question: 'What is Mockup Gen and how does it work?',
      answer: `Mockup Gen is an AI-powered tool that automatically creates professional device mockups from your designs. Simply upload your design (screenshot, image, or connect via our plugins), choose from 500+ device templates, and our AI positions your design perfectly within the device frame. The entire process takes less than 30 seconds.`
    },
    {
      category: 'general',
      question: 'What file formats do you support for uploads?',
      answer: `We support all major image formats including PNG, JPG, JPEG, GIF, WebP, and SVG. For best results, we recommend PNG files with transparent backgrounds. Maximum file size is 50MB per upload.`
    },
    {
      category: 'general',
      question: 'How accurate is the AI positioning?',
      answer: `Our AI achieves 95%+ accuracy in automatically positioning designs within device frames. It intelligently detects screen areas, maintains aspect ratios, and applies realistic perspective. You can also manually adjust positioning if needed.`
    },
    {
      category: 'pricing',
      question: 'Is there really a free plan?',
      answer: `Yes! Our free plan includes 5 mockups per month, access to 10 device templates, and basic export options. It's perfect for trying out the service. The only limitation is that downloads include a small watermark.`
    },
    {
      category: 'pricing',question: 'Can I cancel my subscription anytime?',answer: `Absolutely. You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll continue to have access to your paid features until the end of your billing period.`
    },
    {
      category: 'pricing',
      question: 'Do you offer refunds?',
      answer: `We offer a 30-day money-back guarantee for all paid plans. If you're not completely satisfied with Mockup Gen, contact our support team within 30 days of your purchase for a full refund.`
    },
    {
      category: 'pricing',question: 'What payment methods do you accept?',
      answer: `We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for Enterprise plans. All payments are processed securely through Stripe.`
    },
    {
      category: 'technical',question: 'What output formats and resolutions are available?',
      answer: `Free users get PNG exports up to 1080p. Pro users can export in PNG, JPG, and PDF formats up to 4K resolution. Enterprise users get all formats plus custom resolutions up to 8K and vector formats.`
    },
    {
      category: 'technical',question: 'How do the design tool integrations work?',
      answer: `Our plugins for Figma, Sketch, and Adobe Creative Suite allow you to export designs directly to Mockup Gen without leaving your design tool. Simply select your artboard, choose a template, and the mockup is generated automatically.`
    },
    {
      category: 'technical',question: 'Is there an API for developers?',
      answer: `Yes! Pro users get limited API access, while Enterprise users get full API access with webhooks, bulk processing, and custom integrations. Our REST API supports all major programming languages.`
    },
    {
      category: 'technical',question: 'What are your system requirements?',
      answer: `Mockup Gen works in any modern web browser (Chrome, Firefox, Safari, Edge). For plugins, you need Figma (web or desktop), Sketch 70+, or Adobe CC 2020+. No additional software installation required.`
    },
    {
      category: 'licensing',question: 'Can I use mockups for commercial projects?',
      answer: `Pro and Enterprise users get full commercial licenses for all mockups created. This includes client work, marketing materials, app store screenshots, and resale. Free users get personal use only.`
    },
    {
      category: 'licensing',question: 'Who owns the rights to generated mockups?',answer: `You retain full ownership of your original designs. The generated mockups are yours to use according to your plan's license terms. We don't claim any rights to your content or designs.`
    },
    {
      category: 'licensing',question: 'Can I remove the watermark from free mockups?',
      answer: `Watermarks can only be removed by upgrading to a paid plan. This helps us keep the free tier available for everyone while supporting our development costs.`
    },
    {
      category: 'integrations',question: 'Which design tools do you integrate with?',
      answer: `We have official plugins for Figma, Sketch, Adobe Photoshop, Illustrator, and XD. We also support direct uploads from any design tool and have API integrations for custom workflows.`
    },
    {
      category: 'integrations',question: 'How do I install the Figma plugin?',
      answer: `Search for "Mockup Gen" in the Figma Community plugins, or visit our Figma plugin page. Click install, and you'll find Mockup Gen in your plugins menu. The setup takes less than 2 minutes.`
    },
    {
      category: 'integrations',
      question: 'Can I use Mockup Gen with my team\'s workflow?',
      answer: `Yes! Enterprise plans include team collaboration features, shared template libraries, brand guidelines integration, and SSO. You can also use our API to integrate with your existing design systems.`
    }
  ];

  const filteredFAQs = faqs?.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq?.category === activeCategory;
    const matchesSearch = !searchQuery || 
      faq?.question?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      faq?.answer?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularQuestions = [
    'How does the free plan work?',
    'Can I use mockups commercially?',
    'What file formats are supported?',
    'How do I install plugins?'
  ];

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Icon name="HelpCircle" size={16} className="mr-2" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Got Questions?
            <span className="text-blue-600 block">We've Got Answers</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Find answers to common questions about Mockup Gen, pricing, 
            integrations, and more. Can't find what you're looking for?
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Icon name="Search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search FAQs (e.g., pricing, commercial use, file formats...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          
          {/* Popular Questions */}
          {!searchQuery && (
            <div className="mt-4 text-center">
              <span className="text-sm text-slate-500 mr-3">Popular:</span>
              {popularQuestions?.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(question?.split('?')?.[0])}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline mr-4 mb-2"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories?.map((category) => (
            <button
              key={category?.id}
              onClick={() => setActiveCategory(category?.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeCategory === category?.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200'
              }`}
            >
              <Icon name={category?.icon} size={16} />
              <span>{category?.name}</span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-16">
          {filteredFAQs?.length > 0 ? (
            filteredFAQs?.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq?.question}</span>
                  <Icon
                    name={expandedFAQ === index ? "ChevronUp" : "ChevronDown"}
                    size={20}
                    className="text-slate-400 flex-shrink-0"
                  />
                </button>
                
                {expandedFAQ === index && (
                  <div className="px-6 pb-4 border-t border-slate-100">
                    <p className="text-slate-700 leading-relaxed pt-4">{faq?.answer}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Icon name="Search" size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
              <p className="text-slate-600 mb-4">
                Try adjusting your search terms or browse by category
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('general');
                }}
                iconName="RotateCcw"
                iconPosition="left"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-blue-100" />
            <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
            <p className="text-blue-100 mb-8">
              Our support team is here to help. Get answers from real humans who know 
              Mockup Gen inside and out.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="default"
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 shadow-cta"
                iconName="Mail"
                iconPosition="left"
              >
                Email Support
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                iconName="MessageSquare"
                iconPosition="left"
              >
                Live Chat
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-blue-100">
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={16} />
                <span>24/7 support for Pro+ users</span>
              </div>
              <div className="flex items-center space-x-1">
                <Icon name="Zap" size={16} />
                <span>Average response: 2 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Base Link */}
        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            Looking for tutorials and guides?
          </p>
          <Button
            variant="outline"
            iconName="BookOpen"
            iconPosition="left"
          >
            Visit Knowledge Base
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;