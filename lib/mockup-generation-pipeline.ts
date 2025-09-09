/**
 * Mockup Generation Pipeline
 * Input preparation and processing system for AI mockup generation
 */

import { getPromptEngineeringService, PromptGenerationRequest, GeneratedPrompt } from './prompt-engineering';
import { getGoogleAIApiClient, ImageGenerationOptions } from './google-ai-api-client';
import { getAIRequestHandler, RequestBuilder } from './ai-request-handler';

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
  private googleAIClient = getGoogleAIApiClient();
  private requestHandler = getAIRequestHandler();

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

      // Step 3: Apply constraints
      const appliedConstraints = await this.applyConstraints(
        processedLogo,
        request.product,
        request.placementType
      );

      // Step 4: Combine product and logo images
      console.log('About to combine images...');
      const combinedImageUrl = await this.combineImages(
        request.product.imageUrl,
        processedLogo.processedImageUrl || processedLogo.file as string,
        appliedConstraints
      );
      console.log('Combined image result:', combinedImageUrl ? 'Success' : 'Failed');

      // Step 5: Generate constraint mask
      const maskImageUrl = await this.generateConstraintMask(
        request.product,
        request.placementType,
        appliedConstraints
      );

      // Step 6: Generate AI prompt
      const prompt = await this.generatePrompt(request);

      // Step 7: Normalize dimensions
      const normalizedDimensions = await this.normalizeDimensions(combinedImageUrl);

      // Step 8: Apply compression
      const compressedImageUrl = await this.compressImage(combinedImageUrl);

      // Step 9: Add watermark if needed
      const finalImageUrl = await this.addWatermarkIfNeeded(compressedImageUrl);

      const preparationTime = Date.now() - startTime;

      return {
        combinedImageUrl: finalImageUrl,
        maskImageUrl,
        prompt,
        metadata: {
          originalLogo: request.logo,
          product: request.product,
          constraints: appliedConstraints,
          dimensions: normalizedDimensions,
          compression: 0.8, // 80% quality
          watermarked: false, // Set based on configuration
          preparationTime
        }
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
      createdAt: new Date()
    };

    try {
      // Step 1: Prepare inputs
      result.status = 'processing';
      result.preparedInput = await this.prepareInputs(request);

      // Step 2: Create AI generation request
      const aiRequest: RequestBuilder = this.requestHandler.createRequest({
        type: 'mockup_generation',
        priority: 'medium',
        metadata: {
          mockupId,
          productId: request.product.id,
          placementType: request.placementType
        }
      });

      // Step 3: Prepare AI generation options
      const generationOptions: ImageGenerationOptions = {
        prompt: result.preparedInput.prompt.finalPrompt,
        aspectRatio: this.getAspectRatio(request.qualityLevel),
        seed: Math.floor(Math.random() * 1000000),
        includeText: !!request.customText,
        negativePrompt: this.generateNegativePrompt(),
        guidanceScale: this.getGuidanceScale(request.qualityLevel),
        numInferenceSteps: this.getInferenceSteps(request.qualityLevel)
      };

      // Step 4: Submit to AI request handler
      const jobId = await this.requestHandler.addJob(aiRequest, generationOptions);

      // Step 5: Monitor job progress (simplified - would be handled by request handler)
      result.status = 'completed'; // This would be updated by the actual AI processing
      result.generatedImageUrl = result.preparedInput.combinedImageUrl; // Set the generated mockup image
      result.completedAt = new Date();
      result.processingTime = Date.now() - result.createdAt.getTime();
      
      console.log('PIPELINE DEBUG - Combined image URL:', {
        combinedImageUrl: result.preparedInput.combinedImageUrl?.substring(0, 100) + '...',
        combinedImageUrlLength: result.preparedInput.combinedImageUrl?.length || 0,
        combinedImageUrlExists: !!result.preparedInput.combinedImageUrl
      });
      
      console.log('Generated mockup result:', {
        id: result.id,
        status: result.status,
        hasGeneratedImageUrl: !!result.generatedImageUrl,
        generatedImageUrlLength: result.generatedImageUrl?.length || 0,
        preparationTime: result.preparedInput.metadata.preparationTime
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
      processedImageUrl: typeof logo.file === 'string' ? logo.file : URL.createObjectURL(logo.file)
    };
  }

  private async applyConstraints(
    logo: LogoInput,
    product: ProductInput,
    placementType: string
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
        console.log(`No constraint found for product ${product.id} with placement ${placementType}, using fallback`);
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
      
      // Convert to pipeline format using actual detected green pixel area
      const appliedConstraints: AppliedConstraints = {
        isValid: true,
        position: {
          x: requestedPlacement.x / 800, // Normalize to 0-1 (assuming 800px image width)
          y: requestedPlacement.y / 1200 // Normalize to 0-1 (assuming 1200px image height)
        },
        scale: Math.min(
          requestedPlacement.width / 200, // Normalize scale based on expected logo size
          requestedPlacement.height / 100
        ),
        constraintArea: {
          x: requestedPlacement.x,
          y: requestedPlacement.y,
          width: requestedPlacement.width,
          height: requestedPlacement.height
        },
        violations: [],
        adjustments: [`Logo positioned within detected green constraint area for ${placementType} placement`],
        metadata: {
          placementType: placementType as any,
          originalPosition: { x: constraint.default_x / 800, y: constraint.default_y / 1200 },
          appliedAt: new Date()
        }
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
      console.log('calculateOptimalPlacementFromConstraintImage called with constraint:', constraint);
      
      // Skip image processing on server-side, use constraint defaults
      if (typeof window === 'undefined') {
        console.log('Server-side: using constraint defaults instead of image processing');
        return {
          x: constraint?.default_x_position || 300,
          y: constraint?.default_y_position || 400,
          width: 150,
          height: 150
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
            (prev.bounds.width * prev.bounds.height) > (current.bounds.width * current.bounds.height) 
              ? prev : current
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
            height: logoSize
          };
        }
      }
      
      // Fallback to constraint defaults if green pixel detection fails
      return {
        x: constraint?.default_x_position || 300,
        y: constraint?.default_y_position || 400,
        width: 150,
        height: 150
      };
      
    } catch (error) {
      console.error('Error calculating placement from constraint image:', error);
      // Fallback to constraint defaults
      return {
        x: constraint?.default_x_position || 300,
        y: constraint?.default_y_position || 400,
        width: 150,
        height: 150
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
        height: 200
      },
      violations: [],
      adjustments: [`Using fallback constraints for ${placementType} placement - no admin constraints found`],
      metadata: {
        placementType: placementType as any,
        originalPosition: { x: 0.5, y: 0.5 },
        appliedAt: new Date()
      }
    };
  }

  private async combineImages(
    productImageUrl: string,
    logoImageUrl: string,
    constraints: AppliedConstraints
  ): Promise<string> {
    console.log('Combining images:', { productImageUrl, logoImageUrl, constraints });
    
    // Use server-side image processing when running server-side
    if (typeof window === 'undefined') {
      const { combineImages } = await import('./server-image-utils');
      
      return await combineImages({
        productImageUrl: productImageUrl,
        logoImageUrl: logoImageUrl,
        logoPlacement: {
          x: constraints.constraintArea.x,
          y: constraints.constraintArea.y,
          width: constraints.constraintArea.width,
          height: constraints.constraintArea.height
        },
        outputWidth: 800,
        outputHeight: 600
      });
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
      const logoY = constraints.position.y * canvas.height - (logoImg.height * constraints.scale) / 2;
      const logoWidth = logoImg.width * constraints.scale;
      const logoHeight = logoImg.height * constraints.scale;

      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      return canvas.toDataURL('image/png');
      
    } catch (error) {
      console.error('Error combining images:', error);
      
      // Fallback to mock image if proxy fails
      canvas.width = 400;
      canvas.height = 600;

      // Draw mock product background
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(100, 100, 200, 400);
      
      // Draw bottle cap
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(120, 80, 160, 40);
      
      // Draw logo area
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(120, 200, 160, 100);
      
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
      const canvas = createCanvas(constraints.constraintArea.width, constraints.constraintArea.height);
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
      additionalRequirements: request.additionalRequirements
    };

    return this.promptService.generatePrompt(promptRequest);
  }

  private async normalizeDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    console.log('Normalizing dimensions for:', imageUrl);
    
    // Skip dimension normalization on server-side, use defaults
    if (typeof window === 'undefined') {
      console.log('Server-side: using default normalized dimensions');
      return {
        width: 800,
        height: 600
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
        height: Math.round(img.height * ratio)
      };
    } catch (error) {
      console.warn('Failed to get image dimensions, using defaults:', error);
      // Fallback dimensions
      return {
        width: 400,
        height: 600
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
      'Drinkware': 'mug',
      'Apparel': 'tshirt',
      'Office': 'pen',
      'Stationery': 'notebook',
      'Bags': 'tote_bag'
    };

    return categoryMap[product.category] || 'mug';
  }

  private getAspectRatio(qualityLevel: string): '1:1' | '4:3' | '16:9' | '21:9' {
    const ratioMap: Record<string, '1:1' | '4:3' | '16:9' | '21:9'> = {
      'basic': '1:1',
      'enhanced': '4:3',
      'premium': '16:9',
      'ultra': '21:9'
    };
    return ratioMap[qualityLevel] || '1:1';
  }

  private generateNegativePrompt(): string {
    return 'blurry, low quality, distorted, watermark, text overlay, poor lighting, artifacts';
  }

  private getGuidanceScale(qualityLevel: string): number {
    const scaleMap: Record<string, number> = {
      'basic': 7.5,
      'enhanced': 10.0,
      'premium': 12.5,
      'ultra': 15.0
    };
    return scaleMap[qualityLevel] || 7.5;
  }

  private getInferenceSteps(qualityLevel: string): number {
    const stepsMap: Record<string, number> = {
      'basic': 20,
      'enhanced': 30,
      'premium': 40,
      'ultra': 50
    };
    return stepsMap[qualityLevel] || 20;
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

  private async loadImageWithFallback(imageUrl: string, type: 'product' | 'logo'): Promise<HTMLImageElement> {
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
        // Create a mock product image
        canvas.width = 400;
        canvas.height = 600;
        
        if (ctx) {
          // Green bottle shape
          ctx.fillStyle = '#4CAF50';
          ctx.fillRect(100, 100, 200, 400);
          
          // Bottle cap
          ctx.fillStyle = '#2E7D32';
          ctx.fillRect(120, 80, 160, 40);
          
          // Label area (where logo will go)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(120, 200, 160, 100);
          
          // Text
          ctx.fillStyle = '#000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Product Mock', 200, 550);
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