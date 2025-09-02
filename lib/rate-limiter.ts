export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  check(key: string): RateLimitResult {
    this.cleanup();
    
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    let entry = this.store.get(key);
    
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime
      };
      this.store.set(key, entry);
    }

    const allowed = entry.count < this.config.maxRequests;
    
    if (allowed) {
      entry.count++;
    }

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      reset: new Date(entry.resetTime),
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    };

    return { allowed, info };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => this.cleanup(), Math.min(this.config.windowMs, 60000));
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  resetAll(): void {
    this.store.clear();
  }
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  creditsUsed: number;
  lastRequestTime?: Date;
  averageResponseTime?: number;
}

export interface UsageEntry {
  timestamp: Date;
  success: boolean;
  rateLimited: boolean;
  responseTime?: number;
  creditsUsed?: number;
  error?: string;
}

export class UsageTracker {
  private entries: UsageEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
  }

  recordRequest(entry: Omit<UsageEntry, 'timestamp'>): void {
    this.entries.push({
      ...entry,
      timestamp: new Date()
    });

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  getStats(since?: Date): UsageStats {
    const relevantEntries = since 
      ? this.entries.filter(entry => entry.timestamp >= since)
      : this.entries;

    const totalRequests = relevantEntries.length;
    const successfulRequests = relevantEntries.filter(e => e.success).length;
    const failedRequests = relevantEntries.filter(e => !e.success).length;
    const rateLimitHits = relevantEntries.filter(e => e.rateLimited).length;
    const creditsUsed = relevantEntries.reduce((sum, e) => sum + (e.creditsUsed || 0), 0);
    
    const lastEntry = relevantEntries[relevantEntries.length - 1];
    const lastRequestTime = lastEntry?.timestamp;
    
    const responseTimes = relevantEntries
      .map(e => e.responseTime)
      .filter((time): time is number => time !== undefined);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : undefined;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      rateLimitHits,
      creditsUsed,
      lastRequestTime,
      averageResponseTime
    };
  }

  getRecentEntries(limit = 100): UsageEntry[] {
    return this.entries.slice(-limit);
  }

  clear(): void {
    this.entries = [];
  }

  exportStats(): UsageEntry[] {
    return [...this.entries];
  }

  importStats(entries: UsageEntry[]): void {
    this.entries = entries.slice(-this.maxEntries);
  }
}

const removeBgRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 50
});

const removeBgUsageTracker = new UsageTracker();

export { removeBgRateLimiter, removeBgUsageTracker };

export function createRateLimitMiddleware(rateLimiter: InMemoryRateLimiter) {
  return (key: string = 'global') => {
    const result = rateLimiter.check(key);
    
    if (!result.allowed) {
      const error = new Error('Rate limit exceeded');
      (error as any).rateLimitInfo = result.info;
      (error as any).isRateLimitError = true;
      throw error;
    }
    
    return result.info;
  };
}

export function isRateLimitError(error: any): boolean {
  return error && error.isRateLimitError === true;
}

export function getRateLimitInfo(error: any): RateLimitInfo | null {
  return error && error.rateLimitInfo ? error.rateLimitInfo : null;
}