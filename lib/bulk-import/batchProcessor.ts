export interface BatchJob {
  id: string;
  productSku: string;
  files: {
    name: string;
    data: Buffer;
    type: string;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  results?: {
    uploaded: string[];
    failed: string[];
  };
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  overallProgress: number;
}

export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map();
  private processing = false;
  private concurrentLimit = 3; // Process 3 jobs simultaneously
  private activeJobs = new Set<string>();
  private progressCallback?: (progress: BatchProgress) => void;

  constructor(concurrentLimit = 3) {
    this.concurrentLimit = concurrentLimit;
  }

  addJobs(jobs: BatchJob[]): void {
    jobs.forEach(job => {
      this.jobs.set(job.id, job);
    });
  }

  addJob(job: BatchJob): void {
    this.jobs.set(job.id, job);
  }

  setProgressCallback(callback: (progress: BatchProgress) => void): void {
    this.progressCallback = callback;
  }

  async start(): Promise<void> {
    if (this.processing) {
      throw new Error('Batch processor is already running');
    }

    this.processing = true;
    await this.processJobs();
    this.processing = false;
  }

  private async processJobs(): Promise<void> {
    const pendingJobs = Array.from(this.jobs.values()).filter(job => job.status === 'pending');
    
    // Process jobs with concurrency limit
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < Math.min(pendingJobs.length, this.concurrentLimit); i++) {
      promises.push(this.processNextJob());
    }

    await Promise.all(promises);
  }

  private async processNextJob(): Promise<void> {
    while (this.processing) {
      const job = this.getNextPendingJob();
      if (!job) {
        break; // No more jobs to process
      }

      this.activeJobs.add(job.id);
      job.status = 'processing';
      job.startTime = new Date();
      job.progress = 0;
      
      this.updateProgress();

      try {
        await this.processJob(job);
        job.status = 'completed';
        job.progress = 100;
        job.endTime = new Date();
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = new Date();
      } finally {
        this.activeJobs.delete(job.id);
        this.updateProgress();
      }
    }
  }

  private getNextPendingJob(): BatchJob | null {
    for (const job of this.jobs.values()) {
      if (job.status === 'pending') {
        return job;
      }
    }
    return null;
  }

  private async processJob(job: BatchJob): Promise<void> {
    const results = {
      uploaded: [],
      failed: []
    };

    job.results = results;
    const totalFiles = job.files.length;
    const maxRetries = 3;

    // Process each file for this product
    for (let i = 0; i < job.files.length; i++) {
      const file = job.files[i];
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          // Update progress
          job.progress = Math.round((i / totalFiles) * 100);
          this.updateProgress();

          // Upload file to Supabase Storage with retry logic
          const uploadResult = await this.uploadFileWithRetry(job.productSku, file, retryCount);
          
          if (uploadResult.success) {
            results.uploaded.push(uploadResult.url);
            
            // Update product with new image URL
            await this.updateProductImagesWithRetry(job.productSku, uploadResult.url, file.type, retryCount);
            success = true;
          } else {
            retryCount++;
            if (retryCount >= maxRetries) {
              results.failed.push(`${file.name}: ${uploadResult.error} (after ${maxRetries} attempts)`);
            } else {
              // Wait before retry with exponential backoff
              await this.delay(1000 * Math.pow(2, retryCount - 1));
            }
          }

        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            results.failed.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'} (after ${maxRetries} attempts)`);
          } else {
            // Wait before retry with exponential backoff
            await this.delay(1000 * Math.pow(2, retryCount - 1));
          }
        }
      }
    }

    // Final progress update
    job.progress = 100;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async uploadFileWithRetry(productSku: string, file: { name: string; data: Buffer; type: string }, attempt: number): Promise<{ success: boolean; url?: string; error?: string }> {
    return this.uploadFile(productSku, file);
  }

  private async updateProductImagesWithRetry(productSku: string, imageUrl: string, imageType: string, attempt: number): Promise<void> {
    return this.updateProductImages(productSku, imageUrl, imageType);
  }

  private async uploadFile(productSku: string, file: { name: string; data: Buffer; type: string }): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${productSku}_${timestamp}.${extension}`;
      
      // Upload to Supabase Storage (gift-items bucket)
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();
      
      const { data, error } = await supabase.storage
        .from('gift-items')
        .upload(`bulk-upload/${filename}`, file.data, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gift-items')
        .getPublicUrl(`bulk-upload/${filename}`);

      return { success: true, url: urlData.publicUrl };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  private async updateProductImages(productSku: string, imageUrl: string, imageType: string): Promise<void> {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();

      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('gift_items')
        .select('additional_images, primary_image_url, thumbnail_url')
        .eq('sku', productSku)
        .single();

      if (fetchError || !product) {
        throw new Error(`Product not found: ${productSku}`);
      }

      // Update additional_images array
      const currentImages = Array.isArray(product.additional_images) ? product.additional_images : [];
      const updatedImages = [...currentImages, imageUrl];

      // Decide where to place the image based on what's missing
      const updates: any = { additional_images: updatedImages };

      // If no primary image, use this as primary
      if (!product.primary_image_url) {
        updates.primary_image_url = imageUrl;
        updates.base_image_url = imageUrl; // Required field
      }

      // If no thumbnail, use this as thumbnail
      if (!product.thumbnail_url) {
        updates.thumbnail_url = imageUrl;
      }

      // Update the product
      const { error: updateError } = await supabase
        .from('gift_items')
        .update(updates)
        .eq('sku', productSku);

      if (updateError) {
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

    } catch (error) {
      console.error(`Failed to update product ${productSku}:`, error);
      throw error;
    }
  }

  private updateProgress(): void {
    if (this.progressCallback) {
      const progress = this.getProgress();
      this.progressCallback(progress);
    }
  }

  getProgress(): BatchProgress {
    const jobs = Array.from(this.jobs.values());
    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const failed = jobs.filter(job => job.status === 'failed').length;
    const processing = jobs.filter(job => job.status === 'processing').length;
    const pending = jobs.filter(job => job.status === 'pending').length;

    return {
      total,
      completed,
      failed,
      processing,
      pending,
      overallProgress: total > 0 ? Math.round(((completed + failed) / total) * 100) : 0
    };
  }

  getJob(id: string): BatchJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  stop(): void {
    this.processing = false;
  }

  clear(): void {
    this.jobs.clear();
    this.activeJobs.clear();
    this.processing = false;
  }
}