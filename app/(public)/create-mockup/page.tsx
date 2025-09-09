'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { MockupGenerationPipeline } from '@/lib/mockup-generation-pipeline';
import { OutputEnhancer } from '@/lib/output-enhancement';
import { FormatConverter } from '@/lib/format-conversion';
import { QualityValidator } from '@/lib/quality-validation';
import { ResultCache } from '@/lib/result-caching';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  primary_image_url?: string;
  horizontal_enabled: boolean;
  vertical_enabled: boolean;
  all_over_enabled: boolean;
}

interface Constraint {
  id: string;
  gift_item_id: string;
  placement_type: 'horizontal' | 'vertical' | 'all_over';
  constraint_image_url: string;
  default_position_x: number;
  default_position_y: number;
  min_logo_width: number;
  max_logo_width: number;
  min_logo_height: number;
  max_logo_height: number;
  guidelines: string;
  is_active: boolean;
}

// Step Component
interface StepProps {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
}

function Step({ number, title, active, completed }: StepProps) {
  return (
    <div className="flex items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          completed
            ? 'bg-green-600 text-white'
            : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span
        className={`ml-3 text-sm font-medium ${
          active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {title}
      </span>
    </div>
  );
}

// Helper function to create default constraints when missing
function createDefaultConstraint(productId: string, placementType: 'horizontal' | 'vertical' | 'all_over'): Constraint {
  return {
    id: `default-${placementType}-${Date.now()}`,
    gift_item_id: productId,
    placement_type: placementType,
    constraint_image_url: '', // Will be handled by the pipeline
    default_position_x: 0.5, // Center position
    default_position_y: 0.5, // Center position
    min_logo_width: 50,
    max_logo_width: 300,
    min_logo_height: 50,
    max_logo_height: 300,
    guidelines: `Default ${placementType} placement with centered positioning`,
    is_active: true
  };
}

// Main Component
function CreateMockupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<'horizontal' | 'vertical' | 'all_over'>('horizontal');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  const [downloadFormats, setDownloadFormats] = useState<{ [key: string]: string }>({});
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Services
  const [pipeline] = useState(() => new MockupGenerationPipeline());
  const [enhancer, setEnhancer] = useState<OutputEnhancer | null>(null);
  const [converter] = useState(() => new FormatConverter());
  const [validator] = useState(() => new QualityValidator());
  const [cache] = useState(() => new ResultCache());

  // Initialize enhancer on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnhancer(new OutputEnhancer());
    }
  }, []);

  // Load product details
  useEffect(() => {
    if (!productId) {
      router.push('/catalog');
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch product via API route
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          } else {
            throw new Error('Failed to load product');
          }
        }

        const data = await response.json();
        
        if (!data.product) {
          throw new Error('Product data not found');
        }

        setProduct(data.product);
        setConstraints(data.constraints || []);
        
        // Set default placement based on what's available
        if (data.product.horizontal_enabled) {
          setSelectedPlacement('horizontal');
        } else if (data.product.vertical_enabled) {
          setSelectedPlacement('vertical');
        } else if (data.product.all_over_enabled) {
          setSelectedPlacement('all_over');
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product details');
        setTimeout(() => router.push('/catalog'), 3000);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
  };

  // Process logo (remove background)
  const processLogo = async () => {
    if (!uploadedFile) return;

    try {
      setLoading(true);
      setProgress('Removing background from logo...');
      setError(null);

      // Create form data for API call
      const formData = new FormData();
      formData.append('image', uploadedFile);

      // Call background removal API
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process logo');
      }

      const result = await response.json();
      
      if (!result.success || !result.processedImage) {
        throw new Error('Invalid response from background removal service');
      }

      setProcessedLogo(result.processedImage);
      setCurrentStep(3);
      setProgress('');
    } catch (err) {
      console.error('Error processing logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process logo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate mockup
  const generateMockup = async () => {
    if (!product || !processedLogo) return;

    try {
      setLoading(true);
      setError(null);
      
      // Find selected constraint or create a default one
      let constraint = constraints.find(c => c.placement_type === selectedPlacement);
      if (!constraint) {
        // Create default constraint for missing placement type
        constraint = createDefaultConstraint(product.id, selectedPlacement);
        setProgress(`Using default ${selectedPlacement} placement settings...`);
      }

      // Check cache first
      const cacheKey = cache.generateCacheKey({
        productId: product.id,
        logoHash: processedLogo,
        placementType: selectedPlacement,
        constraintVersion: constraint.id
      });

      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        setProgress('Retrieved from cache!');
        setGeneratedMockup(cachedResult.result);
        setCurrentStep(4);
        return;
      }

      // Generate mockup
      setProgress('Preparing your mockup...');
      
      const result = await pipeline.generateMockup({
        logo: {
          file: processedLogo,
          processedImageUrl: processedLogo,
          originalDimensions: { width: 200, height: 100 },
          format: 'png',
          hasTransparency: true
        },
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.primary_image_url || '',
          category: product.category,
          constraints: {
            horizontal: selectedPlacement === 'horizontal' ? constraint : undefined,
            vertical: selectedPlacement === 'vertical' ? constraint : undefined,
            allOver: selectedPlacement === 'all_over' ? constraint : undefined
          }
        },
        placementType: selectedPlacement === 'all_over' ? 'all-over' : selectedPlacement,
        qualityLevel: 'enhanced',
        stylePreferences: {
          lighting: 'natural',
          angle: 'front',
          background: 'neutral'
        }
      });

      if (result.status === 'failed') {
        throw new Error(result.error || 'Failed to generate mockup');
      }

      if (!result.generatedImageUrl) {
        throw new Error('No image URL returned from pipeline');
      }

      // Cache the result
      await cache.set(cacheKey, {
        result: result.generatedImageUrl,
        metadata: {
          productId: product.id,
          placement: selectedPlacement,
          generatedAt: new Date().toISOString()
        }
      });

      setGeneratedMockup(result.generatedImageUrl);
      setCurrentStep(4);
      
      // Generate download formats
      await generateDownloadFormats(result.generatedImageUrl);
      
    } catch (err) {
      console.error('Error generating mockup:', err);
      setError('Failed to generate mockup. Please try again.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // Generate download formats
  const generateDownloadFormats = async (imageUrl: string) => {
    if (!enhancer) return;

    try {
      setProgress('Preparing download formats...');
      
      // Load image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Generate formats
      const formats: { [key: string]: string } = {};
      
      // PNG
      const pngResult = await converter.convertFormat(imageData, {
        format: 'png',
        quality: 100
      });
      formats.png = pngResult.dataUrl;

      // JPEG
      const jpegResult = await converter.convertFormat(imageData, {
        format: 'jpeg',
        quality: 90
      });
      formats.jpeg = jpegResult.dataUrl;

      // WebP
      const webpResult = await converter.convertFormat(imageData, {
        format: 'webp',
        quality: 90
      });
      formats.webp = webpResult.dataUrl;

      setDownloadFormats(formats);
    } catch (err) {
      console.error('Error generating formats:', err);
    } finally {
      setProgress('');
    }
  };

  // Download mockup
  const downloadMockup = (format: string) => {
    const dataUrl = downloadFormats[format] || generatedMockup;
    if (!dataUrl || !product) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${product.name.replace(/\s+/g, '-')}-mockup.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset and start over
  const startOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setProcessedLogo(null);
    setGeneratedMockup(null);
    setDownloadFormats({});
    setError(null);
  };

  if (!product && !loading) {
    return (
      <Container className="py-12">
        <Alert variant="error">
          Product not found. Redirecting to catalog...
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Create Your Mockup
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 max-w-3xl mx-auto">
          <Step number={1} title="Product Selected" active={currentStep >= 1} completed={currentStep > 1} />
          <div className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <Step number={2} title="Upload Logo" active={currentStep >= 2} completed={currentStep > 2} />
          <div className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <Step number={3} title="Select Placement" active={currentStep >= 3} completed={currentStep > 3} />
          <div className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <Step number={4} title="Download Mockup" active={currentStep >= 4} completed={currentStep > 4} />
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {loading && progress && (
          <Alert variant="info" className="mb-6">
            <div className="flex items-center">
              <Spinner className="mr-3" />
              {progress}
            </div>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Product Display */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Selected Product</CardTitle>
              </CardHeader>
              <CardBody>
                {product && (
                  <div>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                      <span className="text-lg font-semibold text-blue-600">${product.price}</span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Result Display */}
            {generatedMockup && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Generated Mockup</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={generatedMockup}
                      alt="Generated Mockup"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column - Controls */}
          <div>
            {/* Step 1 & 2: Logo Upload */}
            {currentStep <= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Step {currentStep}: Upload Your Logo</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="cursor-pointer block"
                      >
                        {uploadedFile ? (
                          <div>
                            <div className="text-green-600 mb-2">✓</div>
                            <p className="text-gray-900 dark:text-gray-100">
                              {uploadedFile.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Click to change file
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="text-4xl text-gray-400 mb-2">📁</div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Click to upload your logo
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              PNG, JPG, WebP, or HEIC up to 10MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>

                    {uploadedFile && (
                      <Button
                        onClick={processLogo}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Processing...' : 'Process Logo'}
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 3: Placement Selection */}
            {currentStep === 3 && processedLogo && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Select Placement</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Processed Logo Preview */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Your Processed Logo:
                      </p>
                      <div className="w-32 h-32 mx-auto bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                        <img
                          src={processedLogo}
                          alt="Processed Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Placement Options */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Choose Logo Placement:
                      </p>
                      
                      {product?.horizontal_enabled && (
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <input
                            type="radio"
                            name="placement"
                            value="horizontal"
                            checked={selectedPlacement === 'horizontal'}
                            onChange={(e) => setSelectedPlacement(e.target.value as any)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Horizontal Placement</span>
                            <p className="text-sm text-gray-500">Logo placed horizontally on the product</p>
                          </div>
                        </label>
                      )}

                      {product?.vertical_enabled && (
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <input
                            type="radio"
                            name="placement"
                            value="vertical"
                            checked={selectedPlacement === 'vertical'}
                            onChange={(e) => setSelectedPlacement(e.target.value as any)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Vertical Placement</span>
                            <p className="text-sm text-gray-500">Logo placed vertically on the product</p>
                          </div>
                        </label>
                      )}

                      {product?.all_over_enabled && (
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                          <input
                            type="radio"
                            name="placement"
                            value="all_over"
                            checked={selectedPlacement === 'all_over'}
                            onChange={(e) => setSelectedPlacement(e.target.value as any)}
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">All-Over Print</span>
                            <p className="text-sm text-gray-500">Logo repeated as a pattern</p>
                          </div>
                        </label>
                      )}
                    </div>

                    <Button
                      onClick={generateMockup}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? 'Generating...' : 'Generate Mockup'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 4: Download */}
            {currentStep === 4 && generatedMockup && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 4: Download Your Mockup</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <Alert variant="success">
                      Your mockup is ready! Choose a format to download.
                    </Alert>

                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={() => downloadMockup('png')}
                        variant="outline"
                        className="text-center"
                      >
                        <div>
                          <div className="text-2xl mb-1">🖼️</div>
                          <div className="text-xs">PNG</div>
                          <div className="text-xs text-gray-500">High Quality</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => downloadMockup('jpeg')}
                        variant="outline"
                        className="text-center"
                      >
                        <div>
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-xs">JPEG</div>
                          <div className="text-xs text-gray-500">Compressed</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => downloadMockup('webp')}
                        variant="outline"
                        className="text-center"
                      >
                        <div>
                          <div className="text-2xl mb-1">🌐</div>
                          <div className="text-xs">WebP</div>
                          <div className="text-xs text-gray-500">Modern</div>
                        </div>
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        onClick={startOver}
                        variant="secondary"
                        className="w-full"
                      >
                        Create Another Mockup
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

// Main export with Suspense boundary
export default function CreateMockupPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Container>
      }
    >
      <CreateMockupContent />
    </Suspense>
  );
}