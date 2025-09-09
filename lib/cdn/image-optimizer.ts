interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  progressive?: boolean;
  lossless?: boolean;
  strip?: boolean; // Remove metadata
}

interface CDNConfig {
  baseUrl: string;
  apiKey?: string;
  defaultQuality: number;
  supportedFormats: string[];
  maxWidth: number;
  maxHeight: number;
}

class ImageOptimizer {
  private static instance: ImageOptimizer;
  private config: CDNConfig;

  constructor(config?: Partial<CDNConfig>) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      apiKey: process.env.CDN_API_KEY,
      defaultQuality: 85,
      supportedFormats: ['webp', 'jpeg', 'png', 'avif'],
      maxWidth: 2048,
      maxHeight: 2048,
      ...config
    };
  }

  static getInstance(config?: Partial<CDNConfig>): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer(config);
    }
    return ImageOptimizer.instance;
  }

  // Generate optimized image URL
  optimizeImage(imageUrl: string, options: ImageOptimizationOptions = {}): string {
    if (!imageUrl) return '';
    
    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      imageUrl = `${this.config.baseUrl}${imageUrl}`;
    }

    // Skip optimization for external URLs not on our CDN
    if (!imageUrl.includes(this.config.baseUrl) && !imageUrl.includes('supabase')) {
      return this.buildExternalImageProxy(imageUrl, options);
    }

    return this.buildOptimizedUrl(imageUrl, options);
  }

  private buildOptimizedUrl(imageUrl: string, options: ImageOptimizationOptions): string {
    const params = new URLSearchParams();

    // Dimensions
    if (options.width) {
      params.set('w', Math.min(options.width, this.config.maxWidth).toString());
    }
    if (options.height) {
      params.set('h', Math.min(options.height, this.config.maxHeight).toString());
    }

    // Quality
    const quality = options.quality || this.config.defaultQuality;
    if (quality !== 100) {
      params.set('q', quality.toString());
    }

    // Format
    if (options.format && options.format !== 'auto') {
      params.set('f', options.format);
    } else {
      // Auto-detect best format
      params.set('f', 'auto');
    }

    // Fit/resize mode
    if (options.fit) {
      params.set('fit', options.fit);
    }

    // Effects
    if (options.blur && options.blur > 0) {
      params.set('blur', options.blur.toString());
    }
    if (options.sharpen) {
      params.set('sharpen', '1');
    }
    if (options.grayscale) {
      params.set('grayscale', '1');
    }

    // Optimization flags
    if (options.progressive !== false) {
      params.set('progressive', '1');
    }
    if (options.strip !== false) {
      params.set('strip', '1');
    }
    if (options.lossless) {
      params.set('lossless', '1');
    }

    // Build the optimized URL
    if (imageUrl.includes('supabase')) {
      // Use Supabase image transformation
      return this.buildSupabaseImageUrl(imageUrl, params);
    }

    // Use Next.js Image Optimization API
    return this.buildNextImageUrl(imageUrl, params);
  }

  private buildSupabaseImageUrl(imageUrl: string, params: URLSearchParams): string {
    // Extract the file path from Supabase URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'storage');
    
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 3) {
      const bucket = pathParts[bucketIndex + 2];
      const filePath = pathParts.slice(bucketIndex + 3).join('/');
      
      // Build transformation URL
      const transformParams = new URLSearchParams();
      
      // Map our params to Supabase transform params
      if (params.has('w')) transformParams.set('width', params.get('w')!);
      if (params.has('h')) transformParams.set('height', params.get('h')!);
      if (params.has('q')) transformParams.set('quality', params.get('q')!);
      if (params.has('f') && params.get('f') !== 'auto') {
        transformParams.set('format', params.get('f')!);
      }
      if (params.has('fit')) transformParams.set('resize', params.get('fit')!);

      return `${url.origin}/storage/v1/render/image/${bucket}/${filePath}?${transformParams.toString()}`;
    }

    return imageUrl;
  }

  private buildNextImageUrl(imageUrl: string, params: URLSearchParams): string {
    // Use Next.js Image Optimization API
    const nextParams = new URLSearchParams();
    nextParams.set('url', encodeURIComponent(imageUrl));
    
    // Map our params to Next.js params
    if (params.has('w')) nextParams.set('w', params.get('w')!);
    if (params.has('q')) nextParams.set('q', params.get('q')!);

    return `/api/image-proxy?${nextParams.toString()}`;
  }

  private buildExternalImageProxy(imageUrl: string, options: ImageOptimizationOptions): string {
    // Use our image proxy for external images
    const params = new URLSearchParams();
    params.set('url', encodeURIComponent(imageUrl));
    
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format && options.format !== 'auto') params.set('f', options.format);

    return `/api/image-proxy?${params.toString()}`;
  }

  // Generate responsive image set
  generateResponsiveSet(
    imageUrl: string,
    options: ImageOptimizationOptions = {}
  ): { src: string; srcSet: string; sizes: string } {
    const breakpoints = [320, 640, 768, 1024, 1280, 1920];
    const baseWidth = options.width || 1200;
    
    const srcSet = breakpoints
      .filter(bp => bp <= baseWidth)
      .map(width => {
        const optimizedUrl = this.optimizeImage(imageUrl, {
          ...options,
          width,
          height: options.height ? Math.round((options.height * width) / baseWidth) : undefined
        });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');

    const src = this.optimizeImage(imageUrl, options);
    
    const sizes = [
      '(max-width: 320px) 320px',
      '(max-width: 640px) 640px',
      '(max-width: 768px) 768px',
      '(max-width: 1024px) 1024px',
      '(max-width: 1280px) 1280px',
      '1920px'
    ].join(', ');

    return { src, srcSet, sizes };
  }

  // Preload critical images
  generatePreloadTags(images: { url: string; options?: ImageOptimizationOptions }[]): string {
    return images
      .map(({ url, options = {} }) => {
        const optimizedUrl = this.optimizeImage(url, {
          quality: 85,
          format: 'webp',
          ...options
        });
        
        return `<link rel="preload" as="image" href="${optimizedUrl}" />`;
      })
      .join('\n');
  }

  // Get image metadata
  async getImageMetadata(imageUrl: string): Promise<{
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  } | null> {
    try {
      // Use our image info API
      const response = await fetch(`/api/image-info?url=${encodeURIComponent(imageUrl)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to get image metadata:', error);
    }
    return null;
  }

  // Check if format is supported by browser
  static supportsFormat(format: string, userAgent?: string): boolean {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    
    switch (format) {
      case 'webp':
        return /Chrome|Firefox|Edge|Opera/.test(ua) || /Safari/.test(ua);
      case 'avif':
        return /Chrome\/8[5-9]|Chrome\/9\d|Firefox\/8[6-9]|Firefox\/9\d/.test(ua);
      case 'jpeg':
      case 'png':
        return true;
      default:
        return false;
    }
  }

  // Get optimal format for browser
  getOptimalFormat(userAgent?: string): 'avif' | 'webp' | 'jpeg' {
    if (ImageOptimizer.supportsFormat('avif', userAgent)) {
      return 'avif';
    }
    if (ImageOptimizer.supportsFormat('webp', userAgent)) {
      return 'webp';
    }
    return 'jpeg';
  }
}

// Utility functions
export function optimizeImage(url: string, options?: ImageOptimizationOptions): string {
  const optimizer = ImageOptimizer.getInstance();
  return optimizer.optimizeImage(url, options);
}

export function generateResponsiveImage(url: string, options?: ImageOptimizationOptions) {
  const optimizer = ImageOptimizer.getInstance();
  return optimizer.generateResponsiveSet(url, options);
}

export function preloadCriticalImages(images: { url: string; options?: ImageOptimizationOptions }[]) {
  const optimizer = ImageOptimizer.getInstance();
  return optimizer.generatePreloadTags(images);
}

// Export the class and instance
export { ImageOptimizer };
export const imageOptimizer = ImageOptimizer.getInstance();