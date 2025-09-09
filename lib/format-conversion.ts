/**
 * Format Conversion System
 * Multi-format image export with quality control and compression optimization
 */

export interface FormatOptions {
  format: 'png' | 'jpg' | 'webp';
  quality: number; // 1-100
  compression?: {
    enabled: boolean;
    level: number; // 1-9 for PNG, 1-100 for others
    optimization: 'size' | 'quality' | 'balanced';
  };
  metadata?: {
    preserveOriginal: boolean;
    addWatermark: boolean;
    customData?: Record<string, any>;
  };
  dimensions?: {
    width?: number;
    height?: number;
    maintainAspectRatio: boolean;
    resizeMode: 'stretch' | 'crop' | 'contain' | 'cover';
  };
  colorSpace?: 'sRGB' | 'AdobeRGB' | 'P3' | 'auto';
  dpi?: number; // 72, 150, 300
}

export interface ConversionResult {
  originalFormat: string;
  targetFormat: string;
  originalSize: {
    bytes: number;
    width: number;
    height: number;
  };
  convertedSize: {
    bytes: number;
    width: number;
    height: number;
  };
  compressionRatio: number;
  quality: number;
  base64Data: string;
  blob?: Blob;
  conversionTime: number;
  metadata: {
    colorSpace: string;
    dpi: number;
    bitDepth: number;
    hasAlpha: boolean;
    profileSize?: number;
  };
}

export interface FormatCapabilities {
  format: string;
  supportsAlpha: boolean;
  supportsAnimation: boolean;
  supportsLossless: boolean;
  maxDimensions: { width: number; height: number };
  commonUses: string[];
  compressionTypes: string[];
  qualityRange: { min: number; max: number };
}

export class FormatConverter {
  private supportedFormats: Set<string> = new Set(['png', 'jpg', 'jpeg', 'webp']);
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

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
   * Convert image to specified format
   */
  async convertFormat(
    imageData: string | ImageData | HTMLImageElement,
    options: FormatOptions
  ): Promise<ConversionResult> {
    const startTime = performance.now();

    // Load and analyze source image
    const sourceImage = await this.loadImage(imageData);
    const originalFormat = this.detectImageFormat(imageData);
    const originalImageData = this.getImageData(sourceImage);

    // Apply dimensions if specified
    let processedImageData = originalImageData;
    if (options.dimensions) {
      processedImageData = this.resizeImageData(originalImageData, options.dimensions);
    }

    // Convert to target format
    const conversionResult = await this.performConversion(
      processedImageData,
      originalFormat,
      options
    );

    // Calculate compression ratio
    const originalBytes = this.estimateImageSize(originalImageData, originalFormat);
    const compressionRatio =
      originalBytes > 0 ? conversionResult.convertedSize.bytes / originalBytes : 1;

    const result: ConversionResult = {
      originalFormat,
      targetFormat: options.format,
      originalSize: {
        bytes: originalBytes,
        width: originalImageData.width,
        height: originalImageData.height,
      },
      convertedSize: {
        bytes: conversionResult.convertedSize.bytes,
        width: processedImageData.width,
        height: processedImageData.height,
      },
      compressionRatio,
      quality: options.quality,
      base64Data: conversionResult.base64Data,
      blob: conversionResult.blob,
      conversionTime: performance.now() - startTime,
      metadata: {
        colorSpace: options.colorSpace || 'sRGB',
        dpi: options.dpi || 72,
        bitDepth: this.calculateBitDepth(processedImageData),
        hasAlpha: this.hasAlphaChannel(processedImageData),
        profileSize: 0, // Could be expanded for ICC profiles
      },
    };

    return result;
  }

  /**
   * Batch convert multiple images
   */
  async batchConvert(
    images: Array<{ data: string | ImageData | HTMLImageElement; filename: string }>,
    options: FormatOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<ConversionResult & { filename: string }>> {
    const results: Array<ConversionResult & { filename: string }> = [];

    for (let i = 0; i < images.length; i++) {
      const { data, filename } = images[i];

      try {
        const result = await this.convertFormat(data, options);
        results.push({ ...result, filename });

        if (onProgress) {
          onProgress(i + 1, images.length);
        }
      } catch (error) {
        console.error(`Failed to convert ${filename}:`, error);
        // Continue with other images even if one fails
      }
    }

    return results;
  }

  /**
   * Get optimal format recommendation
   */
  getOptimalFormat(
    imageData: ImageData,
    use: 'web' | 'print' | 'storage' | 'email'
  ): { format: 'png' | 'jpg' | 'webp'; reason: string; quality: number } {
    const hasAlpha = this.hasAlphaChannel(imageData);
    const isPhotographic = this.isPhotographicContent(imageData);
    const complexity = this.calculateImageComplexity(imageData);

    switch (use) {
      case 'web':
        if (hasAlpha) {
          return {
            format: 'webp',
            reason: 'WebP supports transparency with better compression',
            quality: 85,
          };
        } else if (isPhotographic) {
          return {
            format: 'webp',
            reason: 'WebP provides best compression for photos',
            quality: 80,
          };
        } else {
          return { format: 'png', reason: 'PNG best for graphics with few colors', quality: 95 };
        }

      case 'print':
        return { format: 'png', reason: 'PNG maintains quality for printing', quality: 100 };

      case 'storage':
        if (complexity < 0.3) {
          return { format: 'png', reason: 'PNG efficient for simple images', quality: 95 };
        } else {
          return { format: 'jpg', reason: 'JPG smaller for complex images', quality: 85 };
        }

      case 'email':
        if (hasAlpha) {
          return { format: 'png', reason: 'PNG needed for transparency', quality: 80 };
        } else {
          return { format: 'jpg', reason: 'JPG smaller for email attachments', quality: 75 };
        }

      default:
        return { format: 'png', reason: 'PNG as safe default', quality: 90 };
    }
  }

  /**
   * Get format capabilities
   */
  getFormatCapabilities(): { [key: string]: FormatCapabilities } {
    return {
      png: {
        format: 'PNG',
        supportsAlpha: true,
        supportsAnimation: false,
        supportsLossless: true,
        maxDimensions: { width: 65535, height: 65535 },
        commonUses: ['Screenshots', 'Graphics', 'Logos', 'Images with transparency'],
        compressionTypes: ['Lossless', 'Palette reduction'],
        qualityRange: { min: 1, max: 9 },
      },
      jpg: {
        format: 'JPEG',
        supportsAlpha: false,
        supportsAnimation: false,
        supportsLossless: false,
        maxDimensions: { width: 65535, height: 65535 },
        commonUses: ['Photographs', 'Web images', 'Email attachments'],
        compressionTypes: ['Lossy DCT'],
        qualityRange: { min: 1, max: 100 },
      },
      webp: {
        format: 'WebP',
        supportsAlpha: true,
        supportsAnimation: true,
        supportsLossless: true,
        maxDimensions: { width: 16383, height: 16383 },
        commonUses: ['Modern web', 'Mobile apps', 'Progressive loading'],
        compressionTypes: ['Lossy VP8', 'Lossless VP8L'],
        qualityRange: { min: 1, max: 100 },
      },
    };
  }

  /**
   * Estimate file size before conversion
   */
  estimateConvertedSize(
    imageData: ImageData,
    format: 'png' | 'jpg' | 'webp',
    quality: number
  ): number {
    const pixels = imageData.width * imageData.height;

    switch (format) {
      case 'png':
        // PNG size varies greatly, rough estimate based on complexity
        const complexity = this.calculateImageComplexity(imageData);
        return Math.floor(pixels * (0.5 + complexity * 2));

      case 'jpg':
        // JPEG size roughly inversely proportional to quality setting
        const jpegFactor = ((100 - quality) / 100) * 0.8 + 0.1;
        return Math.floor(pixels * jpegFactor);

      case 'webp':
        // WebP is typically 25-35% smaller than JPEG
        const webpFactor = (((100 - quality) / 100) * 0.6 + 0.07) * 0.7;
        return Math.floor(pixels * webpFactor);

      default:
        return pixels * 3; // RGB fallback
    }
  }

  /**
   * Validate format compatibility
   */
  validateFormatSupport(format: string): boolean {
    if (!this.supportedFormats.has(format.toLowerCase())) {
      return false;
    }

    // Check browser support for WebP
    if (format.toLowerCase() === 'webp') {
      return this.checkWebPSupport();
    }

    return true;
  }

  /**
   * Private helper methods
   */
  private async performConversion(
    imageData: ImageData,
    originalFormat: string,
    options: FormatOptions
  ): Promise<{ base64Data: string; blob: Blob; convertedSize: { bytes: number } }> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    // Set up canvas
    this.canvas.width = imageData.width;
    this.canvas.height = imageData.height;

    // Apply color space if needed
    if (options.colorSpace && options.colorSpace !== 'sRGB') {
      // For now, log that other color spaces would be implemented
      console.log(
        `Color space ${options.colorSpace} requested - would implement ICC profile conversion`
      );
    }

    // Put image data on canvas
    this.ctx.putImageData(imageData, 0, 0);

    // Convert based on format
    let mimeType: string;
    let qualityValue: number;

    switch (options.format) {
      case 'png':
        mimeType = 'image/png';
        qualityValue = 1; // PNG doesn't use quality, but canvas expects it
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        qualityValue = options.quality / 100;
        break;
      case 'webp':
        mimeType = 'image/webp';
        qualityValue = options.quality / 100;
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    // Apply compression optimization
    if (options.compression?.enabled) {
      qualityValue = this.applyCompressionOptimization(
        qualityValue,
        options.compression,
        imageData
      );
    }

    // Convert to blob and base64
    const base64Data = this.canvas.toDataURL(mimeType, qualityValue);
    const blob = await this.dataURLToBlob(base64Data);

    return {
      base64Data,
      blob,
      convertedSize: { bytes: blob.size },
    };
  }

  private async loadImage(
    source: string | ImageData | HTMLImageElement
  ): Promise<HTMLImageElement> {
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
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = canvas.toDataURL();
      });
    }

    // Assume string is base64 or URL
    const img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = source;
    });
  }

  private getImageData(img: HTMLImageElement): ImageData {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not initialized');
    }

    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.clearRect(0, 0, img.width, img.height);
    this.ctx.drawImage(img, 0, 0);
    return this.ctx.getImageData(0, 0, img.width, img.height);
  }

  private detectImageFormat(imageData: string | ImageData | HTMLImageElement): string {
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image/')) {
        const format = imageData.split(';')[0].split('/')[1];
        return format;
      }

      // Try to detect from URL extension
      const extension = imageData.split('.').pop()?.toLowerCase();
      if (extension && this.supportedFormats.has(extension)) {
        return extension;
      }
    }

    return 'unknown';
  }

  private resizeImageData(
    imageData: ImageData,
    dimensions: FormatOptions['dimensions']
  ): ImageData {
    if (!dimensions || (!dimensions.width && !dimensions.height)) {
      return imageData;
    }

    const {
      width: targetWidth,
      height: targetHeight,
      maintainAspectRatio,
      resizeMode,
    } = dimensions;

    let newWidth = targetWidth || imageData.width;
    let newHeight = targetHeight || imageData.height;

    if (maintainAspectRatio) {
      const aspectRatio = imageData.width / imageData.height;

      if (targetWidth && !targetHeight) {
        newHeight = targetWidth / aspectRatio;
      } else if (targetHeight && !targetWidth) {
        newWidth = targetHeight * aspectRatio;
      } else if (targetWidth && targetHeight) {
        switch (resizeMode) {
          case 'contain':
            if (targetWidth / targetHeight > aspectRatio) {
              newWidth = targetHeight * aspectRatio;
              newHeight = targetHeight;
            } else {
              newWidth = targetWidth;
              newHeight = targetWidth / aspectRatio;
            }
            break;
          case 'cover':
            if (targetWidth / targetHeight > aspectRatio) {
              newWidth = targetWidth;
              newHeight = targetWidth / aspectRatio;
            } else {
              newWidth = targetHeight * aspectRatio;
              newHeight = targetHeight;
            }
            break;
          case 'stretch':
          default:
            newWidth = targetWidth;
            newHeight = targetHeight;
            break;
        }
      }
    }

    // Create temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);

    // Resize
    const resizedCanvas = document.createElement('canvas');
    const resizedCtx = resizedCanvas.getContext('2d')!;
    resizedCanvas.width = Math.round(newWidth);
    resizedCanvas.height = Math.round(newHeight);

    // Enable image smoothing for better quality
    resizedCtx.imageSmoothingEnabled = true;
    resizedCtx.imageSmoothingQuality = 'high';

    resizedCtx.drawImage(
      tempCanvas,
      0,
      0,
      imageData.width,
      imageData.height,
      0,
      0,
      Math.round(newWidth),
      Math.round(newHeight)
    );

    return resizedCtx.getImageData(0, 0, Math.round(newWidth), Math.round(newHeight));
  }

  private estimateImageSize(imageData: ImageData, format: string): number {
    const pixels = imageData.width * imageData.height;

    switch (format.toLowerCase()) {
      case 'png':
        return pixels * 3; // Rough estimate for PNG
      case 'jpg':
      case 'jpeg':
        return pixels * 0.5; // Rough estimate for JPEG
      case 'webp':
        return pixels * 0.35; // Rough estimate for WebP
      default:
        return pixels * 4; // RGBA fallback
    }
  }

  private calculateBitDepth(imageData: ImageData): number {
    // For web canvas, always 8 bits per channel
    return 8;
  }

  private hasAlphaChannel(imageData: ImageData): boolean {
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 255) {
        return true;
      }
    }
    return false;
  }

  private isPhotographicContent(imageData: ImageData): boolean {
    // Analyze image for photographic characteristics
    let totalVariation = 0;
    const sampleSize = Math.min(1000, imageData.data.length / 4);

    for (let i = 0; i < sampleSize * 4; i += 16) {
      // Sample every 4th pixel
      if (i + 7 < imageData.data.length) {
        const r1 = imageData.data[i],
          g1 = imageData.data[i + 1],
          b1 = imageData.data[i + 2];
        const r2 = imageData.data[i + 4],
          g2 = imageData.data[i + 5],
          b2 = imageData.data[i + 6];

        totalVariation += Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      }
    }

    const averageVariation = totalVariation / (sampleSize * 3);
    return averageVariation > 20; // Threshold for photographic content
  }

  private calculateImageComplexity(imageData: ImageData): number {
    // Calculate image complexity based on color variance
    let totalVariance = 0;
    const pixels = imageData.width * imageData.height;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Calculate variance from average
      const avg = (r + g + b) / 3;
      totalVariance += Math.pow(r - avg, 2) + Math.pow(g - avg, 2) + Math.pow(b - avg, 2);
    }

    return Math.min(1, totalVariance / (pixels * 255 * 255));
  }

  private applyCompressionOptimization(
    quality: number,
    compression: FormatOptions['compression'],
    imageData: ImageData
  ): number {
    if (!compression) return quality;

    const complexity = this.calculateImageComplexity(imageData);

    switch (compression.optimization) {
      case 'size':
        // Prioritize smaller file size
        return Math.max(0.1, quality * 0.8);

      case 'quality':
        // Prioritize visual quality
        return Math.min(1, quality * 1.1);

      case 'balanced':
      default:
        // Balance based on image complexity
        if (complexity > 0.7) {
          return quality * 0.9; // Slightly lower quality for complex images
        } else {
          return Math.min(1, quality * 1.05); // Slightly higher quality for simple images
        }
    }
  }

  private async dataURLToBlob(dataURL: string): Promise<Blob> {
    return new Promise((resolve) => {
      const parts = dataURL.split(',');
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const byteString = atob(parts[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const view = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        view[i] = byteString.charCodeAt(i);
      }

      resolve(new Blob([arrayBuffer], { type: mime }));
    });
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}

// Utility functions
export function downloadConvertedImage(result: ConversionResult, filename: string): void {
  if (!result.blob) {
    // Create blob from base64
    const byteString = atob(result.base64Data.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const view = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      view[i] = byteString.charCodeAt(i);
    }

    const mimeType = result.base64Data.split(',')[0].split(':')[1].split(';')[0];
    result.blob = new Blob([arrayBuffer], { type: mimeType });
  }

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${result.targetFormat}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getFileSizeString(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Singleton instance
let formatConverter: FormatConverter | null = null;

export function getFormatConverter(): FormatConverter {
  if (!formatConverter) {
    formatConverter = new FormatConverter();
  }
  return formatConverter;
}

export default FormatConverter;
