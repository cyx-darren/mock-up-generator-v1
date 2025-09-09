/**
 * Google AI Studio Client
 * Wrapper for Google Generative AI SDK with rate limiting and monitoring
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
  SafetySetting,
} from '@google/generative-ai';

// Types
export interface GoogleAIConfig {
  apiKey?: string;
  model?: string;
  generationConfig?: GenerationConfig;
  safetySettings?: SafetySetting[];
  maxRetries?: number;
  retryDelay?: number;
}

export interface UsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
  errorRate: number;
  requestsPerMinute: number;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  maxTokensPerMinute: number;
  maxTokensPerHour: number;
}

export interface RequestLog {
  id: string;
  timestamp: Date;
  model: string;
  prompt: string;
  response?: string;
  tokensUsed?: number;
  responseTime: number;
  status: 'success' | 'error' | 'rate_limited';
  error?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  seed?: number;
  includeText?: boolean;
  retries?: number;
}

export interface GeneratedImage {
  data: string; // base64 encoded image data
  mimeType: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  prompt: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
  hasWatermark: boolean;
}

// Default configurations
const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

const DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000,
  maxRequestsPerDay: 10000,
  maxTokensPerMinute: 100000,
  maxTokensPerHour: 1000000,
};

export class GoogleAIClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<GoogleAIConfig>;
  private rateLimits: RateLimitConfig;
  private requestHistory: RequestLog[] = [];
  private metrics: UsageMetrics;
  private rateLimitBuckets: Map<string, number[]>;

  constructor(config: GoogleAIConfig = {}) {
    // Get API key from environment or config
    const apiKey =
      config.apiKey || process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Google AI API key is required. Set GOOGLE_AI_STUDIO_API_KEY or GEMINI_API_KEY environment variable.'
      );
    }

    // Initialize client
    this.client = new GoogleGenerativeAI(apiKey);

    // Set configuration with defaults
    this.config = {
      apiKey,
      model: config.model || 'gemini-1.5-flash',
      generationConfig: { ...DEFAULT_GENERATION_CONFIG, ...config.generationConfig },
      safetySettings: config.safetySettings || DEFAULT_SAFETY_SETTINGS,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    // Initialize model
    this.model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: this.config.generationConfig,
      safetySettings: this.config.safetySettings,
    });

    // Initialize rate limiting
    this.rateLimits = DEFAULT_RATE_LIMITS;
    this.rateLimitBuckets = new Map([
      ['minute', []],
      ['hour', []],
      ['day', []],
    ]);

    // Initialize metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errorRate: 0,
      requestsPerMinute: 0,
    };
  }

  /**
   * Check if request is within rate limits
   */
  private checkRateLimit(): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    // Clean old entries and check limits
    const buckets = [
      { name: 'minute', window: minute, limit: this.rateLimits.maxRequestsPerMinute },
      { name: 'hour', window: hour, limit: this.rateLimits.maxRequestsPerHour },
      { name: 'day', window: day, limit: this.rateLimits.maxRequestsPerDay },
    ];

    for (const { name, window, limit } of buckets) {
      const bucket = this.rateLimitBuckets.get(name) || [];

      // Remove old entries
      const validEntries = bucket.filter((time) => now - time < window);
      this.rateLimitBuckets.set(name, validEntries);

      // Check limit
      if (validEntries.length >= limit) {
        const oldestEntry = Math.min(...validEntries);
        const retryAfter = Math.ceil((oldestEntry + window - now) / 1000);
        return { allowed: false, retryAfter };
      }
    }

    // Add current request to all buckets
    for (const [name, bucket] of this.rateLimitBuckets) {
      bucket.push(now);
    }

    return { allowed: true };
  }

  /**
   * Update usage metrics
   */
  private updateMetrics(log: RequestLog): void {
    this.metrics.totalRequests++;

    if (log.status === 'success') {
      this.metrics.successfulRequests++;
      if (log.tokensUsed) {
        this.metrics.totalTokensUsed += log.tokensUsed;
      }
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalResponseTime =
      this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + log.responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;

    // Update error rate
    this.metrics.errorRate = this.metrics.failedRequests / this.metrics.totalRequests;

    // Update requests per minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = this.requestHistory.filter((r) => r.timestamp.getTime() > oneMinuteAgo);
    this.metrics.requestsPerMinute = recentRequests.length;

    this.metrics.lastRequestTime = new Date();
  }

  /**
   * Log request for monitoring
   */
  private logRequest(log: RequestLog): void {
    this.requestHistory.push(log);
    this.updateMetrics(log);

    // Keep only last 1000 entries to prevent memory issues
    if (this.requestHistory.length > 1000) {
      this.requestHistory.shift();
    }
  }

  /**
   * Generate content with rate limiting and retries
   */
  async generateContent(
    prompt: string,
    options?: {
      images?: Array<{ data: string; mimeType: string }>;
      retries?: number;
    }
  ): Promise<{
    text: string;
    tokensUsed?: number;
    responseTime: number;
  }> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const log: RequestLog = {
        id: requestId,
        timestamp: new Date(),
        model: this.config.model,
        prompt,
        responseTime: Date.now() - startTime,
        status: 'rate_limited',
        error: `Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds`,
      };
      this.logRequest(log);

      throw new Error(
        `Rate limit exceeded. Please retry after ${rateLimitCheck.retryAfter} seconds`
      );
    }

    const maxRetries = options?.retries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Prepare content parts
        const parts: any[] = [{ text: prompt }];

        // Add images if provided
        if (options?.images) {
          for (const image of options.images) {
            parts.push({
              inlineData: {
                data: image.data,
                mimeType: image.mimeType,
              },
            });
          }
        }

        // Generate content
        const result = await this.model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        const responseTime = Date.now() - startTime;

        // Extract token usage if available
        const tokensUsed = response.usageMetadata?.totalTokenCount;

        // Log successful request
        const log: RequestLog = {
          id: requestId,
          timestamp: new Date(),
          model: this.config.model,
          prompt,
          response: text.substring(0, 500), // Store first 500 chars for monitoring
          tokensUsed,
          responseTime,
          status: 'success',
        };
        this.logRequest(log);

        return {
          text,
          tokensUsed,
          responseTime,
        };
      } catch (error: any) {
        lastError = error;

        // Log failed attempt
        const log: RequestLog = {
          id: requestId,
          timestamp: new Date(),
          model: this.config.model,
          prompt,
          responseTime: Date.now() - startTime,
          status: 'error',
          error: error.message,
        };

        // Check if we should retry
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.warn(
            `Request failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logRequest(log);
        }
      }
    }

    throw lastError || new Error('Failed to generate content after retries');
  }

  /**
   * Generate content stream for real-time responses
   */
  async *generateContentStream(
    prompt: string,
    options?: {
      images?: Array<{ data: string; mimeType: string }>;
    }
  ): AsyncGenerator<string, void, unknown> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      throw new Error(
        `Rate limit exceeded. Please retry after ${rateLimitCheck.retryAfter} seconds`
      );
    }

    try {
      // Prepare content parts
      const parts: any[] = [{ text: prompt }];

      if (options?.images) {
        for (const image of options.images) {
          parts.push({
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          });
        }
      }

      // Generate content stream
      const result = await this.model.generateContentStream(parts);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        yield chunkText;
      }

      // Log successful request
      const log: RequestLog = {
        id: requestId,
        timestamp: new Date(),
        model: this.config.model,
        prompt,
        response: fullText.substring(0, 500),
        responseTime: Date.now() - startTime,
        status: 'success',
      };
      this.logRequest(log);
    } catch (error: any) {
      // Log failed request
      const log: RequestLog = {
        id: requestId,
        timestamp: new Date(),
        model: this.config.model,
        prompt,
        responseTime: Date.now() - startTime,
        status: 'error',
        error: error.message,
      };
      this.logRequest(log);
      throw error;
    }
  }

  /**
   * Count tokens in text
   */
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      console.error('Error counting tokens:', error);
      // Rough estimate as fallback (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Generate images from text prompts using Gemini image generation
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    const startTime = Date.now();
    const requestId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check rate limit
    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.allowed) {
      const log: RequestLog = {
        id: requestId,
        timestamp: new Date(),
        model: 'gemini-2.5-flash-image-preview',
        prompt: options.prompt,
        responseTime: Date.now() - startTime,
        status: 'rate_limited',
        error: `Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds`,
      };
      this.logRequest(log);
      throw new Error(
        `Rate limit exceeded. Please retry after ${rateLimitCheck.retryAfter} seconds`
      );
    }

    const maxRetries = options.retries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create a specialized model for image generation
        const imageModel = this.client.getGenerativeModel({
          model: 'gemini-2.5-flash-image-preview',
          generationConfig: {
            temperature: 0.4, // Lower temperature for more consistent image generation
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
          },
        });

        // Prepare the prompt with image generation instructions
        let enhancedPrompt = options.prompt;
        if (options.aspectRatio) {
          enhancedPrompt += ` [Aspect ratio: ${options.aspectRatio}]`;
        }
        if (options.seed) {
          enhancedPrompt += ` [Seed: ${options.seed}]`;
        }
        if (options.includeText === false) {
          enhancedPrompt += ' [No text in image]';
        }

        // Generate the image
        const result = await imageModel.generateContent(enhancedPrompt);
        const response = await result.response;

        const responseTime = Date.now() - startTime;
        const tokensUsed = response.usageMetadata?.totalTokenCount;

        // Extract images from response
        const images: GeneratedImage[] = [];
        const candidates = response.candidates || [];

        for (const candidate of candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                images.push({
                  data: part.inlineData.data, // Base64 encoded image data
                  mimeType: part.inlineData.mimeType || 'image/png',
                  seed: options.seed,
                });
              }
            }
          }
        }

        // If no images were generated, throw an error
        if (images.length === 0) {
          throw new Error('No images were generated from the prompt');
        }

        // Log successful request
        const log: RequestLog = {
          id: requestId,
          timestamp: new Date(),
          model: 'gemini-2.5-flash-image-preview',
          prompt: options.prompt,
          response: `Generated ${images.length} image(s) successfully`,
          tokensUsed,
          responseTime,
          status: 'success',
        };
        this.logRequest(log);

        return {
          images,
          prompt: options.prompt,
          model: 'gemini-2.5-flash-image-preview',
          tokensUsed,
          responseTime,
          hasWatermark: true, // Gemini images always include SynthID watermark
        };
      } catch (error: any) {
        lastError = error;

        const log: RequestLog = {
          id: requestId,
          timestamp: new Date(),
          model: 'gemini-2.5-flash-image-preview',
          prompt: options.prompt,
          responseTime: Date.now() - startTime,
          status: 'error',
          error: error.message,
        };

        if (attempt === maxRetries) {
          this.logRequest(log);
        } else {
          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Failed to generate image after retries');
  }

  /**
   * Update rate limits
   */
  setRateLimits(limits: Partial<RateLimitConfig>): void {
    this.rateLimits = { ...this.rateLimits, ...limits };
  }

  /**
   * Get current usage metrics
   */
  getMetrics(): UsageMetrics {
    return { ...this.metrics };
  }

  /**
   * Get request history
   */
  getRequestHistory(limit: number = 100): RequestLog[] {
    return this.requestHistory.slice(-limit);
  }

  /**
   * Clear request history and reset metrics
   */
  resetMetrics(): void {
    this.requestHistory = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errorRate: 0,
      requestsPerMinute: 0,
    };
    this.rateLimitBuckets.clear();
    this.rateLimitBuckets.set('minute', []);
    this.rateLimitBuckets.set('hour', []);
    this.rateLimitBuckets.set('day', []);
  }

  /**
   * Get available models
   */
  static getAvailableModels(): string[] {
    return [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro-001',
      'gemini-1.5-pro-002',
      'gemini-1.0-pro',
      'gemini-1.0-pro-latest',
      'gemini-1.0-pro-001',
      'gemini-1.0-pro-vision-latest',
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-2.5-flash-image-preview', // Image generation model
    ];
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.generateContent('Test connection', { retries: 0 });
      return !!result.text;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): {
    model: string;
    config: GenerationConfig;
    safetySettings: SafetySetting[];
  } {
    return {
      model: this.config.model,
      config: this.config.generationConfig,
      safetySettings: this.config.safetySettings,
    };
  }
}

// Singleton instance for convenience
let defaultClient: GoogleAIClient | null = null;

export function getGoogleAIClient(config?: GoogleAIConfig): GoogleAIClient {
  if (!defaultClient) {
    defaultClient = new GoogleAIClient(config);
  }
  return defaultClient;
}

// Export default
export default GoogleAIClient;
