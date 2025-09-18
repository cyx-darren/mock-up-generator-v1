import React, { useState, useMemo } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const TemplateGallery = ({ onTemplatePreview }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const categories = [
    { id: 'all', name: 'All Templates', count: 500 },
    { id: 'mobile', name: 'Mobile Devices', count: 180 },
    { id: 'laptop', name: 'Laptops', count: 85 },
    { id: 'tablet', name: 'Tablets', count: 65 },
    { id: 'desktop', name: 'Desktop', count: 45 },
    { id: 'wearable', name: 'Wearables', count: 35 },
    { id: 'print', name: 'Print Materials', count: 55 },
    { id: 'social', name: 'Social Media', count: 35 }
  ];

  const templates = [
    {
      id: 1,
      name: 'iPhone 15 Pro Max',
      category: 'mobile',
      preview: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=600&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=600&fit=crop',
      popular: true,
      new: false,
      colors: ['Space Black', 'Silver', 'Gold', 'Deep Purple']
    },
    {
      id: 2,
      name: 'MacBook Pro 16"',
      category: 'laptop',
      preview: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      popular: true,
      new: false,
      colors: ['Space Gray', 'Silver']
    },
    {
      id: 3,
      name: 'iPad Air',
      category: 'tablet',
      preview: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=500&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=500&fit=crop',
      popular: false,
      new: true,
      colors: ['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue']
    },
    {
      id: 4,
      name: 'Samsung Galaxy S24',
      category: 'mobile',
      preview: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=600&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=600&fit=crop',
      popular: false,
      new: true,
      colors: ['Phantom Black', 'Cream', 'Lavender', 'Jade Green']
    },
    {
      id: 5,
      name: 'iMac 24"',
      category: 'desktop',
      preview: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=400&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=400&fit=crop',
      popular: true,
      new: false,
      colors: ['Blue', 'Green', 'Pink', 'Silver', 'Yellow', 'Orange', 'Purple']
    },
    {
      id: 6,
      name: 'Apple Watch Series 9',
      category: 'wearable',
      preview: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300&h=300&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1579586337278-3f436f25d4d6?w=300&h=300&fit=crop',
      popular: false,
      new: true,
      colors: ['Midnight', 'Starlight', 'Silver', 'Gold', 'Red']
    },
    {
      id: 7,
      name: 'Business Card',
      category: 'print',
      preview: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=400&h=250&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
      popular: false,
      new: false,
      colors: ['White', 'Cream', 'Black']
    },
    {
      id: 8,
      name: 'Instagram Post',
      category: 'social',
      preview: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=400&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=400&fit=crop',
      popular: true,
      new: false,
      colors: ['Default']
    },
    {
      id: 9,
      name: 'Surface Laptop Studio',
      category: 'laptop',
      preview: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?w=600&h=400&fit=crop',
      popular: false,
      new: true,
      colors: ['Platinum', 'Matte Black']
    },
    {
      id: 10,
      name: 'Google Pixel 8 Pro',
      category: 'mobile',
      preview: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=300&h=600&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=300&h=600&fit=crop',
      popular: false,
      new: true,
      colors: ['Obsidian', 'Porcelain', 'Bay']
    },
    {
      id: 11,
      name: 'Poster Mockup',
      category: 'print',
      preview: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop',
      popular: false,
      new: false,
      colors: ['White', 'Cream']
    },
    {
      id: 12,
      name: 'Facebook Post',
      category: 'social',
      preview: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=500&h=300&fit=crop',
      mockup: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=500&h=300&fit=crop',
      popular: true,
      new: false,
      colors: ['Default']
    }
  ];

  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    if (activeCategory !== 'all') {
      filtered = filtered?.filter(template => template?.category === activeCategory);
    }
    
    if (searchQuery) {
      filtered = filtered?.filter(template =>
        template?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        template?.category?.toLowerCase()?.includes(searchQuery?.toLowerCase())
      );
    }
    
    return filtered;
  }, [activeCategory, searchQuery]);

  const popularSuggestions = [
    'iPhone mockup',
    'MacBook mockup',
    'Business card',
    'Instagram post',
    'App screenshot'
  ];

  const handleTemplateClick = (template) => {
    onTemplatePreview(template);
  };

  return (
    <section id="templates" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Icon name="Layout" size={16} className="mr-2" />
            500+ Professional Templates
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Choose from Our Massive
            <span className="text-purple-600 block">Template Library</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From the latest devices to classic designs, find the perfect template 
            for your project. All templates are updated regularly with new releases.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates (e.g., iPhone, MacBook, business card...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
            
            {/* Popular Suggestions */}
            {!searchQuery && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-slate-500 mr-2">Popular:</span>
                {popularSuggestions?.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(suggestion)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories?.map((category) => (
              <button
                key={category?.id}
                onClick={() => setActiveCategory(category?.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeCategory === category?.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:text-purple-600 hover:bg-purple-50 border border-slate-200'
                }`}
              >
                {category?.name}
                <span className="ml-2 text-xs opacity-75">({category?.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {filteredTemplates?.map((template) => (
            <div
              key={template?.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onMouseEnter={() => setHoveredTemplate(template?.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              onClick={() => handleTemplateClick(template)}
            >
              {/* Template Preview */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                <Image
                  src={hoveredTemplate === template?.id ? template?.mockup : template?.preview}
                  alt={template?.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <Button
                      variant="default"
                      size="sm"
                      iconName="Eye"
                      iconPosition="left"
                      className="shadow-lg"
                    >
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex space-x-2">
                  {template?.popular && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                      Popular
                    </span>
                  )}
                  {template?.new && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      New
                    </span>
                  )}
                </div>

                {/* Color Options */}
                <div className="absolute bottom-3 right-3 flex space-x-1">
                  {template?.colors?.slice(0, 3)?.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-slate-400"
                      title={color}
                    />
                  ))}
                  {template?.colors?.length > 3 && (
                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-slate-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {template?.name}
                </h3>
                <p className="text-sm text-slate-500 capitalize mb-3">
                  {template?.category} • {template?.colors?.length} color{template?.colors?.length !== 1 ? 's' : ''}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Icon name="Download" size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {Math.floor(Math.random() * 5000) + 1000} downloads
                    </span>
                  </div>
                  <Icon name="Heart" size={16} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More / View All */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            iconName="Grid3x3"
            iconPosition="left"
            className="mr-4"
          >
            View All {categories?.find(c => c?.id === activeCategory)?.count || 500} Templates
          </Button>
          <Button
            variant="default"
            size="lg"
            iconName="Plus"
            iconPosition="left"
            className="shadow-cta"
          >
            Request New Template
          </Button>
        </div>

        {/* Template Stats */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-sm text-slate-600">Total Templates</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-sm text-slate-600">Device Categories</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">Weekly</div>
            <div className="text-sm text-slate-600">New Additions</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-slate-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">4K+</div>
            <div className="text-sm text-slate-600">High Resolution</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TemplateGallery;