'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How does the AI-powered mockup generation work?',
      answer: 'Our AI technology automatically detects your logo, removes backgrounds, and intelligently places it on product templates. The system analyzes your logo\'s colors and composition to ensure optimal placement and visibility on each product.'
    },
    {
      question: 'What file formats can I upload for my logo?',
      answer: 'We support all major image formats including PNG, JPG, JPEG, SVG, and WebP. For best results, we recommend using PNG files with transparent backgrounds or high-resolution vector formats like SVG.'
    },
    {
      question: 'Can I customize the mockup after generation?',
      answer: 'Yes! After the initial AI generation, you can adjust logo placement (horizontal, vertical, or all-over print), resize your logo, change product colors, and select different angles or views of the product.'
    },
    {
      question: 'What types of corporate gifts are available?',
      answer: 'We offer 500+ templates across categories including apparel (t-shirts, hoodies, caps), drinkware (mugs, bottles), stationery (notebooks, pens), tech accessories (phone cases, laptop sleeves), bags (totes, backpacks), and promotional items.'
    },
    {
      question: 'Is there a limit to how many mockups I can create?',
      answer: 'Free users can create up to 5 mockups per month. Our Pro plan offers unlimited mockup generation, access to premium templates, and high-resolution downloads. Enterprise plans include bulk processing and API access.'
    },
    {
      question: 'How long does it take to generate a mockup?',
      answer: 'Most mockups are generated in under 30 seconds. Complex designs or bulk processing may take slightly longer, but you\'ll never wait more than a minute for your professional mockup to be ready.'
    },
    {
      question: 'Can I use the generated mockups for commercial purposes?',
      answer: 'Yes! All mockups generated through our platform can be used for commercial purposes, including client presentations, marketing materials, e-commerce listings, and print production.'
    },
    {
      question: 'Do you offer team collaboration features?',
      answer: 'Our Business and Enterprise plans include team collaboration features such as shared workspaces, brand asset libraries, approval workflows, and centralized billing for multiple users.'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <HelpCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about our mockup generator
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Still have questions?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@mockupgen.com"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/docs"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;