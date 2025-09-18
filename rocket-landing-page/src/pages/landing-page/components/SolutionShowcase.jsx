import React, { useState, useRef } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const SolutionShowcase = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('iphone');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const fileInputRef = useRef(null);

  const deviceTemplates = [
    {
      id: 'iphone',
      name: 'iPhone 15 Pro',
      category: 'Mobile',
      preview: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=400&fit=crop'
    },
    {
      id: 'macbook',
      name: 'MacBook Pro',
      category: 'Laptop',
      preview: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=250&fit=crop'
    },
    {
      id: 'ipad',
      name: 'iPad Air',
      category: 'Tablet',
      preview: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=400&fit=crop'
    },
    {
      id: 'watch',
      name: 'Apple Watch',
      category: 'Wearable',
      preview: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200&h=200&fit=crop'
    }
  ];

  const sampleImages = [
    {
      name: 'E-commerce App',
      url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=600&fit=crop',
      type: 'Mobile App'
    },
    {
      name: 'Dashboard Design',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      type: 'Web App'
    },
    {
      name: 'Landing Page',
      url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&h=400&fit=crop',
      type: 'Website'
    }
  ];

  const handleFileUpload = (event) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e?.target?.result);
        setShowResult(false);
      };
      reader?.readAsDataURL(file);
    }
  };

  const handleSampleImageSelect = (imageUrl) => {
    setUploadedImage(imageUrl);
    setShowResult(false);
  };

  const generateMockup = async () => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    setShowResult(false);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setShowResult(true);
  };

  const resetBuilder = () => {
    setUploadedImage(null);
    setShowResult(false);
    setIsProcessing(false);
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <Icon name="Sparkles" size={16} className="mr-2" />
            Try It Yourself
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            See the Magic in Action
            <span className="text-blue-600 block">Live Mockup Builder</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Upload your design or use our samples to experience how quickly 
            you can create professional mockups with our interactive builder.
          </p>
        </div>

        {/* Interactive Builder */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Controls */}
            <div className="space-y-8">
              {/* Step 1: Upload Design */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Upload Your Design</h3>
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div 
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef?.current?.click()}
                  >
                    <Icon name="Upload" size={32} className="mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-600 mb-2">Click to upload your design</p>
                    <p className="text-sm text-slate-500">PNG, JPG up to 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Sample Images */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Or try with sample designs:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {sampleImages?.map((sample, index) => (
                        <div
                          key={index}
                          className="relative cursor-pointer group"
                          onClick={() => handleSampleImageSelect(sample?.url)}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-400 transition-colors">
                            <Image
                              src={sample?.url}
                              alt={sample?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                            <Icon name="Plus" size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-slate-600 mt-1 text-center">{sample?.type}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Choose Device */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Choose Device Template</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {deviceTemplates?.map((device) => (
                    <button
                      key={device?.id}
                      onClick={() => setSelectedDevice(device?.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedDevice === device?.id
                          ? 'border-blue-500 bg-blue-50' :'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Icon name="Smartphone" size={16} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{device?.name}</p>
                          <p className="text-xs text-slate-500">{device?.category}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Generate */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Generate Mockup</h3>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="default"
                    fullWidth
                    onClick={generateMockup}
                    disabled={!uploadedImage || isProcessing}
                    loading={isProcessing}
                    iconName="Zap"
                    iconPosition="left"
                    className="shadow-cta"
                  >
                    {isProcessing ? 'Generating...' : 'Create Mockup'}
                  </Button>
                  
                  {(uploadedImage || showResult) && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={resetBuilder}
                      iconName="RotateCcw"
                      iconPosition="left"
                    >
                      Start Over
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Live Preview</h3>
                <p className="text-sm text-slate-600">Your mockup will appear here</p>
              </div>

              <div className="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                {!uploadedImage && !isProcessing && !showResult && (
                  <div className="text-center">
                    <Icon name="Image" size={48} className="mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-500">Upload a design to see the preview</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Creating your mockup...</p>
                    <p className="text-sm text-slate-500">This usually takes 2-3 seconds</p>
                  </div>
                )}

                {uploadedImage && !isProcessing && !showResult && (
                  <div className="text-center">
                    <div className="relative inline-block">
                      {selectedDevice === 'iphone' && (
                        <div className="w-48 h-72 bg-slate-800 rounded-3xl p-2 shadow-xl">
                          <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Your design"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {selectedDevice === 'macbook' && (
                        <div className="w-64 h-40 bg-slate-300 rounded-lg p-2 shadow-xl">
                          <div className="w-full h-full bg-white rounded overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Your design"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {selectedDevice === 'ipad' && (
                        <div className="w-56 h-72 bg-slate-700 rounded-2xl p-3 shadow-xl">
                          <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Your design"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      {selectedDevice === 'watch' && (
                        <div className="w-32 h-40 bg-slate-800 rounded-3xl p-2 shadow-xl">
                          <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Your design"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-4">Click "Create Mockup" to generate</p>
                  </div>
                )}

                {showResult && (
                  <div className="text-center">
                    <div className="relative inline-block">
                      {selectedDevice === 'iphone' && (
                        <div className="w-48 h-72 bg-slate-800 rounded-3xl p-2 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                            <Image
                              src={uploadedImage}
                              alt="Generated mockup"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2">
                        <Icon name="Check" size={16} />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-green-600 font-medium">Mockup Ready!</p>
                      <div className="flex justify-center space-x-2">
                        <Button size="sm" variant="default" iconName="Download" iconPosition="left">
                          Download
                        </Button>
                        <Button size="sm" variant="outline" iconName="Share" iconPosition="left">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Processing Steps */}
              {isProcessing && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Analyzing your design...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-600">Applying device template...</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
                    <span className="text-sm text-slate-400">Optimizing output...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Zap" size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Lightning Fast</h3>
            <p className="text-slate-600">Generate professional mockups in under 30 seconds with our AI-powered engine.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Palette" size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Positioning</h3>
            <p className="text-slate-600">AI automatically positions your design perfectly within device templates.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Download" size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">High Quality Output</h3>
            <p className="text-slate-600">Download in multiple formats and resolutions for any use case.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionShowcase;