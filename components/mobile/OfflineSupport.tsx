'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Offline context
interface OfflineContextType {
  isOnline: boolean;
  isOffline: boolean;
  showOfflineIndicator: boolean;
  cacheSize: number;
  clearCache: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

// Offline provider
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineIndicator(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate cache size
  useEffect(() => {
    const calculateCacheSize = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          let totalSize = 0;

          for (const name of cacheNames) {
            const cache = await caches.open(name);
            const requests = await cache.keys();

            for (const request of requests) {
              const response = await cache.match(request);
              if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
              }
            }
          }

          setCacheSize(totalSize);
        } catch (error) {
          console.error('Failed to calculate cache size:', error);
        }
      }
    };

    calculateCacheSize();
  }, [isOnline]);

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        setCacheSize(0);
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isOffline: !isOnline,
        showOfflineIndicator,
        cacheSize,
        clearCache,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

// Offline indicator component
export function OfflineIndicator({ className = '' }: { className?: string }) {
  const { showOfflineIndicator, isOnline } = useOffline();

  if (!showOfflineIndicator) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 text-sm font-medium z-50 ${className}`}
    >
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.18l.1.85c0 .4.3.72.7.72s.7-.32.7-.72l.1-.85m0 17.64l.1-.85c0-.4.3-.72.7-.72s.7.32.7.72l.1.85m7.64-7.64l-.85.1c-.4 0-.72.3-.72.7s.32.7.72.7l.85.1m-17.64 0l.85.1c.4 0 .72.3.72.7s-.32.7-.72.7l-.85.1"
          />
        </svg>
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  );
}

// Service Worker registration hook
export function useServiceWorker() {
  const [swStatus, setSWStatus] = useState<'idle' | 'installing' | 'installed' | 'error'>('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          setSWStatus('installing');
          const registration = await navigator.serviceWorker.register('/sw.js');

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          setSWStatus('installed');
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          setSWStatus('error');
        }
      };

      registerSW();
    }
  }, []);

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  return { swStatus, updateAvailable, updateApp };
}

// Update available notification
export function UpdateNotification() {
  const { updateAvailable, updateApp } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm opacity-90">A new version is ready to install.</p>
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={updateApp}
            className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-sm font-medium"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// Offline storage manager
export class OfflineStorage {
  private dbName = 'MockupGenOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('mockups')) {
          db.createObjectStore('mockups', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
      };
    });
  }

  async storeProducts(products: any[]): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    await Promise.all(products.map((product) => store.put(product)));
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeMockup(mockup: any): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['mockups'], 'readwrite');
    const store = transaction.objectStore('mockups');
    await store.put({ ...mockup, timestamp: Date.now() });
  }

  async getMockups(): Promise<any[]> {
    if (!this.db) return [];

    const transaction = this.db.transaction(['mockups'], 'readonly');
    const store = transaction.objectStore('mockups');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storeImage(url: string, blob: Blob): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    await store.put({ url, blob, timestamp: Date.now() });
  }

  async getImage(url: string): Promise<Blob | null> {
    if (!this.db) return null;

    const transaction = this.db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.get(url);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoff = Date.now() - maxAge;
    const stores = ['mockups', 'images'];

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = cursor.value;
          if (data.timestamp < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  }
}

// Hook for offline storage
export function useOfflineStorage() {
  const [storage, setStorage] = useState<OfflineStorage | null>(null);

  useEffect(() => {
    const initStorage = async () => {
      const offlineStorage = new OfflineStorage();
      await offlineStorage.init();
      setStorage(offlineStorage);
    };

    initStorage();
  }, []);

  return storage;
}

// Offline-aware data fetcher
export function useOfflineData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: {
    staleTime?: number;
    cacheTime?: number;
  } = {}
) {
  const { staleTime = 5 * 60 * 1000, cacheTime = 24 * 60 * 60 * 1000 } = options;
  const { isOnline } = useOffline();
  const storage = useOfflineStorage();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!storage) return;

      setLoading(true);
      setError(null);

      try {
        if (isOnline) {
          // Try to fetch fresh data
          const freshData = await fetchFn();
          setData(freshData);

          // Cache the data
          await storage.storeMockup({
            id: cacheKey,
            data: freshData,
            timestamp: Date.now(),
          });
        } else {
          // Load from offline storage
          const mockups = await storage.getMockups();
          const cached = mockups.find((m) => m.id === cacheKey);

          if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < cacheTime) {
              setData(cached.data);
            } else {
              throw new Error('Cached data expired');
            }
          } else {
            throw new Error('No offline data available');
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOnline, storage, cacheKey, fetchFn, cacheTime]);

  return { data, loading, error, refetch: () => loadData() };
}

// Connection quality indicator
export function ConnectionQuality() {
  const [quality, setQuality] = useState<'4g' | '3g' | '2g' | 'slow-2g' | 'unknown'>('unknown');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateQuality = () => {
        setQuality(connection.effectiveType || 'unknown');
      };

      updateQuality();
      connection.addEventListener('change', updateQuality);

      return () => connection.removeEventListener('change', updateQuality);
    }
  }, []);

  const getQualityColor = () => {
    switch (quality) {
      case '4g':
        return 'text-green-600';
      case '3g':
        return 'text-yellow-600';
      case '2g':
      case 'slow-2g':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-1 text-xs ${getQualityColor()}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.24 0 1 1 0 01-1.415-1.415 5 5 0 017.07 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>{quality.toUpperCase()}</span>
    </div>
  );
}
