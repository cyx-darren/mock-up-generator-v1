/**
 * AI Request/Response Handler
 * Centralized system for managing AI generation requests
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ImageGenerationOptions, ImageGenerationResponse } from './google-ai-api-client';

// Types
export interface RequestJob {
  id: string;
  type: 'text_generation' | 'image_generation' | 'mockup_generation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payload: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  result?: any;
  error?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface RequestMetrics {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  averageProcessingTime: number;
  queueLength: number;
  activeJobs: number;
  successRate: number;
  errorRate: number;
  throughput: number; // requests per minute
  lastProcessedAt?: Date;
}

export interface QueueOptions {
  maxConcurrentJobs: number;
  defaultPriority: RequestJob['priority'];
  defaultMaxRetries: number;
  retryDelay: number;
  jobTimeout: number;
  enableMetrics: boolean;
}

export interface RequestBuilder {
  id: string;
  type: RequestJob['type'];
  priority: RequestJob['priority'];
  maxRetries: number;
  timeout?: number;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

// Default configuration
const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  maxConcurrentJobs: 3,
  defaultPriority: 'medium',
  defaultMaxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 120000, // 2 minutes
  enableMetrics: true,
};

export class AIRequestHandler {
  private queue: RequestJob[] = [];
  private activeJobs: Map<string, RequestJob> = new Map();
  private completedJobs: RequestJob[] = [];
  private metrics: RequestMetrics;
  private options: QueueOptions;
  private googleAI: GoogleGenerativeAI;
  private processingInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;

  constructor(options: Partial<QueueOptions> = {}) {
    this.options = { ...DEFAULT_QUEUE_OPTIONS, ...options };
    this.googleAI = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY || ''
    );
    this.metrics = this.initializeMetrics();

    // Start processing queue
    this.startProcessing();

    // Start metrics collection
    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  private initializeMetrics(): RequestMetrics {
    return {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      cancelledRequests: 0,
      averageProcessingTime: 0,
      queueLength: 0,
      activeJobs: 0,
      successRate: 0,
      errorRate: 0,
      throughput: 0,
    };
  }

  /**
   * Request Builder - Create standardized requests
   */
  createRequest(builder: Partial<RequestBuilder>): RequestBuilder {
    return {
      id: builder.id || this.generateRequestId(),
      type: builder.type || 'image_generation',
      priority: builder.priority || this.options.defaultPriority,
      maxRetries: builder.maxRetries ?? this.options.defaultMaxRetries,
      timeout: builder.timeout,
      metadata: builder.metadata || {},
      userId: builder.userId,
      sessionId: builder.sessionId,
    };
  }

  /**
   * Add job to queue
   */
  async addJob(request: RequestBuilder, payload: any): Promise<string> {
    const job: RequestJob = {
      id: request.id,
      type: request.type,
      priority: request.priority,
      status: 'pending',
      payload,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: request.maxRetries,
      userId: request.userId,
      sessionId: request.sessionId,
      metadata: request.metadata,
    };

    // Insert job based on priority
    this.insertJobByPriority(job);

    this.metrics.totalRequests++;
    this.metrics.queueLength = this.queue.length;

    this.log('info', `Job ${job.id} added to queue with priority ${job.priority}`, {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
      queueLength: this.queue.length,
    });

    return job.id;
  }

  private insertJobByPriority(job: RequestJob): void {
    const priorityOrder: Record<RequestJob['priority'], number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const jobPriority = priorityOrder[job.priority];
    let insertIndex = this.queue.length;

    // Find the correct insertion point
    for (let i = 0; i < this.queue.length; i++) {
      if (priorityOrder[this.queue[i].priority] > jobPriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, job);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): RequestJob | null {
    // Check active jobs first
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) return activeJob;

    // Check queue
    const queuedJob = this.queue.find((job) => job.id === jobId);
    if (queuedJob) return queuedJob;

    // Check completed jobs
    const completedJob = this.completedJobs.find((job) => job.id === jobId);
    if (completedJob) return completedJob;

    return null;
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    // Remove from queue
    const queueIndex = this.queue.findIndex((job) => job.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue[queueIndex];
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.queue.splice(queueIndex, 1);
      this.completedJobs.push(job);
      this.metrics.cancelledRequests++;
      this.log('info', `Job ${jobId} cancelled from queue`);
      return true;
    }

    // Cancel active job (best effort - depends on AI service)
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      activeJob.status = 'cancelled';
      activeJob.completedAt = new Date();
      this.activeJobs.delete(jobId);
      this.completedJobs.push(activeJob);
      this.metrics.cancelledRequests++;
      this.log('info', `Job ${jobId} cancelled from active processing`);
      return true;
    }

    return false;
  }

  /**
   * Start processing queue
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Check every second
  }

  private async processQueue(): Promise<void> {
    // Don't exceed max concurrent jobs
    if (this.activeJobs.size >= this.options.maxConcurrentJobs) {
      return;
    }

    // Get next job from queue
    const job = this.queue.shift();
    if (!job) {
      return;
    }

    // Move to active jobs
    job.status = 'processing';
    job.startedAt = new Date();
    this.activeJobs.set(job.id, job);
    this.metrics.activeJobs = this.activeJobs.size;
    this.metrics.queueLength = this.queue.length;

    this.log('info', `Starting job ${job.id}`, {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
    });

    // Process job asynchronously
    this.processJob(job).catch((error) => {
      this.log('error', `Unexpected error processing job ${job.id}`, { error: error.message });
    });
  }

  private async processJob(job: RequestJob): Promise<void> {
    try {
      let result: any;

      // Process based on job type
      switch (job.type) {
        case 'image_generation':
          result = await this.processImageGeneration(job);
          break;
        case 'text_generation':
          result = await this.processTextGeneration(job);
          break;
        case 'mockup_generation':
          result = await this.processMockupGeneration(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Job completed successfully
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      this.completeJob(job);

      this.log('info', `Job ${job.id} completed successfully`, {
        jobId: job.id,
        processingTime: job.completedAt.getTime() - job.startedAt!.getTime(),
      });
    } catch (error: any) {
      // Job failed
      job.error = error.message;

      // Retry if attempts remain
      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = 'pending';

        // Add back to queue with delay
        setTimeout(
          () => {
            this.insertJobByPriority(job);
            this.metrics.queueLength = this.queue.length;
          },
          this.options.retryDelay * Math.pow(2, job.retryCount - 1)
        ); // Exponential backoff

        this.log('warn', `Job ${job.id} failed, retrying (${job.retryCount}/${job.maxRetries})`, {
          jobId: job.id,
          error: error.message,
          retryCount: job.retryCount,
        });
      } else {
        // Max retries exceeded
        job.status = 'failed';
        job.completedAt = new Date();
        this.completeJob(job);

        this.log('error', `Job ${job.id} failed after ${job.maxRetries} retries`, {
          jobId: job.id,
          error: error.message,
          totalRetries: job.retryCount,
        });
      }
    }

    // Remove from active jobs
    this.activeJobs.delete(job.id);
    this.metrics.activeJobs = this.activeJobs.size;
  }

  private completeJob(job: RequestJob): void {
    this.completedJobs.push(job);

    // Update metrics
    if (job.status === 'completed') {
      this.metrics.completedRequests++;
    } else if (job.status === 'failed') {
      this.metrics.failedRequests++;
    }

    // Keep only last 1000 completed jobs to prevent memory issues
    if (this.completedJobs.length > 1000) {
      this.completedJobs.splice(0, this.completedJobs.length - 1000);
    }
  }

  /**
   * Process different job types
   */
  private async processImageGeneration(job: RequestJob): Promise<ImageGenerationResponse> {
    const options = job.payload as ImageGenerationOptions;

    // Get the image generation model
    const generativeModel = this.googleAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image-preview',
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        candidateCount: 1,
      },
    });

    // Prepare enhanced prompt
    let enhancedPrompt = `HIGH-RESOLUTION, CRYSTAL CLEAR: ${options.prompt}`;
    if (options.aspectRatio) {
      enhancedPrompt += ` [Aspect ratio: ${options.aspectRatio}]`;
    }
    if (options.seed) {
      enhancedPrompt += ` [Seed: ${options.seed}]`;
    }
    if (options.includeText === false) {
      enhancedPrompt += ' [No text in image]';
    }
    enhancedPrompt +=
      ' [ULTRA-HIGH DEFINITION, PROFESSIONAL QUALITY, SHARP DETAILS, NO PIXELATION]';

    const startTime = Date.now();
    const result = await generativeModel.generateContent(enhancedPrompt);
    const response = await result.response;
    const responseTime = Date.now() - startTime;

    // Extract images from response
    const images = [];
    const candidates = response.candidates || [];

    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            images.push({
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png',
              seed: options.seed,
            });
          }
        }
      }
    }

    if (images.length === 0) {
      throw new Error('No images were generated from the prompt');
    }

    return {
      images,
      prompt: options.prompt,
      model: 'gemini-2.5-flash-image-preview',
      tokensUsed: response.usageMetadata?.totalTokenCount,
      responseTime,
      hasWatermark: true,
    };
  }

  private async processTextGeneration(job: RequestJob): Promise<any> {
    const { prompt, model } = job.payload;

    const generativeModel = this.googleAI.getGenerativeModel({
      model: model || 'gemini-1.5-flash',
    });

    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;

    return {
      text: response.text(),
      model: model || 'gemini-1.5-flash',
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  private async processMockupGeneration(job: RequestJob): Promise<any> {
    // This would combine image generation with constraint application
    // For now, delegate to image generation
    return await this.processImageGeneration(job);
  }

  /**
   * Metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  private updateMetrics(): void {
    const total = this.metrics.totalRequests;
    const completed = this.metrics.completedRequests;
    const failed = this.metrics.failedRequests;

    this.metrics.successRate = total > 0 ? (completed / total) * 100 : 0;
    this.metrics.errorRate = total > 0 ? (failed / total) * 100 : 0;

    // Calculate average processing time
    const recentJobs = this.completedJobs.slice(-100); // Last 100 jobs
    const processingTimes = recentJobs
      .filter((job) => job.startedAt && job.completedAt)
      .map((job) => job.completedAt!.getTime() - job.startedAt!.getTime());

    this.metrics.averageProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

    // Calculate throughput (requests per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentCompletedJobs = this.completedJobs.filter(
      (job) => job.completedAt && job.completedAt > oneMinuteAgo
    );
    this.metrics.throughput = recentCompletedJobs.length;

    if (recentCompletedJobs.length > 0) {
      this.metrics.lastProcessedAt =
        recentCompletedJobs[recentCompletedJobs.length - 1].completedAt;
    }

    this.log('debug', 'Metrics updated', {
      totalRequests: this.metrics.totalRequests,
      successRate: this.metrics.successRate,
      throughput: this.metrics.throughput,
      queueLength: this.metrics.queueLength,
      activeJobs: this.metrics.activeJobs,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): RequestMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    activeJobs: number;
    jobsByPriority: Record<string, number>;
    jobsByType: Record<string, number>;
  } {
    const jobsByPriority: Record<string, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const jobsByType: Record<string, number> = {
      text_generation: 0,
      image_generation: 0,
      mockup_generation: 0,
    };

    this.queue.forEach((job) => {
      jobsByPriority[job.priority]++;
      jobsByType[job.type]++;
    });

    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      jobsByPriority,
      jobsByType,
    };
  }

  /**
   * Logging system
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      component: 'AIRequestHandler',
      ...data,
    };

    // In production, this would integrate with proper logging service
    if (level === 'error') {
      console.error(`[${timestamp}] ERROR: ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] WARN: ${message}`, data);
    } else if (level === 'info') {
      console.info(`[${timestamp}] INFO: ${message}`, data);
    } else {
      console.debug(`[${timestamp}] DEBUG: ${message}`, data);
    }
  }

  /**
   * Utility methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.log('info', 'AI Request Handler shutting down', {
      pendingJobs: this.queue.length,
      activeJobs: this.activeJobs.size,
    });
  }
}

// Singleton instance
let requestHandler: AIRequestHandler | null = null;

export function getAIRequestHandler(options?: Partial<QueueOptions>): AIRequestHandler {
  if (!requestHandler) {
    requestHandler = new AIRequestHandler(options);
  }
  return requestHandler;
}

export default AIRequestHandler;
