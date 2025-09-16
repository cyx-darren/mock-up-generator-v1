'use client';

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdate();
            }
          });
        }
      });

      console.log('Service Worker registered successfully');
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (this.registration) {
      try {
        await this.registration.unregister();
        console.log('Service Worker unregistered');
        return true;
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Update service worker
  async update(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        console.log('Service Worker update triggered');
      } catch (error) {
        console.error('Service Worker update failed:', error);
      }
    }
  }

  // Skip waiting and activate new service worker
  async skipWaiting(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Notify user of available update
  private notifyUpdate(): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sw-update-available');
      window.dispatchEvent(event);
    }
  }

  // Get cache usage
  async getCacheUsage(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      } catch (error) {
        console.error('Cache usage estimate failed:', error);
      }
    }
    return null;
  }

  // Clear all caches
  async clearCaches(): Promise<boolean> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Cache clearing failed:', error);
      return false;
    }
  }

  // Preload critical resources
  async preloadCriticalResources(): Promise<void> {
    const criticalResources = ['/catalog', '/api/products', '/_next/static/css/app.css'];

    try {
      const cache = await caches.open('mockupgen-preload-v1.0.0');
      await cache.addAll(criticalResources);
      console.log('Critical resources preloaded');
    } catch (error) {
      console.error('Resource preloading failed:', error);
    }
  }
}

// Hook for using service worker in React components
export function useServiceWorker() {
  const swManager = ServiceWorkerManager.getInstance();

  return {
    register: () => swManager.register(),
    unregister: () => swManager.unregister(),
    update: () => swManager.update(),
    skipWaiting: () => swManager.skipWaiting(),
    getCacheUsage: () => swManager.getCacheUsage(),
    clearCaches: () => swManager.clearCaches(),
    preloadCriticalResources: () => swManager.preloadCriticalResources(),
    isSupported: swManager['isSupported'],
  };
}

// Auto-register service worker on app start
export function initServiceWorker(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const swManager = ServiceWorkerManager.getInstance();

    window.addEventListener('load', () => {
      swManager.register().then(() => {
        swManager.preloadCriticalResources();
      });
    });

    // Handle update notifications
    window.addEventListener('sw-update-available', () => {
      // Show notification to user about available update
      console.log('App update available. Please refresh.');
    });
  }
}
