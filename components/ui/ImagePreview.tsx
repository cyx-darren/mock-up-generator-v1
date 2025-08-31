'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { formatFileSize } from './ImageDropzone';

export interface ImagePreviewData {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    size: number;
    type: string;
  };
}

interface ImagePreviewProps {
  images: ImagePreviewData[];
  onRemove: (id: string) => void;
  onCrop?: (id: string) => void;
  onResize?: (id: string) => void;
  showActions?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export function ImagePreview({
  images,
  onRemove,
  onCrop,
  onResize,
  showActions = true,
  showMetadata = true,
  className,
}: ImagePreviewProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {images.map((image) => (
        <ImagePreviewItem
          key={image.id}
          image={image}
          onRemove={onRemove}
          onCrop={onCrop}
          onResize={onResize}
          showActions={showActions}
          showMetadata={showMetadata}
        />
      ))}
    </div>
  );
}

interface ImagePreviewItemProps {
  image: ImagePreviewData;
  onRemove: (id: string) => void;
  onCrop?: (id: string) => void;
  onResize?: (id: string) => void;
  showActions: boolean;
  showMetadata: boolean;
}

function ImagePreviewItem({
  image,
  onRemove,
  onCrop,
  onResize,
  showActions,
  showMetadata,
}: ImagePreviewItemProps) {
  const [metadata, setMetadata] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load image metadata
  useEffect(() => {
    if (image.preview) {
      const img = new Image();
      img.onload = () => {
        setMetadata({ width: img.width, height: img.height });
      };
      img.src = image.preview;
    }
  }, [image.preview]);

  const getStatusColor = (status: ImagePreviewData['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: ImagePreviewData['status']) => {
    switch (status) {
      case 'uploading':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start space-x-4">
        {/* Image Preview */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
            <img
              ref={imgRef}
              src={image.preview}
              alt={image.file.name}
              className="w-full h-full object-cover"
              onError={() => {
                console.error('Failed to load image preview');
              }}
            />
          </div>
          
          {/* Status Overlay */}
          <div className={cn(
            'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium',
            {
              'bg-blue-500': image.status === 'uploading',
              'bg-green-500': image.status === 'completed',
              'bg-red-500': image.status === 'error',
            }
          )}>
            {getStatusIcon(image.status)}
          </div>
        </div>

        {/* Image Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {image.file.name}
              </p>
              
              {showMetadata && (
                <div className="mt-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>Size: {formatFileSize(image.file.size)}</p>
                  <p>Type: {image.file.type}</p>
                  {metadata && (
                    <p>Dimensions: {metadata.width} × {metadata.height}px</p>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {image.status === 'uploading' && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Uploading...</span>
                    <span>{Math.round(image.progress)}%</span>
                  </div>
                  <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${image.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {image.status === 'error' && image.error && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {image.error}
                </p>
              )}

              {/* Status */}
              <div className={cn('mt-1 flex items-center text-xs', getStatusColor(image.status))}>
                {getStatusIcon(image.status)}
                <span className="ml-1 capitalize">{image.status}</span>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-2 ml-2">
                {image.status === 'completed' && onCrop && (
                  <button
                    type="button"
                    onClick={() => onCrop(image.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Crop image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                )}

                {image.status === 'completed' && onResize && (
                  <button
                    type="button"
                    onClick={() => onResize(image.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Resize image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(image.id)}
                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}