'use client';

interface PreloadResource {
  url: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossorigin?: 'anonymous' | 'use-credentials';
  type?: string;
  priority?: 'high' | 'low';
}

export class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedResources: Set<string> = new Set();

  // Critical resources to preload immediately
  private criticalResources: PreloadResource[] = [
    {
      url: '/api/products',
      as: 'fetch',
      priority: 'high',
    },
    {
      url: '/_next/static/chunks/vendors.js',
      as: 'script',
      priority: 'high',
    },
    {
      url: '/_next/static/css/app.css',
      as: 'style',
      priority: 'high',
    },
  ];

  // Resources to preload based on user behavior
  private conditionalResources: Record<string, PreloadResource[]> = {
    'catalog-visit': [
      { url: '/api/products?sort=name', as: 'fetch' },
      { url: '/catalog', as: 'fetch' },
    ],
    'admin-access': [
      { url: '/api/admin/statistics', as: 'fetch' },
      { url: '/_next/static/chunks/admin.js', as: 'script' },
    ],
    'mockup-creation': [
      { url: '/api/remove-background', as: 'fetch' },
      { url: '/_next/static/chunks/heavy-libs.js', as: 'script' },
    ],
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializePreloader();
    }
  }

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  private initializePreloader(): void {
    // Preload critical resources immediately
    this.preloadCriticalResources();

    // Setup intelligent preloading based on user interaction
    this.setupIntelligentPreloading();

    // Setup intersection observer for viewport-based preloading
    this.setupViewportPreloading();
  }

  // Preload critical resources immediately
  private preloadCriticalResources(): void {
    this.criticalResources.forEach((resource) => {
      this.preloadResource(resource);
    });
  }

  // Preload a single resource
  private preloadResource(resource: PreloadResource): void {
    if (this.preloadedResources.has(resource.url)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.as;

    if (resource.crossorigin) {
      link.crossOrigin = resource.crossorigin;
    }

    if (resource.type) {
      link.type = resource.type;
    }

    // Add importance hint
    if (resource.priority === 'high') {
      link.setAttribute('importance', 'high');
    }

    // Add to head
    document.head.appendChild(link);
    this.preloadedResources.add(resource.url);

    console.log(`Preloaded resource: ${resource.url}`);
  }

  // Setup intelligent preloading based on user behavior
  private setupIntelligentPreloading(): void {
    // Preload catalog resources when user hovers over catalog link
    const catalogLink = document.querySelector('a[href="/catalog"]');
    if (catalogLink) {
      catalogLink.addEventListener('mouseenter', () => {
        this.preloadConditionalResources('catalog-visit');
      });
    }

    // Preload admin resources when user hovers over admin link
    const adminLink = document.querySelector('a[href*="/admin"]');
    if (adminLink) {
      adminLink.addEventListener('mouseenter', () => {
        this.preloadConditionalResources('admin-access');
      });
    }

    // Preload mockup creation resources when user starts creating
    const createButton = document.querySelector('button[data-action="create"]');
    if (createButton) {
      createButton.addEventListener('click', () => {
        this.preloadConditionalResources('mockup-creation');
      });
    }
  }

  // Preload conditional resources
  public preloadConditionalResources(condition: string): void {
    const resources = this.conditionalResources[condition];
    if (resources) {
      resources.forEach((resource) => {
        this.preloadResource(resource);
      });
    }
  }

  // Setup viewport-based preloading
  private setupViewportPreloading(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const preloadData = entry.target.getAttribute('data-preload');
            if (preloadData) {
              try {
                const resource: PreloadResource = JSON.parse(preloadData);
                this.preloadResource(resource);
              } catch (error) {
                console.error('Invalid preload data:', error);
              }
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe elements with preload data
    document.querySelectorAll('[data-preload]').forEach((el) => {
      observer.observe(el);
    });
  }

  // Preload images based on viewport proximity
  public preloadImages(selector: string = 'img[data-src]'): void {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');
            if (src) {
              // Create preload link for image
              this.preloadResource({
                url: src,
                as: 'image',
              });

              // Load the actual image
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
      }
    );

    document.querySelectorAll(selector).forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Preload fonts
  public preloadFonts(fonts: string[]): void {
    fonts.forEach((fontUrl) => {
      this.preloadResource({
        url: fontUrl,
        as: 'font',
        crossorigin: 'anonymous',
        type: 'font/woff2',
      });
    });
  }

  // Prefetch next page resources
  public prefetchPage(url: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);

    console.log(`Prefetched page: ${url}`);
  }

  // Get preload statistics
  public getStats(): { preloaded: number; resources: string[] } {
    return {
      preloaded: this.preloadedResources.size,
      resources: Array.from(this.preloadedResources),
    };
  }

  // Clear preloaded resources (for memory management)
  public clearPreloadedResources(): void {
    // Remove preload links from DOM
    document.querySelectorAll('link[rel="preload"]').forEach((link) => {
      link.remove();
    });

    this.preloadedResources.clear();
    console.log('Cleared preloaded resources');
  }
}

// React hook for resource preloading
export function useResourcePreloader() {
  const preloader = ResourcePreloader.getInstance();

  return {
    preloadConditionalResources: (condition: string) =>
      preloader.preloadConditionalResources(condition),
    preloadImages: (selector?: string) => preloader.preloadImages(selector),
    preloadFonts: (fonts: string[]) => preloader.preloadFonts(fonts),
    prefetchPage: (url: string) => preloader.prefetchPage(url),
    getStats: () => preloader.getStats(),
    clearPreloadedResources: () => preloader.clearPreloadedResources(),
  };
}

// Initialize preloader
export function initResourcePreloader(): void {
  if (typeof window !== 'undefined') {
    ResourcePreloader.getInstance();
  }
}
