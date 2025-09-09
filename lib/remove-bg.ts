export interface RemoveBgOptions {
  size?: 'auto' | 'preview' | 'full' | 'regular' | 'medium' | 'hd' | '4k';
  type?: 'auto' | 'person' | 'product' | 'car';
  format?: 'auto' | 'png' | 'jpg' | 'zip';
  roi?: string;
  crop?: boolean;
  crop_margin?: string;
  scale?: string;
  position?: string;
  channels?: 'rgba' | 'alpha';
  add_shadow?: boolean;
  semitransparency?: boolean;
  bg_color?: string;
  bg_image_url?: string;
}

export interface RemoveBgResponse {
  data: Blob;
  detectedType?: string;
  result?: {
    width: number;
    height: number;
    credits_charged: number;
  };
}

export interface RemoveBgError {
  title: string;
  detail: string;
  code: string;
  status: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}

import { removeBgRateLimiter, removeBgUsageTracker, createRateLimitMiddleware, isRateLimitError } from './rate-limiter';

export class RemoveBgClient {
  private apiKey: string;
  private baseUrl = 'https://api.remove.bg/v1.0';
  private rateLimitInfo: RateLimitInfo | null = null;
  private rateLimitMiddleware = createRateLimitMiddleware(removeBgRateLimiter);

  constructor(apiKey?: string) {
    // Get API key with proper client-side handling
    this.apiKey = apiKey || (typeof window === 'undefined' ? process.env.REMOVE_BG_API_KEY : '') || '';
    
    // For client-side, we'll handle the key requirement when actually making API calls
    // This prevents initialization errors when the component is just being imported
    if (!this.apiKey && typeof window === 'undefined') {
      throw new Error('Remove.bg API key is required');
    }
  }

  async removeBackground(
    imageFile: File | Blob | string,
    options: RemoveBgOptions = {},
    userId?: string
  ): Promise<RemoveBgResponse> {
    return this.processRemovalRequest(imageFile, options, userId);
  }

  private async processRemovalRequest(
    imageFile: File | Blob | string,
    options: RemoveBgOptions = {},
    userId?: string
  ): Promise<RemoveBgResponse> {
    // Check if API key is available when actually making the call
    if (!this.apiKey) {
      throw new Error('Remove.bg API key is required for background removal');
    }
    
    const startTime = Date.now();
    const rateLimitKey = userId || 'global';
    
    try {
      this.rateLimitMiddleware(rateLimitKey);
    } catch (rateLimitError) {
      removeBgUsageTracker.recordRequest({
        success: false,
        rateLimited: true,
        responseTime: Date.now() - startTime,
        error: 'Rate limit exceeded'
      });
      throw rateLimitError;
    }

    const formData = new FormData();

    if (typeof imageFile === 'string') {
      formData.append('image_url', imageFile);
    } else {
      formData.append('image_file', imageFile);
    }

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(`${this.baseUrl}/removebg`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: formData,
      });

      const responseTime = Date.now() - startTime;
      this.updateRateLimitInfo(response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: RemoveBgError = {
          title: errorData.title || 'Remove.bg API Error',
          detail: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || 'UNKNOWN_ERROR',
          status: response.status,
        };

        removeBgUsageTracker.recordRequest({
          success: false,
          rateLimited: false,
          responseTime,
          error: error.detail
        });

        throw error;
      }

      const blob = await response.blob();
      const detectedType = response.headers.get('X-Type') || undefined;
      const creditsCharged = parseInt(response.headers.get('X-Credits-Charged') || '0');
      
      const result = {
        width: parseInt(response.headers.get('X-Width') || '0'),
        height: parseInt(response.headers.get('X-Height') || '0'),
        credits_charged: creditsCharged,
      };

      removeBgUsageTracker.recordRequest({
        success: true,
        rateLimited: false,
        responseTime,
        creditsUsed: creditsCharged
      });

      return {
        data: blob,
        detectedType,
        result,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (isRateLimitError(error)) {
        throw error;
      }
      
      if (error && typeof error === 'object' && 'status' in error) {
        removeBgUsageTracker.recordRequest({
          success: false,
          rateLimited: false,
          responseTime,
          error: (error as RemoveBgError).detail
        });
        throw error;
      }
      
      const networkError: RemoveBgError = {
        title: 'Network Error',
        detail: error instanceof Error ? error.message : 'Unknown network error',
        code: 'NETWORK_ERROR',
        status: 0,
      };

      removeBgUsageTracker.recordRequest({
        success: false,
        rateLimited: false,
        responseTime,
        error: networkError.detail
      });

      throw networkError;
    }
  }

  async getAccountInfo(): Promise<{
    credits: {
      total: number;
      subscription: number;
      payg: number;
    };
    api: {
      free_calls: number;
      sizes: string;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      this.updateRateLimitInfo(response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: RemoveBgError = {
          title: errorData.title || 'Remove.bg API Error',
          detail: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          code: errorData.code || 'UNKNOWN_ERROR',
          status: response.status,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) {
        throw error;
      }
      
      const networkError: RemoveBgError = {
        title: 'Network Error',
        detail: error instanceof Error ? error.message : 'Unknown network error',
        code: 'NETWORK_ERROR',
        status: 0,
      };
      throw networkError;
    }
  }

  private updateRateLimitInfo(headers: Headers): void {
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const total = headers.get('X-RateLimit-Limit');

    if (remaining && reset && total) {
      this.rateLimitInfo = {
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        total: parseInt(total),
      };
    }
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  getCreditsUsed(): number {
    return this.rateLimitInfo ? this.rateLimitInfo.total - this.rateLimitInfo.remaining : 0;
  }

  getTimeUntilReset(): number {
    if (!this.rateLimitInfo) return 0;
    return Math.max(0, this.rateLimitInfo.reset * 1000 - Date.now());
  }
}

export const removeBgClient = new RemoveBgClient();

export async function removeBackgroundFromFile(
  file: File,
  options: RemoveBgOptions = {},
  userId?: string
): Promise<RemoveBgResponse> {
  return removeBgClient.removeBackground(file, options, userId);
}

export async function removeBackgroundFromUrl(
  imageUrl: string,
  options: RemoveBgOptions = {},
  userId?: string
): Promise<RemoveBgResponse> {
  return removeBgClient.removeBackground(imageUrl, options, userId);
}

export async function checkRemoveBgCredits() {
  return removeBgClient.getAccountInfo();
}

export function getRemoveBgUsageStats(since?: Date) {
  return removeBgUsageTracker.getStats(since);
}

export function getRemoveBgRecentEntries(limit = 100) {
  return removeBgUsageTracker.getRecentEntries(limit);
}

export function resetRemoveBgRateLimit(key?: string) {
  if (key) {
    removeBgRateLimiter.reset(key);
  } else {
    removeBgRateLimiter.resetAll();
  }
}

export function clearRemoveBgUsageHistory() {
  removeBgUsageTracker.clear();
}

export function exportRemoveBgUsageData() {
  return removeBgUsageTracker.exportStats();
}

export function importRemoveBgUsageData(data: any[]) {
  return removeBgUsageTracker.importStats(data);
}

export function isRemoveBgError(error: any): error is RemoveBgError {
  return error && typeof error === 'object' && 'code' in error && 'status' in error;
}