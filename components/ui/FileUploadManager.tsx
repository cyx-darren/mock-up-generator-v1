'use client';

import React, { useState, useCallback, useRef } from 'react';
import { ImageDropzone, type FileValidationRule } from './ImageDropzone';
import { ImagePreview, type ImagePreviewData } from './ImagePreview';
import { ImageCropResize } from './ImageCropResize';
import { Alert } from './Alert';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface UploadError {
  file: File;
  errors: string[];
}

interface FileUploadManagerProps {
  onUploadComplete: (files: { file: File; url: string }[]) => void;
  onUploadProgress?: (progress: number) => void;
  validation?: FileValidationRule;
  multiple?: boolean;
  maxFiles?: number;
  uploadEndpoint?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  allowCrop?: boolean;
  allowResize?: boolean;
}

export function FileUploadManager({
  onUploadComplete,
  onUploadProgress,
  validation,
  multiple = true,
  maxFiles = 5,
  uploadEndpoint = '/api/upload',
  className,
  disabled = false,
  showPreview = true,
  allowCrop = true,
  allowResize = true,
}: FileUploadManagerProps) {
  const [images, setImages] = useState<ImagePreviewData[]>([]);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [cropImage, setCropImage] = useState<ImagePreviewData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate unique ID for files
  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  // Create preview URL for file
  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // Handle files accepted by dropzone
  const handleFilesAccepted = useCallback(
    (files: File[]) => {
      const newImages: ImagePreviewData[] = files.map((file) => ({
        file,
        id: generateId(),
        preview: createPreview(file),
        progress: 0,
        status: 'uploading' as const,
        metadata: {
          size: file.size,
          type: file.type,
        },
      }));

      setImages((prev) => [...prev, ...newImages]);
      setUploadErrors([]);

      // Start upload
      uploadFiles(newImages);
    },
    [generateId, createPreview]
  );

  // Handle files rejected by dropzone
  const handleFilesRejected = useCallback((rejections: { file: File; errors: string[] }[]) => {
    setUploadErrors(rejections);
  }, []);

  // Upload files to server
  const uploadFiles = useCallback(
    async (imagesToUpload: ImagePreviewData[]) => {
      setIsUploading(true);
      abortControllerRef.current = new AbortController();

      const uploadedFiles: { file: File; url: string }[] = [];
      const totalFiles = imagesToUpload.length;
      let completedFiles = 0;

      try {
        // Upload files concurrently with progress tracking
        const uploadPromises = imagesToUpload.map(async (image, index) => {
          try {
            const formData = new FormData();
            formData.append('file', image.file);
            formData.append('fileName', image.file.name);

            // Simulate upload with XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            return new Promise<void>((resolve, reject) => {
              xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                  const progress = (e.loaded / e.total) * 100;

                  // Update individual file progress
                  setImages((prev) =>
                    prev.map((img) => (img.id === image.id ? { ...img, progress } : img))
                  );

                  // Update overall progress
                  const totalProgress = (completedFiles * 100 + progress) / totalFiles;
                  setUploadProgress(totalProgress);
                  onUploadProgress?.(totalProgress);
                }
              });

              xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const response = JSON.parse(xhr.responseText);
                    uploadedFiles.push({ file: image.file, url: response.url });

                    // Mark as completed
                    setImages((prev) =>
                      prev.map((img) =>
                        img.id === image.id
                          ? { ...img, status: 'completed' as const, progress: 100 }
                          : img
                      )
                    );

                    completedFiles++;
                    const totalProgress = (completedFiles / totalFiles) * 100;
                    setUploadProgress(totalProgress);
                    onUploadProgress?.(totalProgress);

                    resolve();
                  } catch (error) {
                    reject(new Error('Invalid response from server'));
                  }
                } else {
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              });

              xhr.addEventListener('error', () => {
                reject(new Error('Network error occurred'));
              });

              xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
              });

              xhr.open('POST', uploadEndpoint);
              xhr.send(formData);

              // Store xhr reference for potential cancellation
              if (abortControllerRef.current) {
                abortControllerRef.current.signal.addEventListener('abort', () => {
                  xhr.abort();
                });
              }
            });
          } catch (error) {
            // Mark as error
            setImages((prev) =>
              prev.map((img) =>
                img.id === image.id
                  ? {
                      ...img,
                      status: 'error' as const,
                      error: error instanceof Error ? error.message : 'Upload failed',
                    }
                  : img
              )
            );
            throw error;
          }
        });

        await Promise.allSettled(uploadPromises);

        // Call completion handler with successful uploads
        if (uploadedFiles.length > 0) {
          onUploadComplete(uploadedFiles);
        }
      } catch (error) {
        console.error('Upload error:', error);
      } finally {
        setIsUploading(false);
        abortControllerRef.current = null;
      }
    },
    [uploadEndpoint, onUploadComplete, onUploadProgress]
  );

  // Cancel upload
  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUploading(false);
    setUploadProgress(0);

    // Reset uploading images
    setImages((prev) => prev.filter((img) => img.status !== 'uploading'));
  }, []);

  // Remove image
  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // Start crop
  const handleCropImage = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (image) {
        setCropImage(image);
      }
    },
    [images]
  );

  // Save cropped image
  const handleSaveCroppedImage = useCallback(
    (croppedBlob: Blob, fileName: string) => {
      if (!cropImage) return;

      const newFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });
      const newPreview = createPreview(newFile);

      // Update the image with cropped version
      setImages((prev) =>
        prev.map((img) =>
          img.id === cropImage.id
            ? {
                ...img,
                file: newFile,
                preview: newPreview,
                status: 'uploading' as const,
                progress: 0,
              }
            : img
        )
      );

      // Clean up old preview
      URL.revokeObjectURL(cropImage.preview);
      setCropImage(null);

      // Re-upload the cropped image
      const updatedImage = {
        ...cropImage,
        file: newFile,
        preview: newPreview,
        status: 'uploading' as const,
        progress: 0,
      };
      uploadFiles([updatedImage]);
    },
    [cropImage, createPreview, uploadFiles]
  );

  // Cancel crop
  const handleCancelCrop = useCallback(() => {
    setCropImage(null);
  }, []);

  // Retry failed upload
  const handleRetryUpload = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id);
      if (!image) return;

      const updatedImage = {
        ...image,
        status: 'uploading' as const,
        progress: 0,
        error: undefined,
      };
      setImages((prev) => prev.map((img) => (img.id === id ? updatedImage : img)));
      uploadFiles([updatedImage]);
    },
    [images, uploadFiles]
  );

  // Clear errors
  const handleClearErrors = useCallback(() => {
    setUploadErrors([]);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <Alert
          type="error"
          message={`${uploadErrors.length} file(s) rejected`}
          onClose={handleClearErrors}
        >
          <div className="mt-2 space-y-1">
            {uploadErrors.map((error, index) => (
              <div key={index} className="text-sm">
                <strong>{error.file.name}:</strong> {error.errors.join(', ')}
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Uploading files...
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {Math.round(uploadProgress)}%
              </span>
              <Button size="sm" variant="outline" onClick={handleCancelUpload}>
                Cancel
              </Button>
            </div>
          </div>
          <div className="bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Dropzone */}
      <ImageDropzone
        onFilesAccepted={handleFilesAccepted}
        onFilesRejected={handleFilesRejected}
        validation={validation}
        multiple={multiple}
        disabled={disabled || isUploading}
      />

      {/* Image Preview */}
      {showPreview && images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Uploaded Images ({images.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                images.forEach((img) => URL.revokeObjectURL(img.preview));
                setImages([]);
              }}
              disabled={isUploading}
            >
              Clear All
            </Button>
          </div>

          <ImagePreview
            images={images}
            onRemove={handleRemoveImage}
            onCrop={allowCrop ? handleCropImage : undefined}
            showActions={!isUploading}
            showMetadata={true}
          />

          {/* Failed uploads with retry option */}
          {images.some((img) => img.status === 'error') && (
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <span className="text-sm text-red-800 dark:text-red-200">
                Some uploads failed. You can retry individual uploads by clicking the retry button
                on each failed image.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Crop Modal */}
      {cropImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Crop Image: {cropImage.file.name}
              </h3>
              <ImageCropResize
                imageSrc={cropImage.preview}
                fileName={cropImage.file.name}
                onSave={handleSaveCroppedImage}
                onCancel={handleCancelCrop}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
