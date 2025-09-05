/**
 * Output Enhancement System
 * Image post-processing with sharpening, color correction, and quality improvements
 */

export interface EnhancementOptions {
  sharpening?: {
    enabled: boolean;
    amount: number; // 0.0-2.0
    radius: number; // 0.5-5.0
    threshold: number; // 0-100
  };
  colorCorrection?: {
    enabled: boolean;
    saturation: number; // 0.0-2.0
    vibrance: number; // -100 to 100
    temperature: number; // -100 to 100 (cool to warm)
    tint: number; // -100 to 100 (green to magenta)
  };
  contrast?: {
    enabled: boolean;
    amount: number; // 0.0-2.0
    highlights: number; // -100 to 100
    shadows: number; // -100 to 100
    midtones: number; // 0.0-2.0
  };
  brightness?: {
    enabled: boolean;
    exposure: number; // -2.0 to 2.0
    brightness: number; // -100 to 100
    gamma: number; // 0.1-3.0
  };
  noiseReduction?: {
    enabled: boolean;
    luminance: number; // 0-100
    color: number; // 0-100
    detail: number; // 0-100
    smoothness: number; // 0-100
  };
  edgeEnhancement?: {
    enabled: boolean;
    strength: number; // 0.0-2.0
    radius: number; // 0.5-5.0
    haloSuppression: number; // 0-100
  };
  outputQuality?: {
    format: 'png' | 'jpg' | 'webp';
    quality: number; // 1-100
    dpi: number; // 72-300
    colorSpace: 'sRGB' | 'AdobeRGB' | 'P3';
  };
}

export interface EnhancementResult {
  originalImage: string; // base64
  enhancedImage: string; // base64
  metadata: {
    originalSize: { width: number; height: number; bytes: number };
    enhancedSize: { width: number; height: number; bytes: number };
    processingTime: number;
    enhancementsApplied: string[];
    qualityScore: number; // 0-100
  };
  settings: EnhancementOptions;
}

export interface QualityMetrics {
  sharpness: number; // 0-100
  colorAccuracy: number; // 0-100
  contrast: number; // 0-100
  brightness: number; // 0-100
  noiseLevel: number; // 0-100 (lower is better)
  overallScore: number; // 0-100
}

export class OutputEnhancer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private processedImages: Map<string, EnhancementResult> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      const context = this.canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2d context from canvas');
      }
      this.ctx = context;
    }
  }

  /**
   * Enhance image with specified options
   */
  async enhanceImage(
    imageData: string | ImageData | HTMLImageElement,
    options: EnhancementOptions = {}
  ): Promise<EnhancementResult> {
    const startTime = performance.now();
    
    // Load image
    const sourceImage = await this.loadImage(imageData);
    const originalImageData = this.getImageData(sourceImage);
    
    // Apply enhancements
    let enhancedImageData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );
    const appliedEnhancements: string[] = [];

    // 1. Noise Reduction (apply first)
    if (options.noiseReduction?.enabled) {
      enhancedImageData = this.applyNoiseReduction(enhancedImageData, options.noiseReduction);
      appliedEnhancements.push('Noise Reduction');
    }

    // 2. Color Correction
    if (options.colorCorrection?.enabled) {
      enhancedImageData = this.applyColorCorrection(enhancedImageData, options.colorCorrection);
      appliedEnhancements.push('Color Correction');
    }

    // 3. Brightness Normalization
    if (options.brightness?.enabled) {
      enhancedImageData = this.applyBrightnessNormalization(enhancedImageData, options.brightness);
      appliedEnhancements.push('Brightness Normalization');
    }

    // 4. Contrast Adjustment
    if (options.contrast?.enabled) {
      enhancedImageData = this.applyContrastAdjustment(enhancedImageData, options.contrast);
      appliedEnhancements.push('Contrast Adjustment');
    }

    // 5. Edge Enhancement
    if (options.edgeEnhancement?.enabled) {
      enhancedImageData = this.applyEdgeEnhancement(enhancedImageData, options.edgeEnhancement);
      appliedEnhancements.push('Edge Enhancement');
    }

    // 6. Sharpening (apply last)
    if (options.sharpening?.enabled) {
      enhancedImageData = this.applySharpening(enhancedImageData, options.sharpening);
      appliedEnhancements.push('Sharpening');
    }

    // Convert to final format
    const originalBase64 = this.imageDataToBase64(originalImageData);
    const enhancedBase64 = this.imageDataToBase64(enhancedImageData, options.outputQuality);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(enhancedImageData);

    const processingTime = performance.now() - startTime;

    const result: EnhancementResult = {
      originalImage: originalBase64,
      enhancedImage: enhancedBase64,
      metadata: {
        originalSize: {
          width: originalImageData.width,
          height: originalImageData.height,
          bytes: originalBase64.length
        },
        enhancedSize: {
          width: enhancedImageData.width,
          height: enhancedImageData.height,
          bytes: enhancedBase64.length
        },
        processingTime,
        enhancementsApplied: appliedEnhancements,
        qualityScore
      },
      settings: options
    };

    // Cache result
    const cacheKey = this.generateCacheKey(imageData, options);
    this.processedImages.set(cacheKey, result);

    return result;
  }

  /**
   * Apply sharpening filter
   */
  private applySharpening(
    imageData: ImageData, 
    options: EnhancementOptions['sharpening']
  ): ImageData {
    const { amount = 1.0, radius = 1.0, threshold = 0 } = options!;
    
    // Unsharp mask algorithm
    const blurredData = this.applyGaussianBlur(imageData, radius);
    const result = new ImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const original = [
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2]
      ];
      
      const blurred = [
        blurredData.data[i],
        blurredData.data[i + 1],
        blurredData.data[i + 2]
      ];
      
      // Calculate difference
      const diff = [
        original[0] - blurred[0],
        original[1] - blurred[1],
        original[2] - blurred[2]
      ];
      
      // Apply threshold
      const diffMagnitude = Math.sqrt(diff[0]**2 + diff[1]**2 + diff[2]**2);
      if (diffMagnitude > threshold) {
        result.data[i] = Math.max(0, Math.min(255, original[0] + diff[0] * amount));
        result.data[i + 1] = Math.max(0, Math.min(255, original[1] + diff[1] * amount));
        result.data[i + 2] = Math.max(0, Math.min(255, original[2] + diff[2] * amount));
      } else {
        result.data[i] = original[0];
        result.data[i + 1] = original[1];
        result.data[i + 2] = original[2];
      }
      
      result.data[i + 3] = imageData.data[i + 3]; // Alpha
    }
    
    return result;
  }

  /**
   * Apply color correction
   */
  private applyColorCorrection(
    imageData: ImageData,
    options: EnhancementOptions['colorCorrection']
  ): ImageData {
    const { 
      saturation = 1.0, 
      vibrance = 0, 
      temperature = 0, 
      tint = 0 
    } = options!;
    
    const result = new ImageData(imageData.width, imageData.height);
    
    // Temperature and tint adjustments
    const tempR = 1.0 + (temperature / 100) * 0.3;
    const tempB = 1.0 - (temperature / 100) * 0.3;
    const tintG = 1.0 + (tint / 100) * 0.3;
    const tintM = 1.0 - (tint / 100) * 0.15;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      let r = imageData.data[i];
      let g = imageData.data[i + 1];
      let b = imageData.data[i + 2];
      
      // Apply temperature and tint
      r *= tempR * tintM;
      g *= tintG;
      b *= tempB * tintM;
      
      // Convert to HSL for saturation adjustment
      const hsl = this.rgbToHsl(r / 255, g / 255, b / 255);
      
      // Apply saturation
      hsl[1] = Math.max(0, Math.min(1, hsl[1] * saturation));
      
      // Apply vibrance (affects low-saturated colors more)
      if (vibrance !== 0) {
        const vibranceAmount = (vibrance / 100) * (1 - hsl[1]);
        hsl[1] = Math.max(0, Math.min(1, hsl[1] + vibranceAmount));
      }
      
      // Convert back to RGB
      const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);
      
      result.data[i] = Math.max(0, Math.min(255, rgb[0] * 255));
      result.data[i + 1] = Math.max(0, Math.min(255, rgb[1] * 255));
      result.data[i + 2] = Math.max(0, Math.min(255, rgb[2] * 255));
      result.data[i + 3] = imageData.data[i + 3];
    }
    
    return result;
  }

  /**
   * Apply contrast adjustment
   */
  private applyContrastAdjustment(
    imageData: ImageData,
    options: EnhancementOptions['contrast']
  ): ImageData {
    const { 
      amount = 1.0, 
      highlights = 0, 
      shadows = 0, 
      midtones = 1.0 
    } = options!;
    
    const result = new ImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      let r = imageData.data[i] / 255;
      let g = imageData.data[i + 1] / 255;
      let b = imageData.data[i + 2] / 255;
      
      // Apply general contrast
      r = (r - 0.5) * amount + 0.5;
      g = (g - 0.5) * amount + 0.5;
      b = (b - 0.5) * amount + 0.5;
      
      // Apply highlights/shadows/midtones
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      if (luminance > 0.7) { // Highlights
        const factor = 1 + (highlights / 100);
        r *= factor;
        g *= factor;
        b *= factor;
      } else if (luminance < 0.3) { // Shadows
        const factor = 1 + (shadows / 100);
        r *= factor;
        g *= factor;
        b *= factor;
      } else { // Midtones
        r *= midtones;
        g *= midtones;
        b *= midtones;
      }
      
      result.data[i] = Math.max(0, Math.min(255, r * 255));
      result.data[i + 1] = Math.max(0, Math.min(255, g * 255));
      result.data[i + 2] = Math.max(0, Math.min(255, b * 255));
      result.data[i + 3] = imageData.data[i + 3];
    }
    
    return result;
  }

  /**
   * Apply brightness normalization
   */
  private applyBrightnessNormalization(
    imageData: ImageData,
    options: EnhancementOptions['brightness']
  ): ImageData {
    const { exposure = 0, brightness = 0, gamma = 1.0 } = options!;
    
    const result = new ImageData(imageData.width, imageData.height);
    const exposureFactor = Math.pow(2, exposure);
    const brightnessFactor = brightness / 100;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      let r = imageData.data[i] / 255;
      let g = imageData.data[i + 1] / 255;
      let b = imageData.data[i + 2] / 255;
      
      // Apply exposure
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
      
      // Apply gamma correction
      r = Math.pow(r, 1 / gamma);
      g = Math.pow(g, 1 / gamma);
      b = Math.pow(b, 1 / gamma);
      
      // Apply brightness
      r += brightnessFactor;
      g += brightnessFactor;
      b += brightnessFactor;
      
      result.data[i] = Math.max(0, Math.min(255, r * 255));
      result.data[i + 1] = Math.max(0, Math.min(255, g * 255));
      result.data[i + 2] = Math.max(0, Math.min(255, b * 255));
      result.data[i + 3] = imageData.data[i + 3];
    }
    
    return result;
  }

  /**
   * Apply noise reduction
   */
  private applyNoiseReduction(
    imageData: ImageData,
    options: EnhancementOptions['noiseReduction']
  ): ImageData {
    const { luminance = 25, color = 25, detail = 50 } = options!;
    
    // Apply bilateral filter for noise reduction while preserving edges
    return this.applyBilateralFilter(imageData, {
      spatialSigma: luminance / 10,
      colorSigma: color / 10,
      iterations: Math.floor(detail / 25) + 1
    });
  }

  /**
   * Apply edge enhancement
   */
  private applyEdgeEnhancement(
    imageData: ImageData,
    options: EnhancementOptions['edgeEnhancement']
  ): ImageData {
    const { strength = 1.0, radius = 1.0, haloSuppression = 50 } = options!;
    
    // Detect edges using Sobel operator
    const edges = this.detectEdges(imageData);
    const result = new ImageData(imageData.width, imageData.height);
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const edgeStrength = edges.data[i] / 255;
      const enhancementAmount = edgeStrength * strength;
      
      // Apply halo suppression
      const suppressionFactor = 1 - (haloSuppression / 100) * Math.pow(edgeStrength, 2);
      const finalStrength = enhancementAmount * suppressionFactor;
      
      result.data[i] = Math.max(0, Math.min(255, 
        imageData.data[i] + (imageData.data[i] * finalStrength)
      ));
      result.data[i + 1] = Math.max(0, Math.min(255, 
        imageData.data[i + 1] + (imageData.data[i + 1] * finalStrength)
      ));
      result.data[i + 2] = Math.max(0, Math.min(255, 
        imageData.data[i + 2] + (imageData.data[i + 2] * finalStrength)
      ));
      result.data[i + 3] = imageData.data[i + 3];
    }
    
    return result;
  }

  /**
   * Calculate quality metrics
   */
  calculateQualityMetrics(imageData: ImageData): QualityMetrics {
    const sharpness = this.calculateSharpness(imageData);
    const colorAccuracy = this.calculateColorAccuracy(imageData);
    const contrast = this.calculateContrast(imageData);
    const brightness = this.calculateBrightness(imageData);
    const noiseLevel = this.calculateNoiseLevel(imageData);
    
    const overallScore = (
      sharpness * 0.25 +
      colorAccuracy * 0.2 +
      contrast * 0.2 +
      brightness * 0.15 +
      (100 - noiseLevel) * 0.2
    );
    
    return {
      sharpness,
      colorAccuracy,
      contrast,
      brightness,
      noiseLevel,
      overallScore
    };
  }

  /**
   * Get preset enhancement configurations
   */
  getPresets(): { [key: string]: EnhancementOptions } {
    return {
      subtle: {
        sharpening: { enabled: true, amount: 0.5, radius: 1.0, threshold: 5 },
        colorCorrection: { enabled: true, saturation: 1.1, vibrance: 5, temperature: 0, tint: 0 },
        contrast: { enabled: true, amount: 1.1, highlights: -5, shadows: 5, midtones: 1.05 }
      },
      moderate: {
        sharpening: { enabled: true, amount: 1.0, radius: 1.2, threshold: 10 },
        colorCorrection: { enabled: true, saturation: 1.2, vibrance: 10, temperature: 5, tint: 0 },
        contrast: { enabled: true, amount: 1.2, highlights: -10, shadows: 10, midtones: 1.1 },
        brightness: { enabled: true, exposure: 0.1, brightness: 5, gamma: 1.05 }
      },
      aggressive: {
        sharpening: { enabled: true, amount: 1.5, radius: 1.5, threshold: 15 },
        colorCorrection: { enabled: true, saturation: 1.4, vibrance: 20, temperature: 10, tint: 0 },
        contrast: { enabled: true, amount: 1.4, highlights: -20, shadows: 20, midtones: 1.2 },
        brightness: { enabled: true, exposure: 0.2, brightness: 10, gamma: 1.1 },
        noiseReduction: { enabled: true, luminance: 15, color: 15, detail: 60, smoothness: 30 },
        edgeEnhancement: { enabled: true, strength: 1.2, radius: 1.0, haloSuppression: 60 }
      },
      portrait: {
        noiseReduction: { enabled: true, luminance: 30, color: 25, detail: 70, smoothness: 50 },
        colorCorrection: { enabled: true, saturation: 1.1, vibrance: 15, temperature: 5, tint: -3 },
        brightness: { enabled: true, exposure: 0.1, brightness: 8, gamma: 1.05 },
        contrast: { enabled: true, amount: 1.15, highlights: -15, shadows: 15, midtones: 1.1 }
      },
      product: {
        sharpening: { enabled: true, amount: 1.2, radius: 1.0, threshold: 8 },
        colorCorrection: { enabled: true, saturation: 1.15, vibrance: 8, temperature: -2, tint: 0 },
        contrast: { enabled: true, amount: 1.25, highlights: -12, shadows: 8, midtones: 1.15 },
        brightness: { enabled: true, exposure: 0.05, brightness: 3, gamma: 1.02 },
        edgeEnhancement: { enabled: true, strength: 0.8, radius: 0.8, haloSuppression: 70 }
      }
    };
  }

  /**
   * Utility methods
   */
  private async loadImage(source: string | ImageData | HTMLImageElement): Promise<HTMLImageElement> {
    if (source instanceof HTMLImageElement) {
      return source;
    }
    
    if (source instanceof ImageData) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = source.width;
      canvas.height = source.height;
      ctx.putImageData(source, 0, 0);
      
      const img = new Image();
      return new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.src = canvas.toDataURL();
      });
    }
    
    // Assume string is base64 or URL
    const img = new Image();
    return new Promise((resolve) => {
      img.onload = () => resolve(img);
      img.src = source;
    });
  }

  private getImageData(img: HTMLImageElement): ImageData {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized - running in non-browser environment');
    }
    
    if (!img || img.width <= 0 || img.height <= 0) {
      throw new Error('Invalid image dimensions');
    }
    
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.clearRect(0, 0, img.width, img.height);
    this.ctx.drawImage(img, 0, 0);
    return this.ctx.getImageData(0, 0, img.width, img.height);
  }

  private imageDataToBase64(
    imageData: ImageData, 
    quality?: EnhancementOptions['outputQuality']
  ): string {
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;
    this.ctx.putImageData(imageData, 0, 0);
    
    const format = quality?.format || 'png';
    const qualityValue = quality?.quality ? quality.quality / 100 : 0.95;
    
    return this.canvas.toDataURL(`image/${format}`, qualityValue);
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const sum = max + min;
    const l = sum / 2;

    if (diff === 0) {
      return [0, 0, l];
    }

    const s = l > 0.5 ? diff / (2 - sum) : diff / sum;

    let h: number;
    switch (max) {
      case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
      case g: h = (b - r) / diff + 2; break;
      case b: h = (r - g) / diff + 4; break;
      default: h = 0;
    }
    h /= 6;

    return [h, s, l];
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) {
      return [l, l, l];
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [
      hue2rgb(p, q, h + 1/3),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - 1/3)
    ];
  }

  private applyGaussianBlur(imageData: ImageData, radius: number): ImageData {
    // Simple box blur approximation of Gaussian blur
    const result = new ImageData(imageData.width, imageData.height);
    const kernel = Math.ceil(radius * 2);
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;
        
        for (let ky = -kernel; ky <= kernel; ky++) {
          for (let kx = -kernel; kx <= kernel; kx++) {
            const nx = Math.max(0, Math.min(imageData.width - 1, x + kx));
            const ny = Math.max(0, Math.min(imageData.height - 1, y + ky));
            const idx = (ny * imageData.width + nx) * 4;
            
            r += imageData.data[idx];
            g += imageData.data[idx + 1];
            b += imageData.data[idx + 2];
            a += imageData.data[idx + 3];
            count++;
          }
        }
        
        const idx = (y * imageData.width + x) * 4;
        result.data[idx] = r / count;
        result.data[idx + 1] = g / count;
        result.data[idx + 2] = b / count;
        result.data[idx + 3] = a / count;
      }
    }
    
    return result;
  }

  private applyBilateralFilter(
    imageData: ImageData, 
    options: { spatialSigma: number; colorSigma: number; iterations: number }
  ): ImageData {
    let result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    for (let iter = 0; iter < options.iterations; iter++) {
      const temp = new ImageData(imageData.width, imageData.height);
      
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const idx = (y * imageData.width + x) * 4;
          let totalWeight = 0;
          let r = 0, g = 0, b = 0;
          
          const centerR = result.data[idx];
          const centerG = result.data[idx + 1];
          const centerB = result.data[idx + 2];
          
          for (let ky = -2; ky <= 2; ky++) {
            for (let kx = -2; kx <= 2; kx++) {
              const nx = Math.max(0, Math.min(imageData.width - 1, x + kx));
              const ny = Math.max(0, Math.min(imageData.height - 1, y + ky));
              const nIdx = (ny * imageData.width + nx) * 4;
              
              const spatialDist = Math.sqrt(kx * kx + ky * ky);
              const colorDist = Math.sqrt(
                Math.pow(result.data[nIdx] - centerR, 2) +
                Math.pow(result.data[nIdx + 1] - centerG, 2) +
                Math.pow(result.data[nIdx + 2] - centerB, 2)
              );
              
              const weight = Math.exp(
                -(spatialDist * spatialDist) / (2 * options.spatialSigma * options.spatialSigma) -
                (colorDist * colorDist) / (2 * options.colorSigma * options.colorSigma)
              );
              
              r += result.data[nIdx] * weight;
              g += result.data[nIdx + 1] * weight;
              b += result.data[nIdx + 2] * weight;
              totalWeight += weight;
            }
          }
          
          temp.data[idx] = r / totalWeight;
          temp.data[idx + 1] = g / totalWeight;
          temp.data[idx + 2] = b / totalWeight;
          temp.data[idx + 3] = result.data[idx + 3];
        }
      }
      
      result = temp;
    }
    
    return result;
  }

  private detectEdges(imageData: ImageData): ImageData {
    const result = new ImageData(imageData.width, imageData.height);
    
    // Sobel edge detection kernels
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    
    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * imageData.width + (x + kx)) * 4;
            const gray = 0.299 * imageData.data[idx] + 
                        0.587 * imageData.data[idx + 1] + 
                        0.114 * imageData.data[idx + 2];
            
            gx += gray * sobelX[ky + 1][kx + 1];
            gy += gray * sobelY[ky + 1][kx + 1];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const idx = (y * imageData.width + x) * 4;
        
        result.data[idx] = magnitude;
        result.data[idx + 1] = magnitude;
        result.data[idx + 2] = magnitude;
        result.data[idx + 3] = 255;
      }
    }
    
    return result;
  }

  private calculateSharpness(imageData: ImageData): number {
    const edges = this.detectEdges(imageData);
    let totalEdgeStrength = 0;
    
    for (let i = 0; i < edges.data.length; i += 4) {
      totalEdgeStrength += edges.data[i];
    }
    
    const averageEdgeStrength = totalEdgeStrength / (edges.data.length / 4);
    return Math.min(100, (averageEdgeStrength / 128) * 100);
  }

  private calculateColorAccuracy(imageData: ImageData): number {
    // Simple color distribution analysis
    let saturationSum = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i] / 255;
      const g = imageData.data[i + 1] / 255;
      const b = imageData.data[i + 2] / 255;
      
      const hsl = this.rgbToHsl(r, g, b);
      saturationSum += hsl[1];
      pixelCount++;
    }
    
    const averageSaturation = saturationSum / pixelCount;
    return Math.min(100, averageSaturation * 150); // Scale to 0-100
  }

  private calculateContrast(imageData: ImageData): number {
    let min = 255, max = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const gray = 0.299 * imageData.data[i] + 
                  0.587 * imageData.data[i + 1] + 
                  0.114 * imageData.data[i + 2];
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }
    
    const contrastRatio = (max - min) / 255;
    return contrastRatio * 100;
  }

  private calculateBrightness(imageData: ImageData): number {
    let brightnessSum = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      const brightness = 0.299 * imageData.data[i] + 
                        0.587 * imageData.data[i + 1] + 
                        0.114 * imageData.data[i + 2];
      brightnessSum += brightness;
      pixelCount++;
    }
    
    const averageBrightness = brightnessSum / pixelCount;
    // Return score where 128 (middle gray) = 100 points
    return Math.max(0, 100 - Math.abs(averageBrightness - 128));
  }

  private calculateNoiseLevel(imageData: ImageData): number {
    let noiseSum = 0;
    let sampleCount = 0;
    
    // Sample every 4th pixel for performance
    for (let y = 2; y < imageData.height - 2; y += 4) {
      for (let x = 2; x < imageData.width - 2; x += 4) {
        const idx = (y * imageData.width + x) * 4;
        const center = imageData.data[idx];
        
        // Check variance with neighbors
        let variance = 0;
        let neighborCount = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const nIdx = ((y + ky) * imageData.width + (x + kx)) * 4;
            variance += Math.pow(imageData.data[nIdx] - center, 2);
            neighborCount++;
          }
        }
        
        noiseSum += Math.sqrt(variance / neighborCount);
        sampleCount++;
      }
    }
    
    const averageNoise = noiseSum / sampleCount;
    return Math.min(100, (averageNoise / 32) * 100);
  }

  private calculateQualityScore(imageData: ImageData): number {
    const metrics = this.calculateQualityMetrics(imageData);
    return metrics.overallScore;
  }

  private generateCacheKey(imageData: any, options: EnhancementOptions): string {
    const optionsString = JSON.stringify(options);
    const imageKey = typeof imageData === 'string' ? imageData.slice(-20) : 'imagedata';
    return `enhancement_${imageKey}_${btoa(optionsString).slice(-10)}`;
  }
}

// Singleton instance
let outputEnhancer: OutputEnhancer | null = null;

export function getOutputEnhancer(): OutputEnhancer {
  if (!outputEnhancer) {
    outputEnhancer = new OutputEnhancer();
  }
  return outputEnhancer;
}

export default OutputEnhancer;