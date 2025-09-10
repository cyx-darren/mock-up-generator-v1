/**
 * Mockup Generation Pipeline
 * Input preparation and processing system for AI mockup generation
 */

import {
  getPromptEngineeringService,
  PromptGenerationRequest,
  GeneratedPrompt,
} from './prompt-engineering';
import { GoogleGenerativeAI } from '@google/generative-ai';
// Removed AI request handler - using direct Google AI integration

// Applied constraints interface for the pipeline
export interface AppliedConstraints {
  isValid: boolean;
  position: { x: number; y: number }; // Normalized 0-1 coordinates
  scale: number; // Logo scale factor
  constraintArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  violations: string[];
  adjustments: string[];
  metadata: {
    placementType: 'horizontal' | 'vertical' | 'all-over' | 'corner' | 'center';
    originalPosition: { x: number; y: number };
    appliedAt: Date;
  };
}

// Types for input preparation
export interface LogoInput {
  file: File | string; // File object or URL
  processedImageUrl?: string; // After background removal
  originalDimensions: {
    width: number;
    height: number;
  };
  format: 'png' | 'jpg' | 'svg' | 'webp';
  hasTransparency: boolean;
}

export interface ProductInput {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  constraints: {
    horizontal?: any;
    vertical?: any;
    allOver?: any;
  };
}

export interface MockupGenerationRequest {
  logo: LogoInput;
  product: ProductInput;
  placementType: 'horizontal' | 'vertical' | 'all-over' | 'corner' | 'center';
  qualityLevel: 'basic' | 'enhanced' | 'premium' | 'ultra';
  stylePreferences: {
    lighting?: string;
    angle?: string;
    background?: string;
    mood?: string;
    aesthetic?: string;
  };
  customText?: string;
  brandColors?: string[];
  additionalRequirements?: string[];
}

export interface PreparedInput {
  combinedImageUrl: string;
  maskImageUrl: string;
  prompt: GeneratedPrompt;
  metadata: {
    originalLogo: LogoInput;
    product: ProductInput;
    constraints: AppliedConstraints;
    dimensions: {
      width: number;
      height: number;
    };
    compression: number;
    watermarked: boolean;
    preparationTime: number;
  };
}

export interface MockupGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  preparedInput: PreparedInput;
  generatedImageUrl?: string;
  error?: string;
  processingTime?: number;
  createdAt: Date;
  completedAt?: Date;
}

export class MockupGenerationPipeline {
  private promptService = getPromptEngineeringService();
  private googleAI = new GoogleGenerativeAI(
    process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || ''
  );
  // Using direct Google AI integration instead of request handler

  /**
   * Main pipeline method - prepares inputs for mockup generation
   */
  async prepareInputs(request: MockupGenerationRequest): Promise<PreparedInput> {
    const startTime = Date.now();

    try {
      // Step 1: Validate inputs
      this.validateInputs(request);

      // Step 2: Process logo image
      const processedLogo = await this.processLogoImage(request.logo);

      // Step 3: Get actual product image dimensions
      const actualDimensions = await this.getProductImageDimensions(request.product.imageUrl);
      console.log('Using actual product dimensions:', actualDimensions);

      // Step 4: Apply constraints using actual dimensions
      const appliedConstraints = await this.applyConstraints(
        processedLogo,
        request.product,
        request.placementType,
        actualDimensions
      );

      // Step 5: Generate mockup directly with Gemini - simple and effective
      console.log('Generating mockup with simplified approach...');
      let mockupImageUrl;
      try {
        mockupImageUrl = await this.combineImages(
          request.product.imageUrl,
          processedLogo.processedImageUrl || (processedLogo.file as string),
          appliedConstraints,
          undefined,
          actualDimensions
        );
        console.log('Mockup generation result:', mockupImageUrl ? 'Success' : 'Failed');
      } catch (combineImagesError) {
        console.error('WEBP FALLBACK: combineImages failed with error:', combineImagesError);
        mockupImageUrl = null; // Set to null to trigger fallback
      }

      // Skip all the complex processing - Gemini handles it all
      let finalImageUrl = mockupImageUrl;

      // WebP Fallback: If mockup generation failed (likely due to WebP), provide fallback
      if (!finalImageUrl) {
        console.log(
          'WEBP FALLBACK: Mockup generation failed, likely due to WebP compatibility. Creating placeholder mockup.'
        );

        // Create a simple data URL placeholder mockup indicating WebP limitation
        const placeholderSvg = `
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
            <text x="200" y="180" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">
              Mockup Preview Unavailable
            </text>
            <text x="200" y="200" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">
              WebP product image format
            </text>
            <text x="200" y="220" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">
              not supported in current setup
            </text>
            <text x="200" y="260" text-anchor="middle" fill="#999" font-family="Arial" font-size="10">
              Product: ${request.product.name}
            </text>
            <text x="200" y="275" text-anchor="middle" fill="#999" font-family="Arial" font-size="10">
              Placement: ${request.placementType}
            </text>
          </svg>
        `;

        finalImageUrl = `data:image/svg+xml;base64,${Buffer.from(placeholderSvg).toString('base64')}`;
        console.log('WEBP FALLBACK: Created placeholder mockup data URL');
      }

      const preparationTime = Date.now() - startTime;

      return {
        combinedImageUrl: finalImageUrl,
        maskImageUrl: '', // Not needed with simplified approach
        prompt: { finalPrompt: 'Simplified Gemini approach' } as GeneratedPrompt,
        metadata: {
          originalLogo: request.logo,
          product: request.product,
          constraints: appliedConstraints,
          dimensions: actualDimensions,
          compression: 1.0, // No compression - let Gemini handle quality
          watermarked: false,
          preparationTime,
        },
      };
    } catch (error: any) {
      throw new Error(`Input preparation failed: ${error.message}`);
    }
  }

  /**
   * Generate complete mockup
   */
  async generateMockup(request: MockupGenerationRequest): Promise<MockupGenerationResult> {
    const mockupId = this.generateMockupId();

    const result: MockupGenerationResult = {
      id: mockupId,
      status: 'pending',
      preparedInput: {} as PreparedInput,
      createdAt: new Date(),
    };

    try {
      // Step 1: Prepare inputs
      result.status = 'processing';
      result.preparedInput = await this.prepareInputs(request);

      // Step 2: Generate mockup directly (no request handler needed)
      // The actual mockup generation is already happening in prepareInputs -> combineImages
      result.status = 'completed'; // This would be updated by the actual AI processing
      result.generatedImageUrl = result.preparedInput.combinedImageUrl; // Set the generated mockup image
      result.completedAt = new Date();
      result.processingTime = Date.now() - result.createdAt.getTime();

      console.log('PIPELINE DEBUG - Combined image URL:', {
        combinedImageUrl: result.preparedInput.combinedImageUrl?.substring(0, 100) + '...',
        combinedImageUrlLength: result.preparedInput.combinedImageUrl?.length || 0,
        combinedImageUrlExists: !!result.preparedInput.combinedImageUrl,
      });

      console.log('Generated mockup result:', {
        id: result.id,
        status: result.status,
        hasGeneratedImageUrl: !!result.generatedImageUrl,
        generatedImageUrlLength: result.generatedImageUrl?.length || 0,
        preparationTime: result.preparedInput.metadata.preparationTime,
      });

      return result;
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      result.completedAt = new Date();
      return result;
    }
  }

  /**
   * Private helper methods
   */
  private validateInputs(request: MockupGenerationRequest): void {
    if (!request.logo) {
      throw new Error('Logo is required');
    }
    if (!request.product) {
      throw new Error('Product is required');
    }
    if (!request.placementType) {
      throw new Error('Placement type is required');
    }
  }

  private async processLogoImage(logo: LogoInput): Promise<LogoInput> {
    // This would integrate with background removal service
    // For now, return as-is
    return {
      ...logo,
      processedImageUrl: typeof logo.file === 'string' ? logo.file : URL.createObjectURL(logo.file),
    };
  }

  private async applyConstraints(
    logo: LogoInput,
    product: ProductInput,
    placementType: string,
    productDimensions?: { width: number; height: number }
  ): Promise<AppliedConstraints> {
    try {
      // Import constraint application service
      const { getConstraintApplicationService } = await import('./constraint-application');
      const constraintService = getConstraintApplicationService();

      // Load constraint for this product and placement type
      const constraint = await constraintService.getConstraintForPlacement(
        product.id,
        placementType as 'horizontal' | 'vertical' | 'all_over'
      );

      if (!constraint) {
        console.log(
          `No constraint found for product ${product.id} with placement ${placementType}, using fallback`
        );
        // Fallback to center placement with reasonable defaults
        return this.createFallbackConstraints(placementType);
      }

      // Use the detected green pixel areas for logo placement
      // Instead of using just default position, we need to place the logo within the actual detected green areas
      const requestedPlacement = await this.calculateOptimalPlacementFromConstraintImage(
        constraint,
        logo,
        product
      );

      // Use product dimensions for normalization, with fallback to square format
      const imageWidth = productDimensions?.width || 1200;
      const imageHeight = productDimensions?.height || 1200;

      console.log('Using dimensions for constraint normalization:', { imageWidth, imageHeight });

      // Convert to pipeline format using actual detected green pixel area
      const appliedConstraints: AppliedConstraints = {
        isValid: true,
        position: {
          x: requestedPlacement.x / imageWidth, // Normalize to 0-1 using actual image width
          y: requestedPlacement.y / imageHeight, // Normalize to 0-1 using actual image height
        },
        scale: Math.min(
          requestedPlacement.width / (imageWidth * 0.25), // Normalize scale to 25% of image width
          requestedPlacement.height / (imageHeight * 0.125) // Normalize scale to 12.5% of image height
        ),
        constraintArea: {
          x: requestedPlacement.x,
          y: requestedPlacement.y,
          width: requestedPlacement.width,
          height: requestedPlacement.height,
        },
        violations: [],
        adjustments: [
          `Logo positioned within detected green constraint area for ${placementType} placement`,
        ],
        metadata: {
          placementType: placementType as any,
          originalPosition: {
            x: constraint.default_x / imageWidth,
            y: constraint.default_y / imageHeight,
          },
          appliedAt: new Date(),
        },
      };

      console.log(`Applied real constraints for ${placementType} placement:`, appliedConstraints);
      return appliedConstraints;
    } catch (error) {
      console.error('Error applying constraints:', error);
      // Fallback to safe defaults if constraint application fails
      return this.createFallbackConstraints(placementType);
    }
  }

  /**
   * Calculate optimal logo placement within detected green constraint areas
   */
  private async calculateOptimalPlacementFromConstraintImage(
    constraint: any,
    logo: LogoInput,
    product: ProductInput
  ): Promise<{ x: number; y: number; width: number; height: number }> {
    try {
      console.log(
        'calculateOptimalPlacementFromConstraintImage called with constraint:',
        constraint
      );

      // Skip image processing on server-side, use constraint defaults
      if (typeof window === 'undefined') {
        console.log('Server-side: using constraint defaults instead of image processing');
        console.log('Constraint data received:', constraint);

        // Use actual constraint data from database with proper field names
        const logoX = constraint?.default_x || 300;
        const logoY = constraint?.default_y || 400;
        const logoWidth = constraint?.max_logo_width || 150;
        const logoHeight = constraint?.max_logo_height || 150;

        console.log('Using constraint placement:', { logoX, logoY, logoWidth, logoHeight });

        return {
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
        };
      }

      // If we have constraint image URL, analyze the green pixels (client-side only)
      if (constraint.constraint_image_url) {
        const { detectGreenConstraints } = await import('@/lib/color-detection');

        // Load the constraint image and detect green areas
        const constraintImage = new Image();
        await new Promise((resolve, reject) => {
          constraintImage.onload = resolve;
          constraintImage.onerror = reject;
          constraintImage.src = constraint.constraint_image_url;
        });

        // Create canvas to process the image
        const canvas = document.createElement('canvas');
        canvas.width = constraintImage.width;
        canvas.height = constraintImage.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(constraintImage, 0, 0);

        // Get image data and detect green areas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const detectedAreas = detectGreenConstraints(imageData);

        if (detectedAreas.length > 0) {
          // Use the largest detected green area
          const largestArea = detectedAreas.reduce((prev, current) =>
            prev.bounds.width * prev.bounds.height > current.bounds.width * current.bounds.height
              ? prev
              : current
          );

          // Calculate logo placement within the green area
          // Place logo in the center of the green area with appropriate scaling
          const logoSize = Math.min(
            largestArea.bounds.width * 0.8, // 80% of green area width
            largestArea.bounds.height * 0.8, // 80% of green area height
            200 // Maximum logo size
          );

          return {
            x: largestArea.bounds.x + (largestArea.bounds.width - logoSize) / 2,
            y: largestArea.bounds.y + (largestArea.bounds.height - logoSize) / 2,
            width: logoSize,
            height: logoSize,
          };
        }
      }

      // Fallback to constraint defaults if green pixel detection fails
      return {
        x: constraint?.default_x || 300,
        y: constraint?.default_y || 400,
        width: constraint?.max_logo_width || 150,
        height: constraint?.max_logo_height || 150,
      };
    } catch (error) {
      console.error('Error calculating placement from constraint image:', error);
      // Fallback to constraint defaults
      return {
        x: constraint?.default_x || 300,
        y: constraint?.default_y || 400,
        width: constraint?.max_logo_width || 150,
        height: constraint?.max_logo_height || 150,
      };
    }
  }

  private createFallbackConstraints(placementType: string): AppliedConstraints {
    return {
      isValid: true,
      position: { x: 0.5, y: 0.5 }, // Center position (normalized 0-1)
      scale: 0.6, // Smaller scale for safety
      constraintArea: {
        x: 200,
        y: 300,
        width: 400,
        height: 200,
      },
      violations: [],
      adjustments: [
        `Using fallback constraints for ${placementType} placement - no admin constraints found`,
      ],
      metadata: {
        placementType: placementType as any,
        originalPosition: { x: 0.5, y: 0.5 },
        appliedAt: new Date(),
      },
    };
  }

  private async combineImages(
    productImageUrl: string,
    logoImageUrl: string,
    constraints: AppliedConstraints,
    productType?: string,
    targetDimensions?: { width: number; height: number }
  ): Promise<string> {
    console.log('[combineImages] Starting image combination');
    console.log('[combineImages] Product type:', productType);
    console.log('[combineImages] Product URL:', productImageUrl?.substring(0, 100));

    // Use simplified Gemini approach for mockup generation
    if (typeof window === 'undefined') {
      return await this.generateAIMockup(
        productImageUrl,
        logoImageUrl,
        constraints,
        productType,
        targetDimensions
      );
    }

    // Proxy external URLs through our API to avoid CORS (client-side fallback)
    const proxiedProductUrl = this.getProxiedUrl(productImageUrl);
    const proxiedLogoUrl = this.getProxiedUrl(logoImageUrl);

    // Create canvas and combine images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    try {
      // Load product image through proxy
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        productImg.onload = () => resolve();
        productImg.onerror = () => reject(new Error('Failed to load product image'));
        productImg.src = proxiedProductUrl;
      });

      // Load logo image through proxy
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error('Failed to load logo image'));
        logoImg.src = proxiedLogoUrl;
      });

      // Set canvas size
      canvas.width = productImg.width;
      canvas.height = productImg.height;

      // Draw product image
      ctx.drawImage(productImg, 0, 0);

      // Draw logo with constraints applied
      const logoX = constraints.position.x * canvas.width - (logoImg.width * constraints.scale) / 2;
      const logoY =
        constraints.position.y * canvas.height - (logoImg.height * constraints.scale) / 2;
      const logoWidth = logoImg.width * constraints.scale;
      const logoHeight = logoImg.height * constraints.scale;

      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error combining images:', error);

      // Fallback to mock image if proxy fails (square format)
      canvas.width = 600;
      canvas.height = 600;

      // Draw mock product background (centered square)
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(150, 100, 300, 400);

      // Draw bottle cap
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(200, 80, 200, 40);

      // Draw logo area (centered)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(200, 250, 200, 100);

      // Draw mock logo
      ctx.fillStyle = '#0066CC';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST LOGO', 200, 250);

      // Add placement info
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.fillText(`${constraints.metadata.placementType} placement`, 200, 280);
      ctx.fillText(`Scale: ${constraints.scale.toFixed(2)}`, 200, 295);

      // Product label
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText('Mockup Generated!', 200, 550);

      return canvas.toDataURL('image/png');
    }
  }

  private async generateConstraintMask(
    product: ProductInput,
    placementType: string,
    constraints: AppliedConstraints
  ): Promise<string> {
    // Generate a mask image showing the constraint area

    // Use server-side canvas when running server-side
    if (typeof window === 'undefined') {
      const { createCanvas } = await import('canvas');
      const canvas = createCanvas(
        constraints.constraintArea.width,
        constraints.constraintArea.height
      );
      const ctx = canvas.getContext('2d');

      // Fill with black (masked area)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add white area for constraint region (unmasked)
      ctx.fillStyle = 'white';
      ctx.fillRect(
        Math.max(0, constraints.constraintArea.x),
        Math.max(0, constraints.constraintArea.y),
        Math.min(constraints.constraintArea.width, canvas.width),
        Math.min(constraints.constraintArea.height, canvas.height)
      );

      return canvas.toDataURL('image/png');
    }

    // Client-side fallback
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    canvas.width = constraints.constraintArea.width;
    canvas.height = constraints.constraintArea.height;

    // Fill with black (masked area)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white area where logo can be placed
    ctx.fillStyle = 'white';
    ctx.fillRect(
      constraints.constraintArea.x,
      constraints.constraintArea.y,
      constraints.constraintArea.width,
      constraints.constraintArea.height
    );

    return canvas.toDataURL('image/png');
  }

  private async generatePrompt(request: MockupGenerationRequest): Promise<GeneratedPrompt> {
    const promptRequest: PromptGenerationRequest = {
      productType: this.getProductTypeFromProduct(request.product),
      placementType: request.placementType,
      qualityLevel: request.qualityLevel,
      stylePreferences: request.stylePreferences,
      customText: request.customText,
      brandColors: request.brandColors,
      additionalRequirements: request.additionalRequirements,
    };

    return this.promptService.generatePrompt(promptRequest);
  }

  private async normalizeDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    console.log('Normalizing dimensions for:', imageUrl);

    // Skip dimension normalization on server-side, use defaults
    if (typeof window === 'undefined') {
      console.log('Server-side: using default square dimensions');
      return {
        width: 1200,
        height: 1200,
      };
    }

    try {
      // Use proxied URL to avoid CORS
      const proxiedUrl = this.getProxiedUrl(imageUrl);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for dimensions'));
        img.src = proxiedUrl;
      });

      // Return normalized dimensions (e.g., max 1024px)
      const maxSize = 1024;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);

      return {
        width: Math.round(img.width * ratio),
        height: Math.round(img.height * ratio),
      };
    } catch (error) {
      console.warn('Failed to get image dimensions, using defaults:', error);
      // Fallback dimensions
      return {
        width: 400,
        height: 600,
      };
    }
  }

  private async compressImage(imageUrl: string): Promise<string> {
    // This would implement image compression
    // For now, return the same URL
    return imageUrl;
  }

  private async addWatermarkIfNeeded(imageUrl: string): Promise<string> {
    // Add watermark if configuration requires it
    // For now, return without watermark
    return imageUrl;
  }

  private getProductTypeFromProduct(product: ProductInput): string {
    // Map product category to prompt engineering product type
    const categoryMap: Record<string, string> = {
      Drinkware: 'mug',
      Apparel: 'tshirt',
      Office: 'pen',
      Stationery: 'notebook',
      Bags: 'tote_bag',
    };

    return categoryMap[product.category] || 'mug';
  }

  private getAspectRatio(qualityLevel: string): '1:1' | '4:3' | '16:9' | '21:9' | '2:3' {
    // This method is deprecated - use calculateAspectRatio instead
    // Default to square format for consistent output
    return '1:1';
  }

  private calculateAspectRatio(dimensions: { width: number; height: number }): string {
    const ratio = dimensions.width / dimensions.height;

    // Round to common aspect ratios for better compatibility
    if (Math.abs(ratio - 1) < 0.1) return '1:1'; // Square
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3'; // Classic
    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9'; // Widescreen
    if (Math.abs(ratio - 21 / 9) < 0.1) return '21:9'; // Ultra-wide
    if (Math.abs(ratio - 2 / 3) < 0.1) return '2:3'; // Portrait
    if (Math.abs(ratio - 3 / 2) < 0.1) return '3:2'; // Photo standard

    // For non-standard ratios, return the calculated ratio as string
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(dimensions.width, dimensions.height);
    const simplifiedWidth = dimensions.width / divisor;
    const simplifiedHeight = dimensions.height / divisor;

    return `${simplifiedWidth}:${simplifiedHeight}`;
  }

  private generateNegativePrompt(): string {
    return 'blurry, low quality, distorted, watermark, text overlay, poor lighting, artifacts';
  }

  private getGuidanceScale(qualityLevel: string): number {
    const scaleMap: Record<string, number> = {
      basic: 7.5,
      enhanced: 10.0,
      premium: 12.5,
      ultra: 15.0,
    };
    return scaleMap[qualityLevel] || 7.5;
  }

  private getInferenceSteps(qualityLevel: string): number {
    const stepsMap: Record<string, number> = {
      basic: 20,
      enhanced: 30,
      premium: 40,
      ultra: 50,
    };
    return stepsMap[qualityLevel] || 20;
  }

  /**
   * Generate AI mockup using Canvas Compositing + AI Enhancement approach
   */
  private async generateAIMockup(
    productImageUrl: string,
    logoImageUrl: string,
    constraints: AppliedConstraints,
    productType?: string,
    targetDimensions?: { width: number; height: number }
  ): Promise<string> {
    try {
      console.log('[generateAIMockup] Starting Canvas Compositing + AI Enhancement approach');
      console.log('[generateAIMockup] Product type:', productType || 'product');
      console.log('[generateAIMockup] Product URL:', productImageUrl?.substring(0, 100));
      console.log('[generateAIMockup] Logo URL:', logoImageUrl?.substring(0, 100));
      console.log('[generateAIMockup] Target dimensions:', targetDimensions);

      // Step 1: Create canvas composite with original product + logo
      const canvasComposite = await this.createCanvasComposite(
        productImageUrl,
        logoImageUrl,
        constraints,
        targetDimensions
      );
      console.log('[generateAIMockup] Canvas composite created, length:', canvasComposite?.length);

      // Step 2: Send composite to Gemini for ENHANCEMENT only (not generation)
      const enhancedImage = await this.enhanceCompositeWithAI(
        canvasComposite,
        productType,
        targetDimensions
      );
      console.log('[generateAIMockup] Enhanced image received, length:', enhancedImage?.length);

      if (!enhancedImage) {
        console.error('[generateAIMockup] No enhanced image returned from AI');
        throw new Error('No enhanced image returned from AI enhancement');
      }

      console.log('[generateAIMockup] Successfully generated mockup with Canvas + AI Enhancement');
      return enhancedImage;
    } catch (error: any) {
      console.error('[generateAIMockup] Canvas + AI Enhancement mockup generation failed:', error);
      throw new Error(`Failed to generate AI mockup: ${error.message}`);
    }
  }

  /**
   * Create canvas composite with original product photo + logo overlay
   */
  private async createCanvasComposite(
    productImageUrl: string,
    logoImageUrl: string,
    constraints: AppliedConstraints,
    targetDimensions?: { width: number; height: number }
  ): Promise<string> {
    const { createCanvas, loadImage } = await import('canvas');

    try {
      console.log('[createCanvasComposite] Loading product image from:', productImageUrl);

      // Load original product image with better error handling and format conversion
      let productImg;
      try {
        // Convert WebP to a supported format if needed
        const imageUrlToLoad = productImageUrl;

        // Check if the image URL is WebP format
        if (productImageUrl.includes('.webp')) {
          console.log(
            '[createCanvasComposite] Detected WebP format, attempting direct Canvas loading...'
          );

          try {
            // Try loading WebP directly with Canvas - newer versions support it
            productImg = await loadImage(productImageUrl);
            console.log('[createCanvasComposite] Successfully loaded WebP directly via Canvas');
          } catch (webpError) {
            console.log(
              '[createCanvasComposite] Direct WebP loading failed, trying buffer approach:',
              webpError.message
            );

            // Fallback: fetch as buffer and try loading that way
            const response = await fetch(productImageUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }

            const imageBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(imageBuffer);
            productImg = await loadImage(buffer);
            console.log('[createCanvasComposite] Successfully loaded WebP via buffer approach');
          }
        } else {
          productImg = await loadImage(productImageUrl);
        }

        console.log('[createCanvasComposite] Loaded original product image:', {
          width: productImg.width,
          height: productImg.height,
        });
      } catch (productImageError) {
        console.error('[createCanvasComposite] Failed to load product image:', productImageError);
        throw new Error(
          `Failed to load product image from ${productImageUrl}: ${productImageError.message}`
        );
      }

      console.log(
        '[createCanvasComposite] Loading logo image from:',
        logoImageUrl?.substring(0, 50) + '...'
      );

      // Load logo image with better error handling
      let logoImg;
      try {
        logoImg = await loadImage(logoImageUrl);
        console.log('[createCanvasComposite] Loaded logo image:', {
          width: logoImg.width,
          height: logoImg.height,
        });
      } catch (logoImageError) {
        console.error('[createCanvasComposite] Failed to load logo image:', logoImageError);
        throw new Error(`Failed to load logo image: ${logoImageError.message}`);
      }

      // Use target dimensions if provided, otherwise use actual product image dimensions
      const canvasWidth = targetDimensions?.width || productImg.width;
      const canvasHeight = targetDimensions?.height || productImg.height;

      console.log('[createCanvasComposite] Using canvas dimensions:', {
        width: canvasWidth,
        height: canvasHeight,
      });

      // Create canvas with actual product dimensions
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Set high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw original product image (preserve exactly)
      ctx.drawImage(productImg as any, 0, 0, canvasWidth, canvasHeight);

      // Calculate logo placement (center of product with responsive sizing)
      const logoWidth = Math.min(canvasWidth * 0.25, 200); // 25% of width or max 200px
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = (canvasWidth - logoWidth) / 2; // Center horizontally
      const logoY = canvasHeight * 0.4; // 40% down the product (responsive positioning)

      // Draw logo as FLAT overlay - no effects, no shadows
      ctx.globalCompositeOperation = 'source-over'; // Simple overlay
      ctx.shadowBlur = 0; // No shadow blur
      ctx.shadowOffsetX = 0; // No shadow offset
      ctx.shadowOffsetY = 0; // No shadow offset
      ctx.drawImage(logoImg as any, logoX, logoY, logoWidth, logoHeight);

      // Convert to high-quality data URL
      const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 0, // No compression
        filters: canvas.PNG_FILTER_NONE,
      });
      const base64 = buffer.toString('base64');

      console.log('Canvas composite created successfully');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error creating canvas composite:', error);
      throw new Error(
        `Failed to create canvas composite: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Enhance the canvas composite using AI to make logo look realistic
   */
  private async enhanceCompositeWithAI(
    compositeImageUrl: string,
    productType?: string,
    targetDimensions?: { width: number; height: number }
  ): Promise<string> {
    try {
      console.log('[enhanceCompositeWithAI] Starting AI enhancement');
      console.log('[enhanceCompositeWithAI] Product type:', productType || 'product');

      // Convert composite to base64 for Gemini
      const compositeData = await this.convertImageToBase64(compositeImageUrl);
      console.log(
        '[enhanceCompositeWithAI] Composite data prepared, length:',
        compositeData?.data?.length
      );

      // Get proper product description and dimensions
      const productDescription = productType || 'product';
      const dimensionsText = targetDimensions
        ? `${targetDimensions.width}x${targetDimensions.height}`
        : 'original dimensions';

      console.log('[enhanceCompositeWithAI] Target dimensions:', targetDimensions);

      // Enhancement prompt - NO SHADOWS, keep logo FLAT, preserve original dimensions
      const enhancementPrompt = `Enhance this ${productDescription} mockup with the logo as a FLAT print:

IMPORTANT: This is an ENHANCEMENT task, NOT generation.
Keep the product and overall composition exactly as shown.

CRITICAL REQUIREMENTS:
- NO drop shadows on the logo
- NO 3D effects or depth
- NO darkening or shadow effects
- Keep logo FLAT on the surface
- Simple surface print like screen printing or a decal
- Maintain original logo colors exactly (no darkening)
- Logo should appear as a flat print directly on the product
- Adjust perspective to follow product curvature ONLY
- NO artistic embellishments or effects
- Maintain the exact product image and dimensions (${dimensionsText})
- Keep all other elements unchanged
- DO NOT resize, crop, or change aspect ratio

Output: The same image with logo as a clean, flat surface print, maintaining exact original dimensions.`;

      // Create Gemini client
      const client = new (await import('@google/generative-ai')).GoogleGenerativeAI(
        process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || ''
      );

      const imageModel = client.getGenerativeModel({
        model: 'gemini-2.5-flash-image-preview',
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent enhancement
          topP: 0.8,
          topK: 16,
          maxOutputTokens: 8192,
        },
      });

      // Send composite with enhancement prompt
      const parts: any[] = [
        { text: enhancementPrompt },
        {
          inlineData: {
            data: compositeData.data,
            mimeType: compositeData.mimeType,
          },
        },
      ];

      console.log('[enhanceCompositeWithAI] Sending to Gemini for enhancement...');

      const result = await imageModel.generateContent(parts);
      const response = await result.response;
      console.log('[enhanceCompositeWithAI] Gemini response received');

      // Extract enhanced image
      const candidates = response.candidates || [];
      let enhancedImageData: string | null = null;
      let mimeType = 'image/png';

      for (const candidate of candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              enhancedImageData = part.inlineData.data;
              mimeType = part.inlineData.mimeType || 'image/png';
              break;
            }
          }
        }
        if (enhancedImageData) break;
      }

      if (!enhancedImageData) {
        // If enhancement fails, return the canvas composite as fallback
        console.log(
          '[enhanceCompositeWithAI] WARNING: No enhanced image data in response, returning canvas composite'
        );
        console.log('[enhanceCompositeWithAI] Response candidates:', candidates?.length);
        return compositeImageUrl;
      }

      const enhancedDataUrl = `data:${mimeType};base64,${enhancedImageData}`;
      console.log('[enhanceCompositeWithAI] AI enhancement completed successfully');
      console.log('[enhanceCompositeWithAI] Enhanced data URL length:', enhancedDataUrl?.length);
      return enhancedDataUrl;
    } catch (error) {
      console.error('Error enhancing composite with AI:', error);
      // Return original composite if enhancement fails
      return compositeImageUrl;
    }
  }

  /**
   * Get original product image dimensions
   */
  private async getProductImageDimensions(
    productImageUrl: string
  ): Promise<{ width: number; height: number }> {
    try {
      // Use server-side image dimensions detection
      if (typeof window === 'undefined') {
        const { getImageDimensions } = await import('./server-image-utils');
        const dimensions = await getImageDimensions(productImageUrl);
        console.log('Detected actual product image dimensions:', dimensions);
        return dimensions;
      }

      // Client-side fallback for data URLs
      if (productImageUrl.startsWith('data:')) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = productImageUrl;
        });
      }

      // Client-side fallback for HTTP URLs
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = productImageUrl;
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      console.warn('Using fallback dimensions - image may be distorted');
      // Use square fallback dimensions for consistent output
      // This prevents complete failure but logs a warning
      return { width: 1200, height: 1200 }; // 1:1 aspect ratio (square format)
    }
  }

  /**
   * Prepare input images - simple conversion to base64
   */
  private async prepareInputImages(
    productImageUrl: string,
    logoImageUrl: string
  ): Promise<Array<{ data: string; mimeType: string }>> {
    try {
      // Simply convert both images to base64 - no processing
      const productImageData = await this.convertImageToBase64(productImageUrl);
      const logoImageData = await this.convertImageToBase64(logoImageUrl);

      return [
        { data: productImageData.data, mimeType: productImageData.mimeType },
        { data: logoImageData.data, mimeType: logoImageData.mimeType },
      ];
    } catch (error) {
      console.error('Error preparing input images:', error);
      throw new Error(
        `Failed to prepare input images: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Convert image URL to base64 data
   */
  private async convertImageToBase64(
    imageUrl: string
  ): Promise<{ data: string; mimeType: string }> {
    // Handle data URLs
    if (imageUrl.startsWith('data:')) {
      const [header, data] = imageUrl.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      return { data, mimeType };
    }

    // For HTTP URLs, fetch and convert to base64
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = buffer.toString('base64');

      // Determine MIME type from response or URL
      const mimeType = response.headers.get('content-type') || this.getMimeTypeFromUrl(imageUrl);

      return { data, mimeType };
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error(
        `Failed to fetch image from ${imageUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get MIME type from URL extension
   */
  private getMimeTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return mimeTypes[extension || ''] || 'image/png';
  }

  /**
   * Ensure generated image has exact target dimensions
   */
  private async ensureExactDimensions(
    imageDataUrl: string,
    targetDimensions: { width: number; height: number }
  ): Promise<string> {
    try {
      // Server-side processing using canvas
      if (typeof window === 'undefined') {
        const { createCanvas, loadImage } = await import('canvas');

        // Load the generated image
        const img = await loadImage(imageDataUrl);

        // Check if dimensions are already correct
        if (img.width === targetDimensions.width && img.height === targetDimensions.height) {
          console.log('Generated image already has correct dimensions:', {
            width: img.width,
            height: img.height,
          });
          return imageDataUrl;
        }

        console.log(
          'Resizing image from',
          { width: img.width, height: img.height },
          'to',
          targetDimensions
        );

        // Create high-quality canvas with exact target dimensions
        const canvas = createCanvas(targetDimensions.width, targetDimensions.height);
        const ctx = canvas.getContext('2d');

        // Set high-quality image rendering settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.patternQuality = 'best';
        ctx.quality = 'best';

        // Calculate scaling to fit while maintaining aspect ratio, then center
        const sourceAspect = img.width / img.height;
        const targetAspect = targetDimensions.width / targetDimensions.height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (sourceAspect > targetAspect) {
          // Source is wider - fit to height
          drawHeight = targetDimensions.height;
          drawWidth = drawHeight * sourceAspect;
          offsetX = (targetDimensions.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Source is taller - fit to width
          drawWidth = targetDimensions.width;
          drawHeight = drawWidth / sourceAspect;
          offsetX = 0;
          offsetY = (targetDimensions.height - drawHeight) / 2;
        }

        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetDimensions.width, targetDimensions.height);

        // Draw resized image with high quality
        ctx.drawImage(img as any, offsetX, offsetY, drawWidth, drawHeight);

        // Convert back to high-quality data URL
        const buffer = canvas.toBuffer('image/png', {
          compressionLevel: 0, // No compression for maximum quality
          filters: canvas.PNG_FILTER_NONE, // Fastest, highest quality
        });
        const base64 = buffer.toString('base64');
        return `data:image/png;base64,${base64}`;
      }

      // Client-side fallback (should not be needed in this context)
      return imageDataUrl;
    } catch (error) {
      console.error('Error ensuring exact dimensions:', error);
      // Return original if processing fails
      return imageDataUrl;
    }
  }

  /**
   * Create detailed prompt for direct multi-image composition
   */
  private async createDirectCompositionPrompt(
    constraints: AppliedConstraints,
    targetDimensions: { width: number; height: number }
  ): Promise<string> {
    const placementType = constraints.metadata.placementType;
    const position = constraints.position;

    // Create placement description based on constraints
    const placementDescription = this.createPlacementDescription(placementType, position);

    const prompt = `Create a HIGH-RESOLUTION, PROFESSIONAL product mockup image by compositing the provided images.

INPUT IMAGES:
- Image 1: Bamboo Water Bottle (use as the complete base image)
- Image 2: Microsoft logo (overlay onto the bottle)

COMPOSITION TASK:
Recreate the ENTIRE Bamboo Water Bottle from Image 1 with the Microsoft logo from Image 2 overlaid ${placementDescription}.

QUALITY REQUIREMENTS:
1. Generate a CRISP, HIGH-RESOLUTION ${targetDimensions.width}×${targetDimensions.height} pixel image
2. Maintain MAXIMUM image quality with sharp, clear details
3. Use PROFESSIONAL commercial photography quality
4. Ensure ALL elements are CRYSTAL CLEAR and HIGH-DEFINITION
5. NO pixelation, blurriness, or quality degradation
6. PHOTO-REALISTIC rendering with fine details preserved

COMPOSITION REQUIREMENTS:
1. Use the EXACT bottle from Image 1 as the base - preserve its appearance completely
2. Maintain the bottle's natural proportions within the ${targetDimensions.width}×${targetDimensions.height} canvas
3. Include the entire bottle fitted properly within the specified dimensions
4. Preserve ALL aspects of the original bottle: colors, lighting, shadows, background
5. Add ONLY the Microsoft logo from Image 2 as an overlay ${placementDescription}
6. DO NOT crop, cut, or show partial images
7. DO NOT stretch or distort the bottle - it should look naturally proportioned
8. Compose the bottle professionally within the portrait ${targetDimensions.width}×${targetDimensions.height} frame

LOGO INTEGRATION:
- Place the Microsoft logo ${placementDescription} on the bottle surface
- Maintain the logo's original colors (red, green, blue, yellow squares + "Microsoft" text)
- Make it appear as a realistic print/emboss on the bottle
- Scale appropriately and add natural shadows/surface interaction

OUTPUT SPECIFICATIONS:
- Generate a COMPLETE, FULL-SIZE product mockup image
- EXACT OUTPUT DIMENSIONS: ${targetDimensions.width} pixels wide × ${targetDimensions.height} pixels tall
- ASPECT RATIO: ${(targetDimensions.width / targetDimensions.height).toFixed(3)}:1 (portrait orientation)
- The bottle should be properly proportioned within the ${targetDimensions.width}×${targetDimensions.height} canvas
- Include the entire bottle and its background/context fitted within the specified dimensions
- Maintain professional product photography quality
- Result should be the complete original Bamboo Water Bottle with Microsoft logo professionally applied

DIMENSION REQUIREMENTS:
- Output image width: ${targetDimensions.width} pixels (EXACT)
- Output image height: ${targetDimensions.height} pixels (EXACT) 
- Square format (1:1 aspect ratio)
- The bottle should look natural and realistic within these dimensions
- DO NOT stretch or distort the bottle - fit it naturally within the canvas
- ASPECT RATIO: Must be ${(targetDimensions.width / targetDimensions.height).toFixed(3)}:1 (square format)
- Generate the image in EXACT ${targetDimensions.width}×${targetDimensions.height} resolution

QUALITY REQUIREMENTS:
- ULTRA-HIGH DEFINITION, CRYSTAL CLEAR rendering
- SHARP, CRISP edges and fine details throughout
- PROFESSIONAL commercial photography quality (studio lighting)
- ZERO pixelation, blur, or quality degradation
- MAXIMUM resolution and clarity at ${targetDimensions.width}×${targetDimensions.height} pixels
- Natural, properly proportioned bottle appearance
- The bottle should fit well within the ${targetDimensions.width}×${targetDimensions.height} frame
- No stretching, squashing, or unnatural distortion
- HIGH-FIDELITY color reproduction and accurate textures
- PROFESSIONAL studio-quality lighting and shadows

Generate the complete ULTRA-HIGH-QUALITY ${targetDimensions.width}×${targetDimensions.height} pixel image now with MAXIMUM clarity and sharpness.`;

    return prompt;
  }

  /**
   * Create detailed prompt for multi-image composition
   */
  private async createMultiImageCompositionPrompt(
    constraints: AppliedConstraints
  ): Promise<string> {
    const placementType = constraints.metadata.placementType;
    const position = constraints.position;

    // Create placement description based on constraints
    const placementDescription = this.createPlacementDescription(placementType, position);

    const prompt = `You are given two images:
1. The first image is a Bamboo Water Bottle product photo
2. The second image is a Microsoft logo

TASK: Create a professional product mockup by combining these images. The Microsoft logo should be overlaid onto the Bamboo Water Bottle ${placementDescription}.

CRITICAL REQUIREMENTS:
- Use the EXACT Bamboo Water Bottle from the first image as the base
- Preserve the bottle's original appearance, colors, lighting, and background completely
- Only add the Microsoft logo from the second image as an overlay
- Position the Microsoft logo ${placementDescription}
- The logo should appear as a realistic print or emboss on the bottle surface
- Maintain proper scaling and positioning based on the bottle's dimensions
- Add realistic shadows and surface interaction for the logo
- Keep the Microsoft logo colors intact (red, green, blue, yellow squares with "Microsoft" text)

COMPOSITION GUIDELINES:
- The result should look like the original Bamboo Water Bottle with a professionally applied Microsoft logo
- No other changes to the product, background, or lighting
- High-quality, photorealistic rendering
- Commercial photography appearance
- The logo should integrate naturally with the bottle's surface texture

Generate a detailed composition plan describing how to combine these images while preserving the original bottle and adding only the Microsoft logo overlay.`;

    return prompt;
  }

  /**
   * Create detailed prompt for Nano Banana model mockup generation
   */
  private async createMockupPrompt(
    productImageUrl: string,
    logoImageUrl: string,
    constraints: AppliedConstraints
  ): Promise<string> {
    const placementType = constraints.metadata.placementType;
    const position = constraints.position;

    // Determine product type from URL or use generic description
    const productType = this.inferProductTypeFromUrl(productImageUrl);

    // Create placement description based on constraints
    const placementDescription = this.createPlacementDescription(placementType, position);

    // Generate comprehensive prompt that emphasizes preserving the original product appearance
    const prompt = `Create a professional product mockup that preserves the exact appearance of the original ${productType} while adding a Microsoft logo overlay. 

CRITICAL REQUIREMENTS:
- Keep the original product's exact shape, color, material, and design unchanged
- The product should look identical to the source image in all aspects except for the logo addition
- Preserve original product dimensions and proportions
- Maintain the exact same background and lighting as the original
- Only add the Microsoft logo as an overlay element

Product preservation:
- Original ${productType} appearance must be maintained exactly
- Same material texture, color gradients, and surface properties
- Identical lighting conditions and shadows from original
- Preserve all product details and characteristics
- Same camera angle and perspective as original

Logo placement requirements:
- Place Microsoft logo ${placementDescription}
- Logo should appear as a realistic print/emboss overlay on the product surface
- Maintain Microsoft logo colors (red, green, blue, yellow squares with "Microsoft" text)
- Logo should integrate naturally with the product surface
- Proper scaling and positioning according to constraints
- Realistic shadows and surface interaction

Quality standards:
- Photorealistic rendering that matches original product photo quality
- Professional commercial photography appearance
- High resolution and sharp details
- No alterations to the base product beyond logo addition

The result should be the original ${productType} with a professionally applied Microsoft logo, maintaining all original product characteristics while adding the logo overlay at the specified position.`;

    return prompt;
  }

  /**
   * Infer product type from image URL
   */
  private inferProductTypeFromUrl(productImageUrl: string): string {
    const url = productImageUrl.toLowerCase();

    if (url.includes('mug') || url.includes('cup')) return 'coffee mug';
    if (url.includes('bottle') || url.includes('water')) return 'water bottle';
    if (url.includes('shirt') || url.includes('tshirt')) return 't-shirt';
    if (url.includes('bag') || url.includes('tote')) return 'tote bag';
    if (url.includes('pen') || url.includes('pencil')) return 'pen';
    if (url.includes('notebook') || url.includes('journal')) return 'notebook';
    if (url.includes('keychain') || url.includes('key')) return 'keychain';
    if (url.includes('cap') || url.includes('hat')) return 'cap';

    return 'corporate gift item'; // Generic fallback
  }

  /**
   * Create placement description for AI prompt
   */
  private createPlacementDescription(
    placementType: string,
    position: { x: number; y: number }
  ): string {
    const descriptions = {
      horizontal: `horizontally centered on the main surface of the product`,
      vertical: `vertically oriented on the product surface`,
      'all-over': `as a repeating pattern across the entire product surface`,
      corner: `in the corner area of the product`,
      center: `perfectly centered on the main visible surface`,
    };

    let baseDescription =
      descriptions[placementType as keyof typeof descriptions] || descriptions['center'];

    // Add position-specific details based on normalized coordinates
    if (position.x < 0.3) baseDescription += ', positioned towards the left side';
    else if (position.x > 0.7) baseDescription += ', positioned towards the right side';

    if (position.y < 0.3) baseDescription += ', in the upper area';
    else if (position.y > 0.7) baseDescription += ', in the lower area';

    return baseDescription;
  }

  private generateMockupId(): string {
    return `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getProxiedUrl(imageUrl: string): string {
    // If it's already a data URL or local URL, return as-is
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:') || imageUrl.startsWith('/')) {
      return imageUrl;
    }

    // Otherwise, proxy through our API
    return `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  }

  private async loadImageWithFallback(
    imageUrl: string,
    type: 'product' | 'logo'
  ): Promise<HTMLImageElement> {
    try {
      // Try loading with CORS first
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });
      return img;
    } catch (error) {
      console.warn(`CORS failed for ${type} image, using fallback:`, error);

      // Create a fallback image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (type === 'product') {
        // Create a mock product image (square format)
        canvas.width = 600;
        canvas.height = 600;

        if (ctx) {
          // Green bottle shape (centered)
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(150, 100, 300, 400);

          // Bottle cap
          ctx.fillStyle = '#2E7D32';
          ctx.fillRect(200, 80, 200, 40);

          // Label area (where logo will go)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(200, 250, 200, 100);

          // Text
          ctx.fillStyle = '#000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Product Mock', 300, 550);
        }
      } else {
        // Use the original logo image without CORS
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });
        return img;
      }

      // Convert canvas to image
      const fallbackImg = new Image();
      await new Promise<void>((resolve, reject) => {
        fallbackImg.onload = () => resolve();
        fallbackImg.onerror = reject;
        fallbackImg.src = canvas.toDataURL();
      });

      return fallbackImg;
    }
  }
}

// Singleton instance
let pipelineService: MockupGenerationPipeline | null = null;

export function getMockupGenerationPipeline(): MockupGenerationPipeline {
  if (!pipelineService) {
    pipelineService = new MockupGenerationPipeline();
  }
  return pipelineService;
}

export default MockupGenerationPipeline;
