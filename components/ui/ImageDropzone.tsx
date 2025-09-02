'use client';

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface FileValidationRule {
  maxSize?: number; // in bytes
  minSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  allowedExtensions?: string[]; // file extensions
  maxFiles?: number;
}

export interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ImageDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  onFilesRejected?: (rejections: { file: File; errors: string[] }[]) => void;
  validation?: FileValidationRule;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  acceptedFormats?: string;
  maxFileDisplay?: string;
  children?: React.ReactNode;
}

const DEFAULT_VALIDATION: FileValidationRule = {
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 1024, // 1KB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFiles: 5,
};

export function ImageDropzone({
  onFilesAccepted,
  onFilesRejected,
  validation = DEFAULT_VALIDATION,
  multiple = true,
  disabled = false,
  className,
  acceptedFormats = 'JPEG, PNG, GIF, WebP',
  maxFileDisplay = '10MB',
  children,
}: ImageDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string[] => {
      const errors: string[] = [];
      const rules = { ...DEFAULT_VALIDATION, ...validation };

      // Check file size
      if (rules.maxSize && file.size > rules.maxSize) {
        errors.push(`File size must be less than ${formatFileSize(rules.maxSize)}`);
      }
      if (rules.minSize && file.size < rules.minSize) {
        errors.push(`File size must be at least ${formatFileSize(rules.minSize)}`);
      }

      // Check file type
      if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`);
      }

      // Check file extension
      if (rules.allowedExtensions) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!rules.allowedExtensions.includes(extension)) {
          errors.push(`File extension ${extension} is not allowed`);
        }
      }

      return errors;
    },
    [validation]
  );

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const rules = { ...DEFAULT_VALIDATION, ...validation };

      // Check max files limit
      if (rules.maxFiles && files.length > rules.maxFiles) {
        const error = `Maximum ${rules.maxFiles} files allowed`;
        if (onFilesRejected) {
          onFilesRejected(files.map((file) => ({ file, errors: [error] })));
        }
        return;
      }

      const acceptedFiles: File[] = [];
      const rejectedFiles: { file: File; errors: string[] }[] = [];

      files.forEach((file) => {
        const errors = validateFile(file);
        if (errors.length === 0) {
          acceptedFiles.push(file);
        } else {
          rejectedFiles.push({ file, errors });
        }
      });

      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }

      if (rejectedFiles.length > 0 && onFilesRejected) {
        onFilesRejected(rejectedFiles);
      }
    },
    [validation, validateFile, onFilesAccepted, onFilesRejected]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      setIsDragActive(true);

      // Check if dragged items are valid
      const items = Array.from(e.dataTransfer.items);
      const hasInvalidItems = items.some((item) => {
        if (item.kind !== 'file') return true;
        const rules = { ...DEFAULT_VALIDATION, ...validation };
        return rules.allowedTypes && !rules.allowedTypes.includes(item.type);
      });

      setIsDragReject(hasInvalidItems);
    },
    [disabled, validation]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if we're leaving the dropzone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
      setIsDragReject(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragActive(false);
      setIsDragReject(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      const files = e.target.files;
      if (files) {
        processFiles(files);
      }

      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [disabled, processFiles]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [disabled, handleClick]
  );

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
        {
          'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500':
            !isDragActive && !isDragReject && !disabled,
          'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950':
            isDragActive && !isDragReject && !disabled,
          'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950': isDragReject && !disabled,
          'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed':
            disabled,
        },
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Upload images. ${acceptedFormats} files up to ${maxFileDisplay} each${multiple ? '' : '. Single file only'}.`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={validation?.allowedTypes?.join(',') || DEFAULT_VALIDATION.allowedTypes?.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {children || (
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="mx-auto w-12 h-12">
            {isDragReject ? (
              <svg
                className="w-full h-full text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-full h-full text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            )}
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            {isDragActive ? (
              <p
                className={cn(
                  'text-lg font-medium',
                  isDragReject
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                )}
              >
                {isDragReject ? 'Invalid file type!' : 'Drop files here...'}
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {disabled ? 'Upload disabled' : 'Drop images here or click to browse'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {acceptedFormats} up to {maxFileDisplay} each
                  {multiple && validation?.maxFiles && ` (max ${validation.maxFiles} files)`}
                </p>
              </>
            )}
          </div>

          {/* Browse Button */}
          {!disabled && (
            <div className="pt-2">
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Browse Files
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { formatFileSize };
