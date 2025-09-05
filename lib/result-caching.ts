/**
 * Result Caching System
 * High-performance caching for mockup generation results with intelligent invalidation
 */

export interface CacheKey {
  productId: string;
  logoHash: string;
  placementType: string;
  qualityLevel: string;
  stylePreferences: Record<string, any>;
  constraintVersion: string;
  apiVersion: string;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  metadata: {
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    expiresAt: Date;
    size: number; // bytes
    contentType: string;
    tags: string[];
    priority: CachePriority;
    source: CacheSource;
  };
  checksum: string;
}

export type CachePriority = 'low' | 'normal' | 'high' | 'critical';
export type CacheSource = 'api' | 'computation' | 'user_upload' | 'processed';

export interface CacheMetrics {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
  averageAccessTime: number;
  topKeys: Array<{ key: string; accessCount: number }>;
  sizeByPriority: Record<CachePriority, number>;
  lastCleanup: Date;
}

export interface CacheConfig {
  maxSize: number; // bytes
  maxEntries: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  compressionEnabled: boolean;
  persistenceEnabled: boolean;
  warmupOnStart: boolean;
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'priority';
  serialization: 'json' | 'binary';
}

export class ResultCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = []; // for LRU
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private compressionWorker: CompressionWorker | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1024 * 1024 * 100, // 100MB
      maxEntries: 10000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      compressionEnabled: true,
      persistenceEnabled: true,
      warmupOnStart: true,
      evictionStrategy: 'lru',
      serialization: 'json',
      ...config
    };

    this.metrics = this.initializeMetrics();
    
    if (this.config.compressionEnabled) {
      this.compressionWorker = new CompressionWorker();
    }

    this.startCleanup();
    
    if (this.config.warmupOnStart) {
      this.warmCache();
    }
  }

  /**
   * Generate cache key from input parameters
   */
  generateCacheKey(params: Partial<CacheKey>): string {
    const keyObj: CacheKey = {
      productId: params.productId || '',
      logoHash: params.logoHash || '',
      placementType: params.placementType || '',
      qualityLevel: params.qualityLevel || '',
      stylePreferences: params.stylePreferences || {},
      constraintVersion: params.constraintVersion || '1.0',
      apiVersion: params.apiVersion || '1.0'
    };

    // Create deterministic hash
    const keyString = JSON.stringify(keyObj, Object.keys(keyObj).sort());
    return this.generateHash(keyString);
  }

  /**
   * Store result in cache
   */
  async set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      contentType?: string;
    } = {}
  ): Promise<boolean> {
    try {
      const serializedData = await this.serialize(data);
      const compressedData = this.config.compressionEnabled 
        ? await this.compress(serializedData)
        : serializedData;

      const entry: CacheEntry<string> = {
        key,
        data: compressedData,
        metadata: {
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0,
          expiresAt: new Date(Date.now() + (options.ttl || this.config.defaultTTL)),
          size: this.calculateSize(compressedData),
          contentType: options.contentType || 'application/json',
          tags: options.tags || [],
          priority: options.priority || 'normal',
          source: 'api'
        },
        checksum: this.generateHash(compressedData)
      };

      // Check if we need to evict entries
      if (this.needsEviction(entry.metadata.size)) {
        await this.evictEntries(entry.metadata.size);
      }

      this.cache.set(key, entry);
      this.updateAccessOrder(key);
      this.updateMetrics('set', entry);

      if (this.config.persistenceEnabled) {
        await this.persistEntry(entry);
      }

      console.log(`Cache: Stored ${key} (${entry.metadata.size} bytes)`);
      return true;

    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Retrieve result from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.updateMetrics('miss');
      return null;
    }

    // Check expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.updateMetrics('miss');
      console.log(`Cache: Expired ${key}`);
      return null;
    }

    // Update access info
    entry.metadata.lastAccessed = new Date();
    entry.metadata.accessCount++;
    this.updateAccessOrder(key);

    try {
      let data = entry.data;
      
      // Decompress if needed
      if (this.config.compressionEnabled && typeof data === 'string') {
        data = await this.decompress(data);
      }

      // Deserialize
      const result = await this.deserialize<T>(data);
      
      this.updateMetrics('hit', entry);
      console.log(`Cache: Hit ${key} (accessed ${entry.metadata.accessCount} times)`);
      
      return result;

    } catch (error) {
      console.error('Cache get error:', error);
      this.cache.delete(key);
      return null;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    const success = this.cache.delete(key);
    
    if (success && entry) {
      this.removeFromAccessOrder(key);
      this.updateMetrics('delete', entry);
      console.log(`Cache: Deleted ${key}`);
    }
    
    return success;
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        invalidated++;
      }
    }

    if (invalidated > 0) {
      this.updateMetrics('invalidation');
      console.log(`Cache: Invalidated ${invalidated} entries by tags: ${tags.join(', ')}`);
    }

    return invalidated;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.expiresAt < now) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.updateMetrics('cleanup');
      console.log(`Cache: Cleaned up ${cleaned} expired entries`);
    }

    this.metrics.lastCleanup = now;
    return cleaned;
  }

  /**
   * Warm cache with frequently used data
   */
  async warmCache(): Promise<void> {
    if (!this.config.persistenceEnabled) return;

    try {
      const warmupKeys = await this.getWarmupKeys();
      let warmed = 0;

      for (const key of warmupKeys) {
        const persistedData = await this.loadPersistedEntry(key);
        if (persistedData && !this.isExpired(persistedData)) {
          this.cache.set(key, persistedData);
          warmed++;
        }
      }

      console.log(`Cache: Warmed up ${warmed} entries`);
    } catch (error) {
      console.error('Cache warmup error:', error);
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.calculateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder = [];
    this.metrics = this.initializeMetrics();
    console.log(`Cache: Cleared all ${size} entries`);
  }

  /**
   * Private methods
   */
  private initializeMetrics(): CacheMetrics {
    return {
      totalEntries: 0,
      totalSize: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      oldestEntry: null,
      newestEntry: null,
      averageAccessTime: 0,
      topKeys: [],
      sizeByPriority: {
        low: 0,
        normal: 0,
        high: 0,
        critical: 0
      },
      lastCleanup: new Date()
    };
  }

  private needsEviction(newEntrySize: number): boolean {
    const currentSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
    
    return (
      this.cache.size >= this.config.maxEntries ||
      currentSize + newEntrySize > this.config.maxSize
    );
  }

  private async evictEntries(requiredSpace: number): Promise<void> {
    let freedSpace = 0;
    let evicted = 0;

    while (
      (this.cache.size >= this.config.maxEntries || 
       freedSpace < requiredSpace) && 
      this.cache.size > 0
    ) {
      const victimKey = this.selectEvictionVictim();
      if (!victimKey) break;

      const entry = this.cache.get(victimKey);
      if (entry) {
        freedSpace += entry.metadata.size;
        evicted++;
      }

      this.cache.delete(victimKey);
      this.removeFromAccessOrder(victimKey);
    }

    this.metrics.evictionCount += evicted;
    console.log(`Cache: Evicted ${evicted} entries, freed ${freedSpace} bytes`);
  }

  private selectEvictionVictim(): string | null {
    if (this.cache.size === 0) return null;

    switch (this.config.evictionStrategy) {
      case 'lru':
        return this.accessOrder[0] || null;
      
      case 'lfu':
        return Array.from(this.cache.entries())
          .sort((a, b) => a[1].metadata.accessCount - b[1].metadata.accessCount)[0]?.[0] || null;
      
      case 'ttl':
        return Array.from(this.cache.entries())
          .sort((a, b) => a[1].metadata.expiresAt.getTime() - b[1].metadata.expiresAt.getTime())[0]?.[0] || null;
      
      case 'priority':
        const priorities: CachePriority[] = ['low', 'normal', 'high', 'critical'];
        for (const priority of priorities) {
          const victim = Array.from(this.cache.entries())
            .find(([_, entry]) => entry.metadata.priority === priority);
          if (victim) return victim[0];
        }
        return null;
      
      default:
        return this.accessOrder[0] || null;
    }
  }

  private updateAccessOrder(key: string): void {
    // Remove if exists
    this.removeFromAccessOrder(key);
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.metadata.expiresAt < new Date();
  }

  private async serialize<T>(data: T): Promise<string> {
    return JSON.stringify(data);
  }

  private async deserialize<T>(data: string): Promise<T> {
    return JSON.parse(data);
  }

  private async compress(data: string): Promise<string> {
    if (!this.compressionWorker) return data;
    return this.compressionWorker.compress(data);
  }

  private async decompress(data: string): Promise<string> {
    if (!this.compressionWorker) return data;
    return this.compressionWorker.decompress(data);
  }

  private calculateSize(data: any): number {
    return new Blob([typeof data === 'string' ? data : JSON.stringify(data)]).size;
  }

  private generateHash(data: string): string {
    // Simple hash function for demo - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private updateMetrics(operation: string, entry?: CacheEntry): void {
    this.calculateMetrics();
    // Additional operation-specific metrics updates can be added here
  }

  private calculateMetrics(): void {
    const entries = Array.from(this.cache.values());
    
    this.metrics.totalEntries = entries.length;
    this.metrics.totalSize = entries.reduce((sum, entry) => sum + entry.metadata.size, 0);
    
    if (entries.length > 0) {
      const dates = entries.map(e => e.metadata.createdAt);
      this.metrics.oldestEntry = new Date(Math.min(...dates.map(d => d.getTime())));
      this.metrics.newestEntry = new Date(Math.max(...dates.map(d => d.getTime())));
      
      // Top accessed keys
      this.metrics.topKeys = entries
        .sort((a, b) => b.metadata.accessCount - a.metadata.accessCount)
        .slice(0, 10)
        .map(entry => ({ key: entry.key, accessCount: entry.metadata.accessCount }));
      
      // Size by priority
      this.metrics.sizeByPriority = {
        low: entries.filter(e => e.metadata.priority === 'low').reduce((s, e) => s + e.metadata.size, 0),
        normal: entries.filter(e => e.metadata.priority === 'normal').reduce((s, e) => s + e.metadata.size, 0),
        high: entries.filter(e => e.metadata.priority === 'high').reduce((s, e) => s + e.metadata.size, 0),
        critical: entries.filter(e => e.metadata.priority === 'critical').reduce((s, e) => s + e.metadata.size, 0)
      };
    }
  }

  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private async persistEntry(entry: CacheEntry): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const key = `cache_${entry.key}`;
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (error) {
        // Storage quota exceeded or other error
        console.warn('Cache persistence failed:', error);
      }
    }
  }

  private async loadPersistedEntry(key: string): Promise<CacheEntry | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data = localStorage.getItem(`cache_${key}`);
        if (data) {
          const entry = JSON.parse(data);
          // Convert date strings back to Date objects
          entry.metadata.createdAt = new Date(entry.metadata.createdAt);
          entry.metadata.lastAccessed = new Date(entry.metadata.lastAccessed);
          entry.metadata.expiresAt = new Date(entry.metadata.expiresAt);
          return entry;
        }
      } catch (error) {
        console.warn('Cache load failed:', error);
      }
    }
    return null;
  }

  private async getWarmupKeys(): Promise<string[]> {
    // In a real implementation, this would query most frequently accessed keys
    return [];
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.destroy();
    }

    this.clear();
    console.log('Cache: Destroyed');
  }
}

/**
 * Compression Worker (simplified version)
 */
class CompressionWorker {
  async compress(data: string): Promise<string> {
    // In a real implementation, this would use actual compression
    // For demo, we'll just return the data (compression would reduce size)
    return data;
  }

  async decompress(data: string): Promise<string> {
    // In a real implementation, this would decompress the data
    return data;
  }

  destroy(): void {
    // Cleanup worker resources
  }
}

// Singleton instance
let resultCache: ResultCache | null = null;

export function getResultCache(config?: Partial<CacheConfig>): ResultCache {
  if (!resultCache) {
    resultCache = new ResultCache(config);
  }
  return resultCache;
}

export default ResultCache;