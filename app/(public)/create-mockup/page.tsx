'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { OutputEnhancer } from '@/lib/output-enhancement';
import { FormatConverter } from '@/lib/format-conversion';
import { QualityValidator } from '@/lib/quality-validation';
import { ResultCache } from '@/lib/result-caching';
import { PromptAdjuster, AdjustmentHistory } from '@/components/mockup/PromptAdjuster';

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
function createDefaultConstraint(
  productId: string,
  placementType: 'horizontal' | 'vertical' | 'all_over'
): Constraint {
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
    is_active: true,
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
  const [selectedPlacement, setSelectedPlacement] = useState<
    'horizontal' | 'vertical' | 'all_over'
  >('horizontal');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  const [downloadFormats, setDownloadFormats] = useState<{ [key: string]: string }>({});

  // Adjustment history state
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistory[]>([]);
  const [originalMockup, setOriginalMockup] = useState<string | null>(null);

  // Default design adjustments for compatibility
  const [designAdjustments] = useState({
    scale: 1.0,
    rotation: 0,
    x: 0.5,
    y: 0.5,
    flipH: false,
    flipV: false,
    opacity: 1.0,
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  // Services
  const [enhancer, setEnhancer] = useState<OutputEnhancer | null>(null);
  const [converter] = useState(() => new FormatConverter());
  const [_validator] = useState(() => new QualityValidator());
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

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [_dragCounter, setDragCounter] = useState(0);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file);
  };

  // Process uploaded file (shared logic for both upload and drop)
  const processFile = useCallback((file: File) => {
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
  }, []);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]); // Only take the first file
      }
    },
    [processFile]
  );

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

  // Get current constraint for selected placement
  const getCurrentConstraint = () => {
    let constraint = constraints.find((c) => c.placement_type === selectedPlacement);
    if (!constraint) {
      constraint = createDefaultConstraint(product.id, selectedPlacement);
    }
    return constraint;
  };

  // Validate design adjustments against constraints
  const _validateAdjustments = (adjustments: typeof designAdjustments) => {
    const constraint = getCurrentConstraint();
    const warnings = [];

    // Check if scale respects min/max logo dimensions
    const baseSize = 200; // Assume base logo size
    const scaledWidth = baseSize * adjustments.scale;
    const scaledHeight = baseSize * adjustments.scale;

    if (scaledWidth < constraint.min_logo_width) {
      warnings.push(`Logo width too small (min: ${constraint.min_logo_width}px)`);
    }
    if (scaledWidth > constraint.max_logo_width) {
      warnings.push(`Logo width too large (max: ${constraint.max_logo_width}px)`);
    }
    if (scaledHeight < constraint.min_logo_height) {
      warnings.push(`Logo height too small (min: ${constraint.min_logo_height}px)`);
    }
    if (scaledHeight > constraint.max_logo_height) {
      warnings.push(`Logo height too large (max: ${constraint.max_logo_height}px)`);
    }

    return warnings;
  };

  // Generate mockup
  const generateMockup = async () => {
    if (!product || !processedLogo) return;

    try {
      setLoading(true);
      setError(null);

      // Find selected constraint or create a default one
      let constraint = constraints.find((c) => c.placement_type === selectedPlacement);
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
        constraintVersion: constraint.id,
      });

      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        setProgress('Retrieved from cache!');
        setGeneratedMockup(cachedResult.result);
        setCurrentStep(5);
        return;
      }

      // Generate mockup via API
      setProgress('Preparing your mockup...');

      const apiResponse = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: {
            file: processedLogo,
            processedImageUrl: processedLogo,
            originalDimensions: { width: 200, height: 100 },
            format: 'png',
            hasTransparency: true,
          },
          product: {
            id: product.id,
            name: product.name,
            imageUrl: product.primary_image_url || '',
            category: product.category,
          },
          placementType: selectedPlacement === 'all_over' ? 'all-over' : selectedPlacement,
          adjustments: designAdjustments,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to generate mockup');
      }

      const apiResult = await apiResponse.json();
      const result = apiResult.result;

      if (!result.generatedImageUrl) {
        throw new Error('No image URL returned from pipeline');
      }

      // Cache the result
      await cache.set(cacheKey, {
        result: result.generatedImageUrl,
        metadata: {
          productId: product.id,
          placement: selectedPlacement,
          generatedAt: new Date().toISOString(),
        },
      });

      setGeneratedMockup(result.generatedImageUrl);
      setOriginalMockup(result.generatedImageUrl);
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
        quality: 100,
      });
      formats.png = pngResult.dataUrl;

      // JPEG
      const jpegResult = await converter.convertFormat(imageData, {
        format: 'jpeg',
        quality: 90,
      });
      formats.jpeg = jpegResult.dataUrl;

      // WebP
      const webpResult = await converter.convertFormat(imageData, {
        format: 'webp',
        quality: 90,
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

  // Handle prompt adjustments
  const handleApplyChanges = async (instruction: string, enhancedPrompt: string) => {
    if (!product || !originalMockup) return;

    try {
      setLoading(true);
      setError(null);
      setProgress('Applying your adjustments...');

      // Call API to generate adjusted mockup
      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: {
            file: processedLogo,
            processedImageUrl: processedLogo,
            originalDimensions: { width: 200, height: 100 },
            format: 'png',
            hasTransparency: true,
          },
          product: {
            id: product.id,
            name: product.name,
            imageUrl: product.primary_image_url || '',
            category: product.category,
          },
          placementType: selectedPlacement === 'all_over' ? 'all-over' : selectedPlacement,
          adjustmentPrompt: `Same mockup as before but ${enhancedPrompt}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply adjustments');
      }

      const result = await response.json();
      const newMockupUrl = result.result.generatedImageUrl;

      if (!newMockupUrl) {
        throw new Error('No adjusted mockup returned');
      }

      // Add to history
      const historyItem: AdjustmentHistory = {
        id: Date.now().toString(),
        instruction,
        enhancedPrompt,
        mockupUrl: newMockupUrl,
        timestamp: new Date(),
      };

      setAdjustmentHistory((prev) => [...prev, historyItem]);
      setGeneratedMockup(newMockupUrl);

      // Generate download formats for new mockup
      await generateDownloadFormats(newMockupUrl);
    } catch (err) {
      console.error('Error applying adjustments:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply adjustments');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // Handle reverting to previous version
  const handleRevertToVersion = (historyItem: AdjustmentHistory) => {
    if (historyItem.id === 'original' && originalMockup) {
      setGeneratedMockup(originalMockup);
      setAdjustmentHistory([]);
    } else {
      setGeneratedMockup(historyItem.mockupUrl);
      // Remove all history items after this one
      const itemIndex = adjustmentHistory.findIndex((item) => item.id === historyItem.id);
      if (itemIndex !== -1) {
        setAdjustmentHistory((prev) => prev.slice(0, itemIndex + 1));
      }
    }
  };

  // Reset and start over
  const startOver = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setProcessedLogo(null);
    setGeneratedMockup(null);
    setOriginalMockup(null);
    setAdjustmentHistory([]);
    setDownloadFormats({});
    setError(null);
  };

  if (!product && !loading) {
    return (
      <Container className="py-12">
        <Alert variant="error">Product not found. Redirecting to catalog...</Alert>
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
        <div className="flex items-center justify-between mb-12 max-w-4xl mx-auto">
          <Step
            number={1}
            title="Product Selected"
            active={currentStep >= 1}
            completed={currentStep > 1}
          />
          <div
            className={`flex-1 h-1 mx-2 ${currentStep > 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
          <Step
            number={2}
            title="Upload Logo"
            active={currentStep >= 2}
            completed={currentStep > 2}
          />
          <div
            className={`flex-1 h-1 mx-2 ${currentStep > 2 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
          <Step
            number={3}
            title="Select Placement"
            active={currentStep >= 3}
            completed={currentStep > 3}
          />
          <div
            className={`flex-1 h-1 mx-2 ${currentStep > 3 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
          <Step
            number={4}
            title="Adjust Design"
            active={currentStep >= 4}
            completed={currentStep > 4}
          />
          <div
            className={`flex-1 h-1 mx-2 ${currentStep > 4 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
          <Step
            number={5}
            title="Download Mockup"
            active={currentStep >= 5}
            completed={currentStep > 5}
          />
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
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>
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
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer block">
                        {uploadedFile ? (
                          <div>
                            <div className="text-green-600 mb-2 text-4xl">✓</div>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">
                              {uploadedFile.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                              Click to change file or drag a new one
                            </p>
                          </div>
                        ) : (
                          <div>
                            {isDragging ? (
                              <div>
                                <div className="text-4xl text-blue-500 mb-2">⬇️</div>
                                <p className="text-blue-600 dark:text-blue-400 font-medium">
                                  Drop your logo here
                                </p>
                                <p className="text-sm text-blue-500 mt-2">Release to upload</p>
                              </div>
                            ) : (
                              <div>
                                <div className="text-4xl text-gray-400 mb-2">🎨</div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                  Drag & drop your logo or click to upload
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                  PNG, JPG, WebP, or HEIC up to 10MB
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </label>
                    </div>

                    {uploadedFile && (
                      <Button onClick={processLogo} disabled={loading} className="w-full">
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
                            onChange={(e) =>
                              setSelectedPlacement(
                                e.target.value as 'horizontal' | 'vertical' | 'all_over'
                              )
                            }
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Horizontal Placement</span>
                            <p className="text-sm text-gray-500">
                              Logo placed horizontally on the product
                            </p>
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
                            onChange={(e) =>
                              setSelectedPlacement(
                                e.target.value as 'horizontal' | 'vertical' | 'all_over'
                              )
                            }
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">Vertical Placement</span>
                            <p className="text-sm text-gray-500">
                              Logo placed vertically on the product
                            </p>
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
                            onChange={(e) =>
                              setSelectedPlacement(
                                e.target.value as 'horizontal' | 'vertical' | 'all_over'
                              )
                            }
                            className="mr-3"
                          />
                          <div>
                            <span className="font-medium">All-Over Print</span>
                            <p className="text-sm text-gray-500">Logo repeated as a pattern</p>
                          </div>
                        </label>
                      )}
                    </div>

                    <Button onClick={generateMockup} disabled={loading} className="w-full">
                      {loading ? 'Generating...' : 'Generate Mockup'}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 4: Refine Mockup */}
            {currentStep === 4 && generatedMockup && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 4: Refine Your Mockup</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6">
                    {/* Current Mockup Preview */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Current mockup:
                      </p>
                      <div className="aspect-square bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                        <img
                          src={generatedMockup}
                          alt="Current Mockup"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Prompt Adjuster Component */}
                    <PromptAdjuster
                      onApplyChanges={handleApplyChanges}
                      loading={loading}
                      history={adjustmentHistory}
                      onRevertToVersion={handleRevertToVersion}
                    />

                    {/* Navigation Buttons */}
                    <div className="border-t pt-4">
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setCurrentStep(3)}
                          variant="secondary"
                          className="flex-1"
                        >
                          Back to Placement
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(5)}
                          className="flex-1"
                          disabled={loading}
                        >
                          Continue to Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 5: Download */}
            {currentStep === 5 && generatedMockup && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 5: Download Your Mockup</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <Alert variant="success">
                      Your customized mockup is ready! Choose a format to download.
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
                      <Button onClick={startOver} variant="secondary" className="w-full">
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
