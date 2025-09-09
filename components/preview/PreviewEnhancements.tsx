'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

export interface PreviewEnhancementsProps {
  mockupUrl: string;
  productName: string;
  onBackgroundChange?: (background: BackgroundOption) => void;
  className?: string;
}

interface BackgroundOption {
  id: string;
  name: string;
  type: 'color' | 'gradient' | 'image' | 'environment';
  value: string;
  preview: string;
}

interface EnvironmentScene {
  id: string;
  name: string;
  image: string;
  description: string;
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft';
}

const backgroundOptions: BackgroundOption[] = [
  { id: 'white', name: 'Clean White', type: 'color', value: '#ffffff', preview: '#ffffff' },
  { id: 'black', name: 'Deep Black', type: 'color', value: '#000000', preview: '#000000' },
  { id: 'gray', name: 'Neutral Gray', type: 'color', value: '#f3f4f6', preview: '#f3f4f6' },
  { id: 'blue', name: 'Corporate Blue', type: 'color', value: '#3b82f6', preview: '#3b82f6' },
  { id: 'green', name: 'Fresh Green', type: 'color', value: '#10b981', preview: '#10b981' },
  { id: 'gradient1', name: 'Ocean Gradient', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient2', name: 'Sunset Gradient', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient3', name: 'Forest Gradient', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
];

const environmentScenes: EnvironmentScene[] = [
  {
    id: 'office',
    name: 'Modern Office',
    image: '/environments/modern-office.jpg',
    description: 'Clean, professional office setting with natural lighting',
    lighting: 'natural'
  },
  {
    id: 'home',
    name: 'Cozy Home',
    image: '/environments/cozy-home.jpg',
    description: 'Warm, inviting home environment',
    lighting: 'soft'
  },
  {
    id: 'studio',
    name: 'Photography Studio',
    image: '/environments/photo-studio.jpg',
    description: 'Professional studio with controlled lighting',
    lighting: 'studio'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Lifestyle',
    image: '/environments/outdoor.jpg',
    description: 'Natural outdoor setting with dynamic lighting',
    lighting: 'dramatic'
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    image: '/environments/coffee-shop.jpg',
    description: 'Trendy cafe atmosphere with ambient lighting',
    lighting: 'natural'
  }
];

export function PreviewEnhancements({ 
  mockupUrl, 
  productName, 
  onBackgroundChange,
  className = '' 
}: PreviewEnhancementsProps) {
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption>(backgroundOptions[0]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentScene | null>(null);
  const [previewMode, setPreviewMode] = useState<'normal' | 'comparison' | 'presentation' | 'environment'>('normal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');
  const previewRef = useRef<HTMLDivElement>(null);

  const handleBackgroundChange = useCallback((background: BackgroundOption) => {
    setSelectedBackground(background);
    setSelectedEnvironment(null);
    onBackgroundChange?.(background);
  }, [onBackgroundChange]);

  const handleEnvironmentChange = useCallback((environment: EnvironmentScene) => {
    setSelectedEnvironment(environment);
    setPreviewMode('environment');
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      previewRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleCustomColorChange = useCallback((color: string) => {
    setCustomColor(color);
    const customBackground: BackgroundOption = {
      id: 'custom',
      name: 'Custom Color',
      type: 'color',
      value: color,
      preview: color
    };
    handleBackgroundChange(customBackground);
  }, [handleBackgroundChange]);

  const downloadPreview = useCallback(() => {
    // Create a temporary canvas to generate the download
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Apply background
    if (selectedBackground.type === 'color') {
      ctx.fillStyle = selectedBackground.value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (selectedBackground.type === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Load and draw the mockup image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height * 0.8;
        drawWidth = drawHeight * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.width * 0.8;
        drawHeight = drawWidth / imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = (canvas.height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      // Download the canvas as an image
      const link = document.createElement('a');
      link.download = `${productName}-mockup-preview.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = mockupUrl;
  }, [mockupUrl, productName, selectedBackground]);

  const sharePreview = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productName} Mockup Preview`,
          text: 'Check out this mockup preview!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Preview URL copied to clipboard!');
    }
  }, [productName]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getPreviewStyle = () => {
    if (selectedEnvironment && previewMode === 'environment') {
      return {
        backgroundImage: `url(${selectedEnvironment.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }
    
    return {
      background: selectedBackground.value
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Preview Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Preview Enhancements
        </h3>
        
        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('normal')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                previewMode === 'normal'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setPreviewMode('comparison')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                previewMode === 'comparison'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => setPreviewMode('presentation')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                previewMode === 'presentation'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Present
            </button>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Fullscreen
          </Button>
          
          <Button variant="outline" size="sm" onClick={downloadPreview}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </Button>
          
          <Button variant="outline" size="sm" onClick={sharePreview}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div 
        ref={previewRef}
        className={`relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${
          isFullscreen ? 'bg-black' : 'bg-white dark:bg-gray-900'
        }`}
        style={{ minHeight: '500px' }}
      >
        {previewMode === 'comparison' ? (
          // Comparison View - Side by side
          <div className="flex h-full min-h-[500px]">
            <div className="flex-1 relative overflow-hidden">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: '#ffffff' }}
              >
                <img 
                  src={mockupUrl} 
                  alt={`${productName} - Original`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                Original
              </div>
            </div>
            
            <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
            
            <div className="flex-1 relative overflow-hidden">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={getPreviewStyle()}
              >
                <img 
                  src={mockupUrl} 
                  alt={`${productName} - Enhanced`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {selectedEnvironment?.name || selectedBackground.name}
              </div>
            </div>
          </div>
        ) : previewMode === 'presentation' ? (
          // Presentation Mode - Fullscreen optimized
          <div 
            className="relative w-full h-full min-h-[500px] flex items-center justify-center"
            style={getPreviewStyle()}
          >
            <div className="relative max-w-4xl max-h-full">
              <img 
                src={mockupUrl} 
                alt={productName}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
              
              {/* Presentation overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h2 className="text-white text-2xl font-bold mb-2">{productName}</h2>
                <p className="text-white/90 text-sm">
                  Professional mockup preview • Generated with AI
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Normal Preview
          <div 
            className="relative w-full h-full min-h-[500px] flex items-center justify-center p-4"
            style={getPreviewStyle()}
          >
            <img 
              src={mockupUrl} 
              alt={productName}
              className="max-w-full max-h-full object-contain shadow-lg"
            />
            
            {selectedEnvironment && (
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                <div className="text-sm font-medium">{selectedEnvironment.name}</div>
                <div className="text-xs opacity-75">{selectedEnvironment.lighting} lighting</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Options */}
      <Card>
        <CardHeader>
          <CardTitle>Background Options</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Color Backgrounds */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Solid Colors
              </h4>
              <div className="flex flex-wrap gap-2">
                {backgroundOptions.filter(bg => bg.type === 'color').map((background) => (
                  <button
                    key={background.id}
                    onClick={() => handleBackgroundChange(background)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedBackground.id === background.id 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: background.preview }}
                    title={background.name}
                  />
                ))}
                
                {/* Custom Color Picker */}
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-gray-400 cursor-pointer"
                  />
                  <div className="absolute -bottom-6 left-0 text-xs text-gray-500">Custom</div>
                </div>
              </div>
            </div>

            {/* Gradient Backgrounds */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Gradients
              </h4>
              <div className="flex flex-wrap gap-2">
                {backgroundOptions.filter(bg => bg.type === 'gradient').map((background) => (
                  <button
                    key={background.id}
                    onClick={() => handleBackgroundChange(background)}
                    className={`w-16 h-12 rounded-lg border-2 transition-all ${
                      selectedBackground.id === background.id 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ background: background.preview }}
                    title={background.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Environment Scenes */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Previews</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {environmentScenes.map((environment) => (
              <button
                key={environment.id}
                onClick={() => handleEnvironmentChange(environment)}
                className={`relative group rounded-lg overflow-hidden aspect-video border-2 transition-all ${
                  selectedEnvironment?.id === environment.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {/* Placeholder for environment image */}
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center"
                >
                  <div className="text-center p-2">
                    <div className="text-xs font-medium text-gray-700">{environment.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{environment.lighting}</div>
                  </div>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Select an environment to see how your mockup looks in different real-world settings
          </p>
        </CardBody>
      </Card>

      {/* Preview Information */}
      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Use comparison mode to see before/after effects</p>
        <p>• Presentation mode is optimized for client presentations</p>
        <p>• Environment previews show your product in realistic contexts</p>
        <p>• Download feature captures the current preview with applied background</p>
      </div>
    </div>
  );
}