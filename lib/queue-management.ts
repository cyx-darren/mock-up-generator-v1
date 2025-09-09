/**
 * Queue Management System
 * Handles job queuing, priority processing, and status tracking for AI mockup generation
 */

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent';
export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface QueueJob {
  id: string;
  type: 'mockup_generation' | 'image_processing' | 'background_removal' | 'constraint_application';
  priority: JobPriority;
  status: JobStatus;
  payload: any;
  metadata: {
    userId?: string;
    sessionId?: string;
    submittedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    processingTime?: number;
    retryCount: number;
    maxRetries: number;
    estimatedDuration?: number;
    tags: string[];
  };
  result?: any;
  error?: string;
  progress?: {
    current: number;
    total: number;
    stage: string;
    message: string;
    percentage: number;
  };
}

export interface QueueMetrics {
  totalJobs: number;
  pendingJobs: number;
  queuedJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  averageProcessingTime: number;
  throughputPerMinute: number;
  currentLoad: number;
  lastUpdated: Date;
}

export interface QueueConfig {
  maxConcurrentJobs: number;
  maxQueueSize: number;
  jobTimeoutMs: number;
  retryDelayMs: number;
  persistenceEnabled: boolean;
  monitoringEnabled: boolean;
  priorityWeights: Record<JobPriority, number>;
}

export class QueueManager {
  private jobs = new Map<string, QueueJob>();
  private processingJobs = new Set<string>();
  private queue: QueueJob[] = [];
  private config: QueueConfig;
  private metrics: QueueMetrics;
  private isProcessing = false;
  private jobProcessors = new Map<string, (job: QueueJob) => Promise<any>>();
  private statusCallbacks = new Map<string, (job: QueueJob) => void>();
  private progressCallbacks = new Map<
    string,
    (job: QueueJob, progress: QueueJob['progress']) => void
  >();

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrentJobs: 5,
      maxQueueSize: 100,
      jobTimeoutMs: 300000, // 5 minutes
      retryDelayMs: 5000,
      persistenceEnabled: true,
      monitoringEnabled: true,
      priorityWeights: {
        low: 1,
        medium: 2,
        high: 3,
        urgent: 4,
      },
      ...config,
    };

    this.metrics = this.initializeMetrics();
    this.startProcessing();
    this.startMonitoring();
  }

  private initializeMetrics(): QueueMetrics {
    return {
      totalJobs: 0,
      pendingJobs: 0,
      queuedJobs: 0,
      processingJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      cancelledJobs: 0,
      averageProcessingTime: 0,
      throughputPerMinute: 0,
      currentLoad: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Add a new job to the queue
   */
  addJob(job: Partial<QueueJob> & Pick<QueueJob, 'type' | 'payload'>): string {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue is full');
    }

    const jobId = job.id || this.generateJobId();
    const queueJob: QueueJob = {
      id: jobId,
      type: job.type,
      priority: job.priority || 'medium',
      status: 'pending',
      payload: job.payload,
      metadata: {
        userId: job.metadata?.userId,
        sessionId: job.metadata?.sessionId,
        submittedAt: new Date(),
        retryCount: 0,
        maxRetries: job.metadata?.maxRetries || 3,
        estimatedDuration: job.metadata?.estimatedDuration,
        tags: job.metadata?.tags || [],
        ...job.metadata,
      },
      progress: {
        current: 0,
        total: 100,
        stage: 'queued',
        message: 'Job added to queue',
        percentage: 0,
      },
    };

    this.jobs.set(jobId, queueJob);
    this.enqueueJob(queueJob);
    this.updateMetrics();

    console.log(`Job ${jobId} added to queue with priority ${queueJob.priority}`);
    return jobId;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): QueueJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs with optional filtering
   */
  getJobs(filter?: {
    status?: JobStatus[];
    type?: string[];
    priority?: JobPriority[];
    userId?: string;
  }): QueueJob[] {
    const allJobs = Array.from(this.jobs.values());

    if (!filter) return allJobs;

    return allJobs.filter((job) => {
      if (filter.status && !filter.status.includes(job.status)) return false;
      if (filter.type && !filter.type.includes(job.type)) return false;
      if (filter.priority && !filter.priority.includes(job.priority)) return false;
      if (filter.userId && job.metadata.userId !== filter.userId) return false;
      return true;
    });
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false; // Cannot cancel finished jobs
    }

    if (job.status === 'processing') {
      // Remove from processing set
      this.processingJobs.delete(jobId);
    } else if (job.status === 'queued') {
      // Remove from queue
      this.queue = this.queue.filter((qJob) => qJob.id !== jobId);
    }

    job.status = 'cancelled';
    job.metadata.completedAt = new Date();
    job.progress = {
      current: 0,
      total: 100,
      stage: 'cancelled',
      message: 'Job cancelled by user',
      percentage: 0,
    };

    this.notifyStatusChange(job);
    this.updateMetrics();

    console.log(`Job ${jobId} cancelled`);
    return true;
  }

  /**
   * Register a job processor function
   */
  registerProcessor(jobType: string, processor: (job: QueueJob) => Promise<any>): void {
    this.jobProcessors.set(jobType, processor);
    console.log(`Processor registered for job type: ${jobType}`);
  }

  /**
   * Register status change callback
   */
  onStatusChange(jobId: string, callback: (job: QueueJob) => void): void {
    this.statusCallbacks.set(jobId, callback);
  }

  /**
   * Register progress callback
   */
  onProgress(
    jobId: string,
    callback: (job: QueueJob, progress: QueueJob['progress']) => void
  ): void {
    this.progressCallbacks.set(jobId, callback);
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear completed jobs (for cleanup)
   */
  clearCompleted(): number {
    const completedJobs = Array.from(this.jobs.values()).filter(
      (job) => job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'
    );

    completedJobs.forEach((job) => {
      this.jobs.delete(job.id);
      this.statusCallbacks.delete(job.id);
      this.progressCallbacks.delete(job.id);
    });

    this.updateMetrics();
    return completedJobs.length;
  }

  /**
   * Private methods
   */
  private enqueueJob(job: QueueJob): void {
    job.status = 'queued';

    // Insert job in priority order
    const insertIndex = this.findInsertionIndex(job);
    this.queue.splice(insertIndex, 0, job);

    this.notifyStatusChange(job);
  }

  private findInsertionIndex(job: QueueJob): number {
    const jobWeight = this.config.priorityWeights[job.priority];

    for (let i = 0; i < this.queue.length; i++) {
      const queueJobWeight = this.config.priorityWeights[this.queue[i].priority];
      if (jobWeight > queueJobWeight) {
        return i;
      }
    }

    return this.queue.length;
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.isProcessing) {
      try {
        // Process jobs if we have capacity and jobs in queue
        if (this.processingJobs.size < this.config.maxConcurrentJobs && this.queue.length > 0) {
          const job = this.queue.shift();
          if (job) {
            this.processJob(job);
          }
        }

        // Small delay to prevent busy waiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error in queue processing loop:', error);
      }
    }
  }

  private async processJob(job: QueueJob): Promise<void> {
    const processor = this.jobProcessors.get(job.type);
    if (!processor) {
      this.failJob(job, `No processor registered for job type: ${job.type}`);
      return;
    }

    job.status = 'processing';
    job.metadata.startedAt = new Date();
    this.processingJobs.add(job.id);

    this.updateProgress(job, {
      current: 10,
      total: 100,
      stage: 'processing',
      message: 'Job processing started',
      percentage: 10,
    });

    this.notifyStatusChange(job);

    try {
      // Set timeout for job processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.config.jobTimeoutMs);
      });

      const processingPromise = processor(job);
      const result = await Promise.race([processingPromise, timeoutPromise]);

      // Job completed successfully
      job.status = 'completed';
      job.result = result;
      job.metadata.completedAt = new Date();
      job.metadata.processingTime =
        job.metadata.completedAt.getTime() - job.metadata.startedAt!.getTime();

      this.updateProgress(job, {
        current: 100,
        total: 100,
        stage: 'completed',
        message: 'Job completed successfully',
        percentage: 100,
      });

      console.log(`Job ${job.id} completed in ${job.metadata.processingTime}ms`);
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);

      // Check if we should retry
      if (job.metadata.retryCount < job.metadata.maxRetries) {
        job.metadata.retryCount++;
        job.status = 'queued';

        // Add back to queue with delay
        setTimeout(() => {
          this.enqueueJob(job);
        }, this.config.retryDelayMs);

        this.updateProgress(job, {
          current: 0,
          total: 100,
          stage: 'retrying',
          message: `Retrying job (attempt ${job.metadata.retryCount + 1}/${job.metadata.maxRetries + 1})`,
          percentage: 0,
        });
      } else {
        this.failJob(job, error.message);
      }
    } finally {
      this.processingJobs.delete(job.id);
      this.updateMetrics();
    }

    this.notifyStatusChange(job);
  }

  private failJob(job: QueueJob, error: string): void {
    job.status = 'failed';
    job.error = error;
    job.metadata.completedAt = new Date();

    if (job.metadata.startedAt) {
      job.metadata.processingTime =
        job.metadata.completedAt.getTime() - job.metadata.startedAt.getTime();
    }

    this.updateProgress(job, {
      current: 0,
      total: 100,
      stage: 'failed',
      message: `Job failed: ${error}`,
      percentage: 0,
    });

    console.log(`Job ${job.id} failed: ${error}`);
  }

  private updateProgress(job: QueueJob, progress: Partial<QueueJob['progress']>): void {
    job.progress = { ...job.progress!, ...progress };
    this.notifyProgressChange(job, job.progress);
  }

  private notifyStatusChange(job: QueueJob): void {
    const callback = this.statusCallbacks.get(job.id);
    if (callback) {
      callback(job);
    }
  }

  private notifyProgressChange(job: QueueJob, progress: QueueJob['progress']): void {
    const callback = this.progressCallbacks.get(job.id);
    if (callback && progress) {
      callback(job, progress);
    }
  }

  private updateMetrics(): void {
    const allJobs = Array.from(this.jobs.values());

    this.metrics = {
      totalJobs: allJobs.length,
      pendingJobs: allJobs.filter((j) => j.status === 'pending').length,
      queuedJobs: allJobs.filter((j) => j.status === 'queued').length,
      processingJobs: allJobs.filter((j) => j.status === 'processing').length,
      completedJobs: allJobs.filter((j) => j.status === 'completed').length,
      failedJobs: allJobs.filter((j) => j.status === 'failed').length,
      cancelledJobs: allJobs.filter((j) => j.status === 'cancelled').length,
      averageProcessingTime: this.calculateAverageProcessingTime(allJobs),
      throughputPerMinute: this.calculateThroughput(allJobs),
      currentLoad: (this.processingJobs.size / this.config.maxConcurrentJobs) * 100,
      lastUpdated: new Date(),
    };
  }

  private calculateAverageProcessingTime(jobs: QueueJob[]): number {
    const completedJobs = jobs.filter((j) => j.status === 'completed' && j.metadata.processingTime);
    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce(
      (sum, job) => sum + (job.metadata.processingTime || 0),
      0
    );
    return totalTime / completedJobs.length;
  }

  private calculateThroughput(jobs: QueueJob[]): number {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentCompleted = jobs.filter(
      (j) =>
        j.status === 'completed' && j.metadata.completedAt && j.metadata.completedAt >= oneMinuteAgo
    );

    return recentCompleted.length;
  }

  private startMonitoring(): void {
    if (!this.config.monitoringEnabled) return;

    setInterval(() => {
      this.updateMetrics();
      console.log(
        `[Queue Monitor] Jobs: ${this.metrics.processingJobs} processing, ${this.metrics.queuedJobs} queued, Load: ${this.metrics.currentLoad.toFixed(1)}%`
      );
    }, 60000); // Log every minute
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.isProcessing = false;
    console.log('Queue manager shutdown initiated');
  }
}

// Singleton instance
let queueManager: QueueManager | null = null;

export function getQueueManager(config?: Partial<QueueConfig>): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager(config);
  }
  return queueManager;
}

export default QueueManager;
