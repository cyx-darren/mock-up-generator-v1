'use client';

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// File upload configuration
const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/svg+xml': ['.svg'],
  'image/webp': ['.webp'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

// Upload status types
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'completed'
  | 'error'
  | 'cancelled'
  | 'paused'
  | 'retrying';

// Error types for better error handling
export type ErrorType =
  | 'file_type'
  | 'file_size'
  | 'network'
  | 'server'
  | 'duplicate'
  | 'limit_exceeded'
  | 'unknown';

export interface UploadError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
  details?: any;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  startTime: number;
  lastUpdate: number;
}

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  progressDetails?: UploadProgress;
  error?: string;
  errorDetails?: UploadError;
  previewUrl?: string;
  uploadController?: AbortController;
  retryCount?: number;
  maxRetries?: number;
}

interface FileUploadProps {
  onFilesAdded?: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number, progressDetails?: UploadProgress) => void;
  onUploadComplete?: (fileId: string, result: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  onUploadPaused?: (fileId: string) => void;
  onUploadResumed?: (fileId: string) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
  uploadEndpoint?: string;
}

export function FileUpload({
  onFilesAdded,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onUploadPaused,
  onUploadResumed,
  maxFiles = MAX_FILES,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes = ACCEPTED_TYPES,
  multiple = true,
  uploadEndpoint = '/api/upload',
  className,
}: FileUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }, []);

  // Create preview URL for images
  const createPreviewUrl = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  // Validate file type
  const validateFileType = useCallback(
    (file: File): boolean => {
      return Object.keys(acceptedTypes).includes(file.type);
    },
    [acceptedTypes]
  );

  // Validate file size
  const validateFileSize = useCallback(
    (file: File): boolean => {
      return file.size <= maxSize;
    },
    [maxSize]
  );

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Helper function to format upload speed
  const formatSpeed = useCallback((bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  // Helper function to format time remaining
  const formatTimeRemaining = useCallback((seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  // Create error object with user-friendly messages
  const createError = useCallback(
    (type: ErrorType, details?: any): UploadError => {
      const errorMessages: Record<ErrorType, string> = {
        file_type: 'This file type is not supported. Please upload PNG, JPG, SVG, or WebP files.',
        file_size: `File is too large. Maximum size allowed is ${formatFileSize(maxSize)}.`,
        network: 'Network connection error. Please check your internet connection and try again.',
        server:
          'Server error occurred. Please try again later or contact support if the issue persists.',
        duplicate: 'This file has already been added to the upload queue.',
        limit_exceeded: `Maximum ${maxFiles} files can be uploaded at once.`,
        unknown: 'An unexpected error occurred. Please try again.',
      };

      return {
        type,
        message: errorMessages[type],
        retryable: ['network', 'server', 'unknown'].includes(type),
        details,
      };
    },
    [maxFiles, maxSize, formatFileSize]
  );

  // Log errors for debugging
  const logError = useCallback((fileId: string, error: UploadError) => {
    console.error(`[FileUpload] Error for file ${fileId}:`, {
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    });

    // You could also send this to an error tracking service
    // sendToErrorTracking(error);
  }, []);

  // Process selected files
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Check total file count
      if (uploadFiles.length + fileArray.length > maxFiles) {
        errors.push(
          `Maximum ${maxFiles} files allowed. Currently have ${uploadFiles.length} files.`
        );
        return;
      }

      // Validate each file with enhanced error handling
      fileArray.forEach((file) => {
        let fileError: UploadError | null = null;

        if (!validateFileType(file)) {
          fileError = createError('file_type', {
            fileName: file.name,
            fileType: file.type,
            acceptedTypes: Object.keys(acceptedTypes),
          });
        } else if (!validateFileSize(file)) {
          fileError = createError('file_size', {
            fileName: file.name,
            fileSize: file.size,
            maxSize: maxSize,
          });
        } else {
          // Check for duplicates
          const isDuplicate = uploadFiles.some(
            (uploadFile) => uploadFile.file.name === file.name && uploadFile.file.size === file.size
          );

          if (isDuplicate) {
            fileError = createError('duplicate', {
              fileName: file.name,
              fileSize: file.size,
            });
          }
        }

        if (fileError) {
          errors.push(`${file.name}: ${fileError.message}`);
          logError('validation', fileError);
          return;
        }

        validFiles.push(file);
      });

      if (errors.length > 0) {
        // Show errors to user
        console.error('File validation errors:', errors);
        return;
      }

      // Add valid files to upload queue
      const newUploadFiles: UploadFile[] = validFiles.map((file) => ({
        id: generateFileId(),
        file,
        status: 'idle' as UploadStatus,
        progress: 0,
        previewUrl: createPreviewUrl(file),
      }));

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);
      onFilesAdded?.(validFiles);
    },
    [
      uploadFiles,
      maxFiles,
      validateFileType,
      validateFileSize,
      acceptedTypes,
      maxSize,
      formatFileSize,
      generateFileId,
      createPreviewUrl,
      onFilesAdded,
    ]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFiles]
  );

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Create progress details
  const createProgressDetails = useCallback(
    (loaded: number, total: number, startTime: number): UploadProgress => {
      const now = Date.now();
      const timeElapsed = (now - startTime) / 1000; // seconds
      const percentage = (loaded / total) * 100;
      const speed = timeElapsed > 0 ? loaded / timeElapsed : 0; // bytes per second
      const remainingBytes = total - loaded;
      const timeRemaining = speed > 0 ? remainingBytes / speed : 0; // seconds

      return {
        loaded,
        total,
        percentage: Math.min(100, Math.max(0, percentage)),
        speed,
        timeRemaining,
        startTime,
        lastUpdate: now,
      };
    },
    []
  );

  // Upload file with enhanced error handling and retry mechanism
  const uploadFile = useCallback(
    async (fileId: string, isRetry: boolean = false) => {
      const file = uploadFiles.find((f) => f.id === fileId);
      if (!file || (file.status !== 'idle' && !isRetry)) return;

      const controller = new AbortController();
      const startTime = Date.now();
      const currentRetryCount = file.retryCount || 0;
      const maxRetries = file.maxRetries || 3;

      // Update file status and add controller
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: isRetry ? 'retrying' : 'uploading',
                uploadController: controller,
                retryCount: currentRetryCount,
              }
            : f
        )
      );

      try {
        const formData = new FormData();
        formData.append('file', file.file);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            // Add retry headers for debugging
            'X-Retry-Count': currentRetryCount.toString(),
          },
        });

        if (!response.ok) {
          const errorType: ErrorType =
            response.status >= 500
              ? 'server'
              : response.status === 413
                ? 'file_size'
                : response.status >= 400
                  ? 'server'
                  : 'network';
          throw new Error(
            JSON.stringify({
              type: errorType,
              status: response.status,
              message: response.statusText,
            })
          );
        }

        // Simulate progress updates for demonstration
        let loaded = 0;
        const total = file.file.size;
        const progressInterval = setInterval(() => {
          loaded = Math.min(total, loaded + total * 0.1); // 10% increments
          const progressDetails = createProgressDetails(loaded, total, startTime);

          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    progress: progressDetails.percentage,
                    progressDetails,
                  }
                : f
            )
          );

          onUploadProgress?.(fileId, progressDetails.percentage, progressDetails);

          if (loaded >= total) {
            clearInterval(progressInterval);
            // Mark as completed
            setUploadFiles((prev) =>
              prev.map((f) => (f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f))
            );
            onUploadComplete?.(fileId, { success: true });
          }
        }, 200);
      } catch (error) {
        if (error.name === 'AbortError') {
          setUploadFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: 'cancelled' } : f))
          );
          return;
        }

        // Parse error details
        let errorDetails: UploadError;
        try {
          const parsedError = JSON.parse(error.message);
          errorDetails = createError(parsedError.type, {
            status: parsedError.status,
            originalMessage: parsedError.message,
          });
        } catch {
          // Network or other errors
          const isNetworkError = !navigator.onLine || error.message.includes('fetch');
          errorDetails = createError(isNetworkError ? 'network' : 'unknown', {
            originalError: error.message,
          });
        }

        // Log the error
        logError(fileId, errorDetails);

        // Check if we should retry
        if (errorDetails.retryable && currentRetryCount < maxRetries) {
          setTimeout(
            () => {
              uploadFile(fileId, true);
            },
            Math.pow(2, currentRetryCount) * 1000
          ); // Exponential backoff

          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'idle',
                    retryCount: currentRetryCount + 1,
                    errorDetails,
                  }
                : f
            )
          );
          return;
        }

        // Final error state
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'error',
                  error: errorDetails.message,
                  errorDetails,
                }
              : f
          )
        );
        onUploadError?.(fileId, errorDetails.message);
      }
    },
    [
      uploadFiles,
      uploadEndpoint,
      createProgressDetails,
      onUploadProgress,
      onUploadComplete,
      onUploadError,
    ]
  );

  // Pause upload
  const pauseUpload = useCallback(
    (fileId: string) => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === 'uploading') {
            file.uploadController?.abort();
            onUploadPaused?.(fileId);
            return { ...file, status: 'paused' };
          }
          return file;
        })
      );
    },
    [onUploadPaused]
  );

  // Resume upload
  const resumeUpload = useCallback(
    (fileId: string) => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === 'paused') {
            onUploadResumed?.(fileId);
            return { ...file, status: 'idle' };
          }
          return file;
        })
      );
      // Restart the upload
      setTimeout(() => uploadFile(fileId), 100);
    },
    [onUploadResumed, uploadFile]
  );

  // Retry upload with reset retry count
  const retryUpload = useCallback(
    (fileId: string) => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.id === fileId && file.status === 'error') {
            return {
              ...file,
              status: 'idle',
              retryCount: 0,
              error: undefined,
              errorDetails: undefined,
            };
          }
          return file;
        })
      );
      // Start the upload
      setTimeout(() => uploadFile(fileId), 100);
    },
    [uploadFile]
  );

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    setUploadFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          file.uploadController?.abort();
          return { ...file, status: 'cancelled' as UploadStatus };
        }
        return file;
      })
    );
  }, []);

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setUploadFiles((prev) => {
      const updatedFiles = prev.filter((file) => file.id !== fileId);
      // Cleanup preview URLs
      const fileToRemove = prev.find((file) => file.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return updatedFiles;
    });
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    // Cleanup all preview URLs
    uploadFiles.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setUploadFiles([]);
  }, [uploadFiles]);

  // Get accepted file types for input
  const getAcceptString = useCallback(() => {
    return Object.values(acceptedTypes).flat().join(',');
  }, [acceptedTypes]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptString()}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragging ? 'Drop files here' : 'Upload your logo files'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Drag & drop files here or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Supported formats: PNG, JPG, SVG, WebP</p>
            <p>Maximum file size: {formatFileSize(maxSize)}</p>
            <p>Maximum files: {maxFiles}</p>
          </div>

          <Button onClick={openFileDialog} variant="outline" className="mt-4">
            Choose Files
          </Button>
        </div>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Upload Queue ({uploadFiles.length}/{maxFiles})
            </h4>
            <Button onClick={clearAll} variant="outline" size="sm">
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {uploadFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* File Preview */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  {fileItem.previewUrl ? (
                    <img
                      src={fileItem.previewUrl}
                      alt={fileItem.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(fileItem.file.size)} • {fileItem.file.type}
                  </p>

                  {/* Progress Bar with Enhanced Details */}
                  {(fileItem.status === 'uploading' || fileItem.status === 'paused') && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            fileItem.status === 'uploading' ? 'bg-blue-600' : 'bg-yellow-500'
                          )}
                          style={{ width: `${fileItem.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(fileItem.progress)}%
                          {fileItem.status === 'paused' ? ' (Paused)' : ''}
                        </span>
                        {fileItem.progressDetails && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatSpeed(fileItem.progressDetails.speed)}
                          </span>
                        )}
                      </div>
                      {fileItem.progressDetails && fileItem.progressDetails.timeRemaining > 0 && (
                        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                          <span>
                            {formatFileSize(fileItem.progressDetails.loaded)} of{' '}
                            {formatFileSize(fileItem.progressDetails.total)}
                          </span>
                          <span>
                            {formatTimeRemaining(fileItem.progressDetails.timeRemaining)} remaining
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Message with Enhanced Details */}
                  {fileItem.status === 'error' && fileItem.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                        {fileItem.error}
                      </p>
                      {fileItem.errorDetails?.retryable && (
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {fileItem.retryCount
                              ? `Tried ${fileItem.retryCount} time(s)`
                              : 'Click retry to try again'}
                          </p>
                          <button
                            onClick={() => retryUpload(fileItem.id)}
                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300 rounded transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Retry Status */}
                  {fileItem.status === 'retrying' && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Retrying... (Attempt {(fileItem.retryCount || 0) + 1})
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Icon and Actions */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  {fileItem.status === 'idle' && (
                    <button
                      onClick={() => uploadFile(fileItem.id)}
                      className="w-6 h-6 text-blue-500 hover:text-blue-600"
                      title="Start upload"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                      </svg>
                    </button>
                  )}

                  {fileItem.status === 'uploading' && (
                    <>
                      <button
                        onClick={() => pauseUpload(fileItem.id)}
                        className="w-6 h-6 text-yellow-500 hover:text-yellow-600"
                        title="Pause upload"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => cancelUpload(fileItem.id)}
                        className="w-6 h-6 text-red-500 hover:text-red-600"
                        title="Cancel upload"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                        </svg>
                      </button>
                    </>
                  )}

                  {fileItem.status === 'paused' && (
                    <>
                      <button
                        onClick={() => resumeUpload(fileItem.id)}
                        className="w-6 h-6 text-green-500 hover:text-green-600"
                        title="Resume upload"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => cancelUpload(fileItem.id)}
                        className="w-6 h-6 text-red-500 hover:text-red-600"
                        title="Cancel upload"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                        </svg>
                      </button>
                    </>
                  )}

                  {fileItem.status === 'completed' && (
                    <div className="w-6 h-6 text-green-500">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z" />
                      </svg>
                    </div>
                  )}

                  {fileItem.status === 'error' && (
                    <>
                      <div className="w-6 h-6 text-red-500" title="Upload failed">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                        </svg>
                      </div>
                      {fileItem.errorDetails?.retryable && (
                        <button
                          onClick={() => retryUpload(fileItem.id)}
                          className="w-6 h-6 text-orange-500 hover:text-orange-600"
                          title="Retry upload"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,4V2C12,1.45 11.55,1 11,1C10.45,1 10,1.45 10,1.45L8.59,2.86C8.21,3.24 8.21,3.86 8.59,4.24L11.29,6.94C11.68,7.32 12.32,7.32 12.71,6.94C13.1,6.55 13.1,5.91 12.71,5.53L12,4.82V6C16.42,6 20,9.58 20,14C20,18.42 16.42,22 12,22C7.58,22 4,18.42 4,14C4,12.81 4.28,11.69 4.78,10.69C5.05,10.15 4.85,9.47 4.31,9.2C3.77,8.93 3.09,9.13 2.82,9.67C2.16,11.04 1.8,12.58 1.8,14.2C1.8,19.62 6.18,24 11.6,24S21.4,19.62 21.4,14.2C21.4,8.78 17.02,4.4 11.6,4.4V4Z" />
                          </svg>
                        </button>
                      )}
                    </>
                  )}

                  {fileItem.status === 'retrying' && (
                    <div className="w-6 h-6 text-orange-500 animate-spin" title="Retrying...">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4V2C12,1.45 11.55,1 11,1C10.45,1 10,1.45 10,1.45L8.59,2.86C8.21,3.24 8.21,3.86 8.59,4.24L11.29,6.94C11.68,7.32 12.32,7.32 12.71,6.94C13.1,6.55 13.1,5.91 12.71,5.53L12,4.82V6C16.42,6 20,9.58 20,14C20,18.42 16.42,22 12,22C7.58,22 4,18.42 4,14C4,12.81 4.28,11.69 4.78,10.69C5.05,10.15 4.85,9.47 4.31,9.2C3.77,8.93 3.09,9.13 2.82,9.67C2.16,11.04 1.8,12.58 1.8,14.2C1.8,19.62 6.18,24 11.6,24S21.4,19.62 21.4,14.2C21.4,8.78 17.02,4.4 11.6,4.4V4Z" />
                      </svg>
                    </div>
                  )}

                  {fileItem.status === 'cancelled' && (
                    <div className="w-6 h-6 text-yellow-500" title="Cancelled">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
                      </svg>
                    </div>
                  )}

                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="w-6 h-6 text-gray-400 hover:text-red-500"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
