import {
  RemoveBgClient,
  RemoveBgOptions,
  RemoveBgResponse,
  RemoveBgError,
  isRemoveBgError,
} from './remove-bg';
import { removeBgUsageTracker } from './rate-limiter';

export interface QualitySettings {
  size: 'auto' | 'preview' | 'full' | 'regular' | 'medium' | 'hd' | '4k';
  format: 'auto' | 'png' | 'jpg';
  channels: 'rgba' | 'alpha';
  crop: boolean;
  crop_margin?: string;
  add_shadow?: boolean;
  semitransparency?: boolean;
}

export interface EdgeRefinementOptions {
  enabled: boolean;
  smoothing: number; // 0-10
  feathering: number; // 0-5
  threshold: number; // 0-255
}

export interface BackgroundRemovalOptions extends RemoveBgOptions {
  quality?: Partial<QualitySettings>;
  edgeRefinement?: Partial<EdgeRefinementOptions>;
  enableCache?: boolean;
  cacheMaxAge?: number; // seconds
  retryAttempts?: number;
  timeout?: number; // milliseconds
}

export interface ProcessedResult extends RemoveBgResponse {
  processingTime: number;
  fromCache: boolean;
  quality: QualitySettings;
  edgeRefinement?: EdgeRefinementOptions;
  originalSize: number;
  processedSize: number;
  metadata: {
    hasTransparency: boolean;
    colorProfile: string;
    edgeQuality: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

export interface CacheEntry {
  result: RemoveBgResponse;
  timestamp: number;
  maxAge: number;
  hash: string;
  metadata: {
    originalSize: number;
    quality: QualitySettings;
  };
}

class BackgroundRemovalCache {
  private cache = new Map<string, CacheEntry>();
  private maxEntries = 100;

  private generateHash(imageFile: File | Blob | string, options: BackgroundRemovalOptions): string {
    if (typeof imageFile === 'string') {
      return `url_${btoa(imageFile)}_${JSON.stringify(options)}`;
    }

    // For files/blobs, use size + name + lastModified + options as hash
    const fileInfo =
      imageFile instanceof File
        ? `${imageFile.name}_${imageFile.size}_${imageFile.lastModified}`
        : `blob_${imageFile.size}`;

    return btoa(`${fileInfo}_${JSON.stringify(options)}`);
  }

  get(imageFile: File | Blob | string, options: BackgroundRemovalOptions): CacheEntry | null {
    const hash = this.generateHash(imageFile, options);
    const entry = this.cache.get(hash);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.maxAge * 1000) {
      this.cache.delete(hash);
      return null;
    }

    return entry;
  }

  set(
    imageFile: File | Blob | string,
    options: BackgroundRemovalOptions,
    result: RemoveBgResponse
  ): void {
    const hash = this.generateHash(imageFile, options);
    const maxAge = options.cacheMaxAge || 3600; // 1 hour default

    const originalSize = typeof imageFile === 'string' ? 0 : imageFile.size;

    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      maxAge,
      hash,
      metadata: {
        originalSize,
        quality: this.getDefaultQuality(options.quality),
      },
    };

    // LRU eviction - remove oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(hash, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.timestamp) / 1000),
        maxAge: entry.maxAge,
      })),
    };
  }

  private getDefaultQuality(quality?: Partial<QualitySettings>): QualitySettings {
    return {
      size: quality?.size || 'preview',
      format: quality?.format || 'png',
      channels: quality?.channels || 'rgba',
      crop: quality?.crop || false,
      crop_margin: quality?.crop_margin,
      add_shadow: quality?.add_shadow || false,
      semitransparency: quality?.semitransparency || true,
    };
  }
}

export class BackgroundRemovalService {
  private client: RemoveBgClient;
  private cache = new BackgroundRemovalCache();

  constructor(apiKey?: string) {
    this.client = new RemoveBgClient(apiKey);
  }

  async removeBackground(
    imageFile: File | Blob | string,
    options: BackgroundRemovalOptions = {},
    userId?: string
  ): Promise<ProcessedResult> {
    const startTime = Date.now();

    // Check cache first
    if (options.enableCache !== false) {
      const cached = this.cache.get(imageFile, options);
      if (cached) {
        return this.createProcessedResult(
          cached.result,
          startTime,
          true,
          this.getDefaultQuality(options.quality),
          options.edgeRefinement,
          cached.metadata.originalSize
        );
      }
    }

    // Prepare options with quality settings
    const removeBgOptions = this.prepareRemoveBgOptions(options);

    try {
      // Call Remove.bg API
      const result = await this.client.removeBackground(imageFile, removeBgOptions, userId);

      // Process the result
      const processedResult = await this.postProcessResult(result, imageFile, options, startTime);

      // Cache the result
      if (options.enableCache !== false) {
        this.cache.set(imageFile, options, result);
      }

      return processedResult;
    } catch (error) {
      if (isRemoveBgError(error)) {
        throw error;
      }
      throw new Error(
        `Background removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private prepareRemoveBgOptions(options: BackgroundRemovalOptions): RemoveBgOptions {
    const quality = this.getDefaultQuality(options.quality);

    return {
      size: quality.size,
      format: quality.format,
      channels: quality.channels,
      crop: quality.crop,
      crop_margin: quality.crop_margin,
      add_shadow: quality.add_shadow,
      semitransparency: quality.semitransparency,
      ...options, // Allow other Remove.bg options to pass through
    };
  }

  private async postProcessResult(
    result: RemoveBgResponse,
    originalFile: File | Blob | string,
    options: BackgroundRemovalOptions,
    startTime: number
  ): Promise<ProcessedResult> {
    const originalSize = typeof originalFile === 'string' ? 0 : originalFile.size;
    const processedBlob = result.data;
    const processedSize = processedBlob.size;

    // Analyze the result
    const metadata = await this.analyzeResult(processedBlob);

    // Apply edge refinement if enabled
    let finalBlob = processedBlob;
    if (options.edgeRefinement?.enabled) {
      finalBlob = await this.applyEdgeRefinement(processedBlob, options.edgeRefinement);
    }

    return {
      ...result,
      data: finalBlob,
      processingTime: Date.now() - startTime,
      fromCache: false,
      quality: this.getDefaultQuality(options.quality),
      edgeRefinement: options.edgeRefinement,
      originalSize,
      processedSize: finalBlob.size,
      metadata,
    };
  }

  private async analyzeResult(blob: Blob): Promise<ProcessedResult['metadata']> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // Server-side fallback - basic analysis based on blob properties
      return {
        hasTransparency: blob.type === 'image/png', // Assume PNG has transparency
        colorProfile: blob.type || 'image/png',
        edgeQuality: 'good' as const, // Default to good quality
      };
    }

    // Browser-side analysis
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      // Create canvas to analyze pixels
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Analyze transparency and edge quality
      let transparentPixels = 0;
      let edgePixels = 0;
      const totalPixels = canvas.width * canvas.height;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];

        if (alpha === 0) {
          transparentPixels++;
        } else if (alpha < 255) {
          edgePixels++;
        }
      }

      const transparencyRatio = transparentPixels / totalPixels;
      const edgeRatio = edgePixels / totalPixels;

      // Determine edge quality based on edge pixel ratio
      let edgeQuality: 'poor' | 'fair' | 'good' | 'excellent';
      if (edgeRatio < 0.01) edgeQuality = 'poor';
      else if (edgeRatio < 0.03) edgeQuality = 'fair';
      else if (edgeRatio < 0.06) edgeQuality = 'good';
      else edgeQuality = 'excellent';

      return {
        hasTransparency: transparencyRatio > 0.1,
        colorProfile: blob.type || 'image/png',
        edgeQuality,
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private async applyEdgeRefinement(
    blob: Blob,
    refinement: Partial<EdgeRefinementOptions>
  ): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // Server-side fallback - return original blob
      console.log('Edge refinement skipped on server side');
      return blob;
    }

    // Browser-side edge refinement
    const options: EdgeRefinementOptions = {
      enabled: true,
      smoothing: refinement.smoothing || 2,
      feathering: refinement.feathering || 1,
      threshold: refinement.threshold || 128,
    };

    // Create URL for processing
    const url = URL.createObjectURL(blob);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Apply basic edge smoothing (simplified implementation)
      if (options.smoothing > 0) {
        ctx.filter = `blur(${options.smoothing * 0.5}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = 'none';
      }

      // Convert back to blob
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Failed to create processed blob'));
        }, 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private createProcessedResult(
    result: RemoveBgResponse,
    startTime: number,
    fromCache: boolean,
    quality: QualitySettings,
    edgeRefinement?: Partial<EdgeRefinementOptions>,
    originalSize?: number
  ): ProcessedResult {
    return {
      ...result,
      processingTime: Date.now() - startTime,
      fromCache,
      quality,
      edgeRefinement,
      originalSize: originalSize || 0,
      processedSize: result.data.size,
      metadata: {
        hasTransparency: true, // Assume true for cached results
        colorProfile: 'image/png',
        edgeQuality: 'good',
      },
    };
  }

  private getDefaultQuality(quality?: Partial<QualitySettings>): QualitySettings {
    return {
      size: quality?.size || 'preview',
      format: quality?.format || 'png',
      channels: quality?.channels || 'rgba',
      crop: quality?.crop || false,
      crop_margin: quality?.crop_margin,
      add_shadow: quality?.add_shadow || false,
      semitransparency: quality?.semitransparency || true,
    };
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.cache.clear();
  }

  async handleTransparentBackground(
    imageFile: File | Blob,
    backgroundColor?: string
  ): Promise<Blob> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      // Server-side fallback - return original blob
      console.log('Transparent background handling skipped on server side');
      return imageFile;
    }

    const url = URL.createObjectURL(imageFile);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;

      // Fill background if specified
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw the image
      ctx.drawImage(img, 0, 0);

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Failed to create background-filled blob'));
        }, 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Export singleton instance
export const backgroundRemovalService = new BackgroundRemovalService();

// Convenience functions
export async function removeBackground(
  imageFile: File | Blob | string,
  options: BackgroundRemovalOptions = {},
  userId?: string
): Promise<ProcessedResult> {
  return backgroundRemovalService.removeBackground(imageFile, options, userId);
}

export async function removeBackgroundWithQuality(
  imageFile: File | Blob | string,
  quality: Partial<QualitySettings>,
  userId?: string
): Promise<ProcessedResult> {
  return backgroundRemovalService.removeBackground(
    imageFile,
    { quality, enableCache: true },
    userId
  );
}

export async function removeBackgroundWithEdgeRefinement(
  imageFile: File | Blob | string,
  edgeOptions: Partial<EdgeRefinementOptions>,
  userId?: string
): Promise<ProcessedResult> {
  return backgroundRemovalService.removeBackground(
    imageFile,
    {
      edgeRefinement: { enabled: true, ...edgeOptions },
      enableCache: true,
    },
    userId
  );
}
