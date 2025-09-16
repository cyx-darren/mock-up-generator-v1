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
import { ViewToggle } from '@/components/mockup/ViewToggle';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  primary_image_url?: string;
  back_image_url?: string;
  has_back_printing: boolean;
  horizontal_enabled: boolean;
  vertical_enabled: boolean;
  all_over_enabled: boolean;
}

interface Constraint {
  id: string;
  gift_item_id: string;
  placement_type: 'horizontal' | 'vertical' | 'all_over';
  side: 'front' | 'back';
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
  placementType: 'horizontal' | 'vertical' | 'all_over',
  side: 'front' | 'back' = 'front'
): Constraint {
  return {
    id: `default-${placementType}-${side}-${Date.now()}`,
    gift_item_id: productId,
    placement_type: placementType,
    side,
    constraint_image_url: '', // Will be handled by the pipeline
    default_position_x: 0.5, // Center position
    default_position_y: 0.5, // Center position
    min_logo_width: 50,
    max_logo_width: 300,
    min_logo_height: 50,
    max_logo_height: 300,
    guidelines: `Default ${placementType} placement with centered positioning on ${side} side`,
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
  const [currentConstraint, setCurrentConstraint] = useState<Constraint | null>(null);
  const [showConstraintOverlay, setShowConstraintOverlay] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
  const [downloadFormats, setDownloadFormats] = useState<{ [key: string]: string }>({});

  // Dual-sided support state
  const [frontUploadedFile, setFrontUploadedFile] = useState<File | null>(null);
  const [backUploadedFile, setBackUploadedFile] = useState<File | null>(null);
  const [frontProcessedLogo, setFrontProcessedLogo] = useState<string | null>(null);
  const [backProcessedLogo, setBackProcessedLogo] = useState<string | null>(null);
  const [currentMockupView, setCurrentMockupView] = useState<'front' | 'back'>('front');
  const [generatedMockups, setGeneratedMockups] = useState<{
    front: string | null;
    back: string | null;
  }>({ front: null, back: null });
  const [selectedSides, setSelectedSides] = useState<'front' | 'back' | 'both'>('front');

  // Adjustment history state
  const [adjustmentHistory, setAdjustmentHistory] = useState<AdjustmentHistory[]>([]);
  const [originalMockup, setOriginalMockup] = useState<string | null>(null);

  // Mockup navigation state
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);

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
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

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

        // Set current constraint for default placement
        if (data.constraints && data.constraints.length > 0) {
          const defaultConstraint = data.constraints.find(
            (c: Constraint) =>
              c.placement_type ===
              (data.product.horizontal_enabled
                ? 'horizontal'
                : data.product.vertical_enabled
                  ? 'vertical'
                  : 'all_over')
          );
          if (defaultConstraint) {
            setCurrentConstraint(defaultConstraint);
          }
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

  // Handle file upload (legacy single-sided)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file, 'legacy');
  };

  // Handle front logo upload
  const handleFrontLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file, 'front');
  };

  // Handle back logo upload
  const handleBackLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processFile(file, 'back');
  };

  // Process uploaded file (shared logic for both upload and drop)
  const processFile = useCallback((file: File, side: 'legacy' | 'front' | 'back' = 'legacy') => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Set the appropriate file state based on which side is being uploaded
    if (side === 'front') {
      setFrontUploadedFile(file);
    } else if (side === 'back') {
      setBackUploadedFile(file);
    } else {
      // Legacy mode - set both legacy state and front state for backward compatibility
      setUploadedFile(file);
      setFrontUploadedFile(file);
    }

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
    (e: React.DragEvent, side: 'legacy' | 'front' | 'back' = 'legacy') => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0], side); // Only take the first file
      }
    },
    [processFile]
  );

  // Process logo(s) (remove background)
  const processLogo = async () => {
    try {
      setLoading(true);
      setError(null);

      const processQueue = [];

      // Handle front logo processing
      if ((selectedSides === 'front' || selectedSides === 'both') && frontUploadedFile) {
        processQueue.push({ file: frontUploadedFile, side: 'front' });
      } else if (selectedSides === 'front' && uploadedFile) {
        // Legacy mode - treat uploadedFile as front
        processQueue.push({ file: uploadedFile, side: 'front' });
      }

      // Handle back logo processing
      if ((selectedSides === 'back' || selectedSides === 'both') && backUploadedFile) {
        processQueue.push({ file: backUploadedFile, side: 'back' });
      } else if (selectedSides === 'back' && uploadedFile) {
        // Legacy mode - treat uploadedFile as back
        processQueue.push({ file: uploadedFile, side: 'back' });
      }

      if (processQueue.length === 0) {
        throw new Error('No logos to process');
      }

      // Process each logo
      for (let i = 0; i < processQueue.length; i++) {
        const { file, side } = processQueue[i];
        const progress =
          processQueue.length > 1
            ? `Processing ${side} logo (${i + 1}/${processQueue.length})...`
            : `Removing background from logo...`;

        setProgress(progress);

        // Create form data for API call
        const formData = new FormData();
        formData.append('image', file);

        // Call background removal API
        const response = await fetch('/api/remove-background', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to process ${side} logo`);
        }

        const result = await response.json();

        if (!result.success || !result.processedImage) {
          throw new Error(`Invalid response from background removal service for ${side} logo`);
        }

        // Set processed logo for the appropriate side
        if (side === 'front') {
          setFrontProcessedLogo(result.processedImage);
          // Legacy compatibility
          setProcessedLogo(result.processedImage);
        } else {
          setBackProcessedLogo(result.processedImage);
        }
      }

      setCurrentStep(3);
      setProgress('');
    } catch (err) {
      console.error('Error processing logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process logo(s). Please try again.');
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
    setCurrentConstraint(constraint);
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

    // Check if logo fits within the detected green constraint area
    if (constraint.detected_area_width && constraint.detected_area_height) {
      const constraintAreaWidth = constraint.detected_area_width;
      const constraintAreaHeight = constraint.detected_area_height;
      const padding = 10; // Small padding from green area edges

      if (scaledWidth > constraintAreaWidth - padding) {
        warnings.push(
          `Logo width exceeds constraint area (max within green zone: ${constraintAreaWidth - padding}px)`
        );
      }
      if (scaledHeight > constraintAreaHeight - padding) {
        warnings.push(
          `Logo height exceeds constraint area (max within green zone: ${constraintAreaHeight - padding}px)`
        );
      }

      // Calculate position bounds considering the scaled logo size
      const logoX = adjustments.x;
      const logoY = adjustments.y;
      const halfLogoWidth = scaledWidth / 2;
      const halfLogoHeight = scaledHeight / 2;

      const constraintMinX = constraint.detected_area_x;
      const constraintMinY = constraint.detected_area_y;
      const constraintMaxX = constraint.detected_area_x + constraintAreaWidth;
      const constraintMaxY = constraint.detected_area_y + constraintAreaHeight;

      if (logoX - halfLogoWidth < constraintMinX) {
        warnings.push(`Logo extends outside left edge of constraint area`);
      }
      if (logoX + halfLogoWidth > constraintMaxX) {
        warnings.push(`Logo extends outside right edge of constraint area`);
      }
      if (logoY - halfLogoHeight < constraintMinY) {
        warnings.push(`Logo extends outside top edge of constraint area`);
      }
      if (logoY + halfLogoHeight > constraintMaxY) {
        warnings.push(`Logo extends outside bottom edge of constraint area`);
      }
    }

    return warnings;
  };

  // Generate mockup
  const generateMockup = async () => {
    if (!product) return;

    // Check if we have required logos based on selected sides
    if (selectedSides === 'both' && (!frontProcessedLogo || !backProcessedLogo)) {
      setError('Please upload logos for both front and back sides');
      return;
    }
    if (selectedSides === 'front' && !frontProcessedLogo && !processedLogo) {
      setError('Please upload a logo for the front side');
      return;
    }
    if (selectedSides === 'back' && !backProcessedLogo) {
      setError('Please upload a logo for the back side');
      return;
    }

    try {
      // Immediately show progress UI
      setLoading(true);
      setError(null);
      setProgress('Initializing mockup generation...');
      setProgressPercentage(0);

      // Small delay to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Find selected constraint or create a default one
      let constraint = constraints.find((c) => c.placement_type === selectedPlacement);
      if (!constraint) {
        // Create default constraint for missing placement type
        constraint = createDefaultConstraint(product.id, selectedPlacement);
        setProgress(`Using default ${selectedPlacement} placement settings...`);
        setProgressPercentage(10);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Check cache first
      const cacheKey = cache.generateCacheKey({
        productId: product.id,
        logoHash: processedLogo,
        placementType: selectedPlacement,
        constraintVersion: constraint.id,
      });

      setProgress('Checking cache...');
      setProgressPercentage(20);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        setProgress('Retrieved from cache!');
        setProgressPercentage(100);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setGeneratedMockup(cachedResult.result);
        setOriginalMockup(cachedResult.result);
        setCurrentMockupIndex(0);
        setCurrentStep(4);
        return;
      }

      // Generate mockup via API
      setProgress('Preparing your mockup...');
      setProgressPercentage(30);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgressPercentage((prev) => {
          if (prev < 85) {
            return prev + Math.random() * 10;
          }
          return prev;
        });
      }, 800);

      // Prepare API request based on selected sides
      const requestBody: any = {
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.primary_image_url || '',
          backImageUrl: product.back_image_url || '',
          category: product.category,
          hasBackPrinting: product.has_back_printing,
        },
        placementType: selectedPlacement === 'all_over' ? 'all-over' : selectedPlacement,
        side: selectedSides,
        adjustments: designAdjustments,
      };

      // Add logos based on selected sides
      if (selectedSides === 'both') {
        requestBody.frontLogo = {
          file: frontProcessedLogo,
          processedImageUrl: frontProcessedLogo,
          originalDimensions: { width: 200, height: 100 },
          format: 'png',
          hasTransparency: true,
        };
        requestBody.backLogo = {
          file: backProcessedLogo,
          processedImageUrl: backProcessedLogo,
          originalDimensions: { width: 200, height: 100 },
          format: 'png',
          hasTransparency: true,
        };
      } else if (selectedSides === 'front') {
        const logoData = frontProcessedLogo || processedLogo;
        requestBody.frontLogo = {
          file: logoData,
          processedImageUrl: logoData,
          originalDimensions: { width: 200, height: 100 },
          format: 'png',
          hasTransparency: true,
        };
        // Legacy support
        requestBody.logo = requestBody.frontLogo;
      } else if (selectedSides === 'back') {
        requestBody.backLogo = {
          file: backProcessedLogo,
          processedImageUrl: backProcessedLogo,
          originalDimensions: { width: 200, height: 100 },
          format: 'png',
          hasTransparency: true,
        };
      }

      const apiResponse = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to generate mockup');
      }

      const apiResult = await apiResponse.json();
      const result = apiResult.result;

      clearInterval(progressInterval);
      setProgressPercentage(90);
      setProgress('Finalizing mockup...');

      // Handle dual-sided results
      if (selectedSides === 'both') {
        const frontMockup = result.front;
        const backMockup = result.back;

        if (!frontMockup || !backMockup) {
          throw new Error('No mockup image URL returned for dual-sided generation');
        }

        // Update dual-sided state with proper front and back images
        setGeneratedMockups({
          front: frontMockup,
          back: backMockup,
        });
        setOriginalMockup(frontMockup);
        setGeneratedMockup(frontMockup);
        setCurrentMockupView('front');
      } else {
        // Single-sided result
        const imageUrl =
          selectedSides === 'front'
            ? result.generatedImageUrl || result.front
            : result.back || result.generatedImageUrl;

        if (!imageUrl) {
          throw new Error('No image URL returned from pipeline');
        }

        if (selectedSides === 'front') {
          setGeneratedMockups((prev) => ({ ...prev, front: imageUrl }));
          setCurrentMockupView('front');
        } else {
          setGeneratedMockups((prev) => ({ ...prev, back: imageUrl }));
          setCurrentMockupView('back');
        }

        setGeneratedMockup(imageUrl); // Legacy state for compatibility
        setOriginalMockup(imageUrl);
      }

      // Cache the result (update to handle dual-sided caching)
      const cacheData =
        selectedSides === 'both'
          ? { front: result.front, back: result.back }
          : selectedSides === 'front'
            ? result.generatedImageUrl || result.front
            : result.back || result.generatedImageUrl;

      await cache.set(cacheKey, {
        result: cacheData,
        metadata: {
          productId: product.id,
          placement: selectedPlacement,
          side: selectedSides,
          generatedAt: new Date().toISOString(),
        },
      });
      setCurrentMockupIndex(0);
      setProgressPercentage(100);
      setProgress('Mockup generated successfully!');

      setTimeout(() => {
        setCurrentStep(4);
        setProgressPercentage(0);
        setProgress('');
      }, 500);

      // Generate download formats
      await generateDownloadFormats(result.generatedImageUrl);
    } catch (err) {
      console.error('Error generating mockup:', err);
      setError('Failed to generate mockup. Please try again.');
      if (typeof progressInterval !== 'undefined') {
        clearInterval(progressInterval);
      }
    } finally {
      setLoading(false);
      setProgress('');
      setProgressPercentage(0);
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
      // Immediately show progress UI
      setLoading(true);
      setError(null);
      setProgress('Applying your adjustments...');
      setProgressPercentage(0);

      // Small delay to ensure UI updates
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Simulate progress for adjustment
      const adjustProgressInterval = setInterval(() => {
        setProgressPercentage((prev) => {
          if (prev < 85) {
            return prev + Math.random() * 15;
          }
          return prev;
        });
      }, 800);

      // Call API to generate adjusted mockup using the SAME structure as initial generation
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
          adjustments: designAdjustments, // Use same adjustments structure as initial generation
          additionalRequirements: [enhancedPrompt], // Pass user instruction as additional requirement
          regenerate: true, // Flag to indicate this is a regeneration with constraint context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply adjustments');
      }

      const result = await response.json();
      const newMockupUrl = result.result.generatedImageUrl;

      clearInterval(adjustProgressInterval);
      setProgressPercentage(95);
      setProgress('Finalizing adjustments...');

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
      // Update navigation index to point to the latest mockup
      setCurrentMockupIndex((prev) => prev + 1);

      setProgressPercentage(100);
      setProgress('Adjustments applied successfully!');

      // Generate download formats for new mockup
      await generateDownloadFormats(newMockupUrl);

      setTimeout(() => {
        setProgressPercentage(0);
        setProgress('');
      }, 1000);
    } catch (err) {
      console.error('Error applying adjustments:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply adjustments');
      if (typeof adjustProgressInterval !== 'undefined') {
        clearInterval(adjustProgressInterval);
      }
      setProgressPercentage(0);
    } finally {
      setLoading(false);
      if (progressPercentage !== 100) {
        setProgress('');
        setProgressPercentage(0);
      }
    }
  };

  // Handle reverting to previous version
  const handleRevertToVersion = (historyItem: AdjustmentHistory) => {
    if (historyItem.id === 'original' && originalMockup) {
      setGeneratedMockup(originalMockup);
      setAdjustmentHistory([]);
      setCurrentMockupIndex(0);
    } else {
      setGeneratedMockup(historyItem.mockupUrl);
      // Remove all history items after this one
      const itemIndex = adjustmentHistory.findIndex((item) => item.id === historyItem.id);
      if (itemIndex !== -1) {
        setAdjustmentHistory((prev) => prev.slice(0, itemIndex + 1));
        setCurrentMockupIndex(itemIndex + 1); // +1 because original is at index 0
      }
    }
  };

  // Mockup navigation helpers
  const getAllMockups = () => {
    const mockups = [];
    if (originalMockup) {
      mockups.push({
        id: 'original',
        instruction: 'Original',
        enhancedPrompt: '',
        mockupUrl: originalMockup,
        timestamp: new Date(),
      });
    }
    return [...mockups, ...adjustmentHistory];
  };

  const navigateToPreviousMockup = () => {
    const allMockups = getAllMockups();
    if (currentMockupIndex > 0) {
      const newIndex = currentMockupIndex - 1;
      setCurrentMockupIndex(newIndex);
      setGeneratedMockup(allMockups[newIndex].mockupUrl);
    }
  };

  const navigateToNextMockup = () => {
    const allMockups = getAllMockups();
    if (currentMockupIndex < allMockups.length - 1) {
      const newIndex = currentMockupIndex + 1;
      setCurrentMockupIndex(newIndex);
      setGeneratedMockup(allMockups[newIndex].mockupUrl);
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
    setCurrentMockupIndex(0);
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

        {/* Progress Modal Overlay */}
        {loading && progress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />

            {/* Progress Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                {/* Spinner */}
                <div className="flex justify-center mb-4">
                  <Spinner size="lg" className="w-12 h-12" />
                </div>

                {/* Progress Text */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Creating Your Mockup
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{progress}</p>

                {/* Progress Bar */}
                {progressPercentage > 0 && (
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {Math.round(progressPercentage)}% complete
                    </p>
                  </div>
                )}

                {/* Estimated time */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  This usually takes 10-30 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Product/Mockup Display */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{generatedMockup ? 'Generated Mockup' : 'Selected Product'}</span>
                  <div className="flex items-center gap-4">
                    {/* ViewToggle for dual-sided products */}
                    {generatedMockup && product?.has_back_printing && (
                      <ViewToggle
                        currentView={currentMockupView}
                        onViewChange={(view) => {
                          setCurrentMockupView(view);
                          // Update displayed mockup based on view
                          if (view === 'front' && generatedMockups.front) {
                            setGeneratedMockup(generatedMockups.front);
                          } else if (view === 'back' && generatedMockups.back) {
                            setGeneratedMockup(generatedMockups.back);
                          }
                        }}
                        hasBackView={product.has_back_printing}
                        frontMockup={generatedMockups.front}
                        backMockup={generatedMockups.back}
                      />
                    )}
                    {/* Version navigation */}
                    {generatedMockup && getAllMockups().length > 1 && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>
                          {currentMockupIndex + 1} of {getAllMockups().length}
                        </span>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {product && (
                  <div>
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden relative">
                      {generatedMockup ? (
                        <>
                          <img
                            src={generatedMockup}
                            alt="Generated Mockup"
                            className="w-full h-full object-contain"
                          />
                          {/* Constraint Overlay - only show when toggled on */}
                          {showConstraintOverlay && currentConstraint?.constraint_image_url && (
                            <div className="absolute inset-0 pointer-events-none">
                              <img
                                src={currentConstraint.constraint_image_url}
                                alt="Constraint Zones"
                                className="w-full h-full object-contain"
                                style={{
                                  opacity: 0.5,
                                  mixBlendMode: 'normal',
                                }}
                              />
                            </div>
                          )}
                          {/* Navigation arrows - only show if there are multiple mockups */}
                          {getAllMockups().length > 1 && (
                            <>
                              {/* Left arrow */}
                              <button
                                onClick={navigateToPreviousMockup}
                                disabled={currentMockupIndex === 0}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                                title="Previous mockup"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              {/* Right arrow */}
                              <button
                                onClick={navigateToNextMockup}
                                disabled={currentMockupIndex === getAllMockups().length - 1}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-110"
                                title="Next mockup"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </>
                          )}
                        </>
                      ) : product.primary_image_url ? (
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
                      {generatedMockup ? 'Customized with your logo' : product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">SKU: {product.sku}</span>
                      <span className="text-lg font-semibold text-blue-600">${product.price}</span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Constraint Info with Toggle */}
            {generatedMockup && currentConstraint && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Placement Constraints</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {/* Toggle for constraint overlay */}
                    {currentConstraint.constraint_image_url && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Constraint Zones
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Green overlay shows safe placement areas
                          </p>
                        </div>
                        <button
                          onClick={() => setShowConstraintOverlay(!showConstraintOverlay)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            showConstraintOverlay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              showConstraintOverlay ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* Constraint Details */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Current Limits ({selectedPlacement})
                      </h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Min Size:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {currentConstraint.min_logo_width || 50}x
                            {currentConstraint.min_logo_height || 50}px
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Max Size:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {currentConstraint.max_logo_width || 500}x
                            {currentConstraint.max_logo_height || 500}px
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Default Position:
                          </span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            X: {currentConstraint.default_position_x || 'Center'}, Y:{' '}
                            {currentConstraint.default_position_y || 'Center'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Safe Area:</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {currentConstraint.detected_area_percentage
                              ? `${currentConstraint.detected_area_percentage}% of product`
                              : 'Full placement'}
                          </p>
                        </div>
                      </div>
                      {currentConstraint.guidelines && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            Guidelines:
                          </span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {currentConstraint.guidelines}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Validation Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Constraint Status:</span>
                      <span
                        className={`font-medium ${
                          currentConstraint.is_validated
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {currentConstraint.is_validated ? '✓ Validated' : '⚠ Default'}
                      </span>
                    </div>
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
                  <div className="space-y-6">
                    {/* Side Selection */}
                    {product?.has_back_printing && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Choose printing sides:
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedSides('front')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedSides === 'front'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Front Only
                          </button>
                          <button
                            onClick={() => setSelectedSides('back')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedSides === 'back'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Back Only
                          </button>
                          <button
                            onClick={() => setSelectedSides('both')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              selectedSides === 'both'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            Both Sides
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Front Logo Upload */}
                    {(selectedSides === 'front' || selectedSides === 'both') && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedSides === 'both' ? 'Front Logo' : 'Logo'}
                        </h4>
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                            isDragging
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, 'front')}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFrontLogoUpload}
                            className="hidden"
                            id="front-logo-upload"
                          />
                          <label htmlFor="front-logo-upload" className="cursor-pointer block">
                            {frontUploadedFile ? (
                              <div>
                                <div className="text-green-600 mb-2 text-3xl">✓</div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                                  {frontUploadedFile.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                              </div>
                            ) : (
                              <div>
                                <div className="text-3xl text-gray-400 mb-2">🎨</div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                                  Upload front logo
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, WebP up to 10MB
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Back Logo Upload */}
                    {(selectedSides === 'back' || selectedSides === 'both') && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedSides === 'both' ? 'Back Logo' : 'Logo'}
                        </h4>
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                            isDragging
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onDragEnter={handleDragEnter}
                          onDragLeave={handleDragLeave}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, 'back')}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBackLogoUpload}
                            className="hidden"
                            id="back-logo-upload"
                          />
                          <label htmlFor="back-logo-upload" className="cursor-pointer block">
                            {backUploadedFile ? (
                              <div>
                                <div className="text-green-600 mb-2 text-3xl">✓</div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                                  {backUploadedFile.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                              </div>
                            ) : (
                              <div>
                                <div className="text-3xl text-gray-400 mb-2">🎨</div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">
                                  Upload back logo
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, WebP up to 10MB
                                </p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Process Logos Button */}
                    {((selectedSides === 'front' || selectedSides === 'both') &&
                      frontUploadedFile) ||
                    ((selectedSides === 'back' || selectedSides === 'both') && backUploadedFile) ||
                    (selectedSides === 'both' && frontUploadedFile && backUploadedFile) ||
                    uploadedFile ? (
                      <Button onClick={processLogo} disabled={loading} className="w-full">
                        {loading ? 'Processing...' : 'Process Logo(s)'}
                      </Button>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 3: Placement Selection */}
            {currentStep === 3 && (processedLogo || frontProcessedLogo || backProcessedLogo) && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Select Placement</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Processed Logo Preview */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Your Processed Logo{selectedSides === 'both' ? 's' : ''}:
                      </p>

                      {selectedSides === 'both' ? (
                        <div className="flex gap-4 justify-center">
                          {frontProcessedLogo && (
                            <div className="text-center">
                              <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-lg overflow-hidden mb-2">
                                <img
                                  src={frontProcessedLogo}
                                  alt="Front Logo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-xs text-gray-500">Front</p>
                            </div>
                          )}
                          {backProcessedLogo && (
                            <div className="text-center">
                              <div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-lg overflow-hidden mb-2">
                                <img
                                  src={backProcessedLogo}
                                  alt="Back Logo"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <p className="text-xs text-gray-500">Back</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 mx-auto bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                          <img
                            src={
                              selectedSides === 'front'
                                ? frontProcessedLogo || processedLogo
                                : backProcessedLogo
                            }
                            alt="Processed Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
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
                            onChange={(e) => {
                              const newPlacement = e.target.value as
                                | 'horizontal'
                                | 'vertical'
                                | 'all_over';
                              setSelectedPlacement(newPlacement);
                              // Update current constraint
                              const constraint =
                                constraints.find((c) => c.placement_type === newPlacement) ||
                                createDefaultConstraint(product.id, newPlacement);
                              setCurrentConstraint(constraint);
                            }}
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
                            onChange={(e) => {
                              const newPlacement = e.target.value as
                                | 'horizontal'
                                | 'vertical'
                                | 'all_over';
                              setSelectedPlacement(newPlacement);
                              // Update current constraint
                              const constraint =
                                constraints.find((c) => c.placement_type === newPlacement) ||
                                createDefaultConstraint(product.id, newPlacement);
                              setCurrentConstraint(constraint);
                            }}
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
                            onChange={(e) => {
                              const newPlacement = e.target.value as
                                | 'horizontal'
                                | 'vertical'
                                | 'all_over';
                              setSelectedPlacement(newPlacement);
                              // Update current constraint
                              const constraint =
                                constraints.find((c) => c.placement_type === newPlacement) ||
                                createDefaultConstraint(product.id, newPlacement);
                              setCurrentConstraint(constraint);
                            }}
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
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Spinner className="mr-2" size="sm" />
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Mockup'
                      )}
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
                    {/* Prompt Adjuster Component - no preview needed, it's shown in left column */}
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
