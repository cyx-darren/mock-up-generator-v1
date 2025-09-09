import { NextRequest, NextResponse } from 'next/server';

interface CacheConfig {
  ttl?: number; // Time to live in seconds
  maxAge?: number; // Browser cache max-age
  sMaxAge?: number; // CDN cache max-age
  staleWhileRevalidate?: number; // Stale-while-revalidate seconds
  mustRevalidate?: boolean;
  noCache?: boolean;
  private?: boolean;
  vary?: string[]; // Vary headers
  tags?: string[]; // Cache tags for invalidation
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  tags: string[];
  etag: string;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private static instance: ResponseCache;
  
  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  private generateCacheKey(request: NextRequest, additionalKeys: string[] = []): string {
    const url = new URL(request.url);
    const searchParams = Array.from(url.searchParams.entries()).sort();
    const keyParts = [
      url.pathname,
      ...searchParams.map(([k, v]) => `${k}=${v}`),
      ...additionalKeys
    ];
    return keyParts.join('|');
  }

  private generateETag(data: any): string {
    // Simple ETag generation based on content hash
    const content = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  private buildCacheHeaders(config: CacheConfig, etag?: string): HeadersInit {
    const headers: HeadersInit = {};

    if (config.noCache) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
      return headers;
    }

    const cacheControl = [];
    
    if (config.private) {
      cacheControl.push('private');
    } else {
      cacheControl.push('public');
    }

    if (config.maxAge !== undefined) {
      cacheControl.push(`max-age=${config.maxAge}`);
    }

    if (config.sMaxAge !== undefined) {
      cacheControl.push(`s-maxage=${config.sMaxAge}`);
    }

    if (config.staleWhileRevalidate !== undefined) {
      cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
    }

    if (config.mustRevalidate) {
      cacheControl.push('must-revalidate');
    }

    if (cacheControl.length > 0) {
      headers['Cache-Control'] = cacheControl.join(', ');
    }

    if (config.vary && config.vary.length > 0) {
      headers['Vary'] = config.vary.join(', ');
    }

    if (etag) {
      headers['ETag'] = etag;
    }

    // Add custom cache headers for debugging
    headers['X-Cache-Config'] = JSON.stringify({
      ttl: config.ttl,
      tags: config.tags
    });

    return headers;
  }

  async get(
    request: NextRequest,
    config: CacheConfig = {},
    additionalKeys: string[] = []
  ): Promise<{ data: any; headers: HeadersInit; hit: boolean } | null> {
    if (config.noCache) return null;

    const cacheKey = this.generateCacheKey(request, additionalKeys);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if entry is expired
    if (age > entry.ttl * 1000) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check conditional requests (ETag)
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === entry.etag) {
      return {
        data: null,
        headers: {
          ...this.buildCacheHeaders(config, entry.etag),
          'X-Cache-Status': 'hit-304'
        },
        hit: true
      };
    }

    return {
      data: entry.data,
      headers: {
        ...this.buildCacheHeaders(config, entry.etag),
        'X-Cache-Status': 'hit',
        'Age': Math.floor(age / 1000).toString()
      },
      hit: true
    };
  }

  async set(
    request: NextRequest,
    data: any,
    config: CacheConfig = {},
    additionalKeys: string[] = []
  ): Promise<{ headers: HeadersInit; etag: string }> {
    const cacheKey = this.generateCacheKey(request, additionalKeys);
    const etag = this.generateETag(data);
    const ttl = config.ttl || 300; // Default 5 minutes
    
    if (!config.noCache && ttl > 0) {
      const entry: CacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        tags: config.tags || [],
        etag
      };
      
      this.cache.set(cacheKey, entry);
    }

    const headers = {
      ...this.buildCacheHeaders(config, etag),
      'X-Cache-Status': 'miss'
    };

    return { headers, etag };
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`Cache: Invalidated ${count} entries with tag "${tag}"`);
    return count;
  }

  invalidateByPattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`Cache: Invalidated ${count} entries matching pattern "${pattern}"`);
    return count;
  }

  clear(): void {
    this.cache.clear();
    console.log('Cache: Cleared all entries');
  }

  getStats(): {
    size: number;
    entries: string[];
    memoryUsage: number;
    hitRate?: number;
  } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
      memoryUsage: totalSize
    };
  }

  // Cleanup expired entries
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl * 1000) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`Cache: Cleaned up ${count} expired entries`);
    }
    
    return count;
  }
}

// Cache middleware wrapper
export function withCache(config: CacheConfig = {}) {
  return function cacheMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(request: NextRequest): Promise<NextResponse> {
      const cache = ResponseCache.getInstance();
      
      // Try to get from cache
      const cached = await cache.get(request, config);
      
      if (cached) {
        if (cached.data === null) {
          // Return 304 Not Modified
          return new NextResponse(null, {
            status: 304,
            headers: cached.headers
          });
        }
        
        // Return cached response
        return NextResponse.json(cached.data, {
          headers: cached.headers
        });
      }

      // Execute handler
      const response = await handler(request);
      
      // Cache the response if it's successful
      if (response.ok && !config.noCache) {
        const data = await response.clone().json().catch(() => null);
        if (data) {
          const { headers } = await cache.set(request, data, config);
          
          // Add cache headers to response
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value as string);
          });
        }
      }

      return response;
    };
  };
}

// Cache configurations for different endpoints
export const CacheConfigs = {
  // Products cache - 5 minutes with CDN cache
  products: {
    ttl: 300, // 5 minutes
    maxAge: 300,
    sMaxAge: 600, // CDN cache for 10 minutes
    staleWhileRevalidate: 1800, // 30 minutes stale
    tags: ['products', 'catalog'],
    vary: ['Accept-Encoding']
  } as CacheConfig,

  // Product metadata - 10 minutes
  productMetadata: {
    ttl: 600, // 10 minutes
    maxAge: 600,
    sMaxAge: 1200,
    tags: ['products', 'metadata'],
    vary: ['Accept-Encoding']
  } as CacheConfig,

  // Statistics - 2 minutes, private
  statistics: {
    ttl: 120, // 2 minutes
    maxAge: 120,
    private: true,
    tags: ['statistics'],
    mustRevalidate: true
  } as CacheConfig,

  // Individual product - 15 minutes
  product: {
    ttl: 900, // 15 minutes
    maxAge: 900,
    sMaxAge: 1800,
    staleWhileRevalidate: 3600,
    tags: ['products'],
    vary: ['Accept-Encoding']
  } as CacheConfig,

  // No cache for mutations
  noCache: {
    noCache: true
  } as CacheConfig
};

// Export singleton instance
export const responseCache = ResponseCache.getInstance();

// Auto-cleanup interval
if (typeof window === 'undefined') {
  setInterval(() => {
    responseCache.cleanup();
  }, 60000); // Cleanup every minute
}