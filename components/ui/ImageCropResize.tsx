'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/lib/utils';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropResizeProps {
  imageSrc: string;
  fileName: string;
  onSave: (croppedImage: Blob, fileName: string) => void;
  onCancel: () => void;
  aspectRatios?: { label: string; value: number | null }[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Landscape (4:3)', value: 4 / 3 },
  { label: 'Portrait (3:4)', value: 3 / 4 },
  { label: 'Wide (16:9)', value: 16 / 9 },
];

export function ImageCropResize({
  imageSrc,
  fileName,
  onSave,
  onCancel,
  aspectRatios = DEFAULT_ASPECT_RATIOS,
  maxWidth = 2048,
  maxHeight = 2048,
  quality = 0.8,
}: ImageCropResizeProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(null);
  const [resizeMode, setResizeMode] = useState<'crop' | 'resize'>('crop');
  const [resizeDimensions, setResizeDimensions] = useState({ width: 0, height: 0 });
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setResizeDimensions({ width: img.naturalWidth, height: img.naturalHeight });

      // Initialize crop area to center 80% of image
      const margin = 0.1;
      setCropArea({
        x: img.naturalWidth * margin,
        y: img.naturalHeight * margin,
        width: img.naturalWidth * (1 - 2 * margin),
        height: img.naturalHeight * (1 - 2 * margin),
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image and crop overlay
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit container while maintaining aspect ratio
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = 400;
    const scale = Math.min(
      containerWidth / image.naturalWidth,
      containerHeight / image.naturalHeight
    );

    canvas.width = image.naturalWidth * scale;
    canvas.height = image.naturalHeight * scale;

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw crop overlay if in crop mode
    if (resizeMode === 'crop') {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear crop area
      const scaledCrop = {
        x: cropArea.x * scale,
        y: cropArea.y * scale,
        width: cropArea.width * scale,
        height: cropArea.height * scale,
      };

      ctx.clearRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        scaledCrop.x,
        scaledCrop.y,
        scaledCrop.width,
        scaledCrop.height
      );

      // Draw crop border
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);

      // Draw corner handles
      const handleSize = 8;
      const corners = [
        { x: scaledCrop.x, y: scaledCrop.y },
        { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y },
        { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height },
        { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height },
      ];

      ctx.fillStyle = '#3B82F6';
      corners.forEach((corner) => {
        ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
      });
    }
  }, [image, cropArea, resizeMode]);

  // Handle mouse events for cropping
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (resizeMode !== 'crop' || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDragging(true);
      setDragStart({ x, y });
    },
    [resizeMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || resizeMode !== 'crop' || !canvasRef.current || !image) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const scale = Math.min(
        canvasRef.current.width / image.naturalWidth,
        canvasRef.current.height / image.naturalHeight
      );

      const deltaX = (x - dragStart.x) / scale;
      const deltaY = (y - dragStart.y) / scale;

      setCropArea((prev) => {
        let newWidth = Math.max(50, prev.width + deltaX);
        let newHeight = Math.max(50, prev.height + deltaY);

        // Apply aspect ratio constraint
        if (selectedAspectRatio) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / selectedAspectRatio;
          } else {
            newWidth = newHeight * selectedAspectRatio;
          }
        }

        // Keep within image bounds
        const newX = Math.max(0, Math.min(prev.x, image.naturalWidth - newWidth));
        const newY = Math.max(0, Math.min(prev.y, image.naturalHeight - newHeight));

        return {
          x: newX,
          y: newY,
          width: Math.min(newWidth, image.naturalWidth - newX),
          height: Math.min(newHeight, image.naturalHeight - newY),
        };
      });

      setDragStart({ x, y });
    },
    [isDragging, resizeMode, dragStart, selectedAspectRatio, image]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (ratio: number | null) => {
      setSelectedAspectRatio(ratio);

      if (ratio && image) {
        setCropArea((prev) => {
          const centerX = prev.x + prev.width / 2;
          const centerY = prev.y + prev.height / 2;

          let newWidth = prev.width;
          let newHeight = newWidth / ratio;

          // If height exceeds image bounds, adjust width
          if (newHeight > image.naturalHeight) {
            newHeight = image.naturalHeight;
            newWidth = newHeight * ratio;
          }

          return {
            x: Math.max(0, Math.min(centerX - newWidth / 2, image.naturalWidth - newWidth)),
            y: Math.max(0, Math.min(centerY - newHeight / 2, image.naturalHeight - newHeight)),
            width: newWidth,
            height: newHeight,
          };
        });
      }
    },
    [image]
  );

  // Handle resize dimension change
  const handleResizeDimensionChange = useCallback(
    (dimension: 'width' | 'height', value: number) => {
      if (!image) return;

      setResizeDimensions((prev) => {
        const newDimensions = { ...prev, [dimension]: value };

        if (maintainAspectRatio) {
          const aspectRatio = image.naturalWidth / image.naturalHeight;
          if (dimension === 'width') {
            newDimensions.height = Math.round(value / aspectRatio);
          } else {
            newDimensions.width = Math.round(value * aspectRatio);
          }
        }

        return newDimensions;
      });
    },
    [image, maintainAspectRatio]
  );

  // Generate final image
  const handleSave = useCallback(async () => {
    if (!image) return;

    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      if (resizeMode === 'crop') {
        // Crop mode
        canvas.width = Math.min(cropArea.width, maxWidth);
        canvas.height = Math.min(cropArea.height, maxHeight);

        const scale = Math.min(maxWidth / cropArea.width, maxHeight / cropArea.height, 1);

        canvas.width = cropArea.width * scale;
        canvas.height = cropArea.height * scale;

        ctx.drawImage(
          image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else {
        // Resize mode
        canvas.width = Math.min(resizeDimensions.width, maxWidth);
        canvas.height = Math.min(resizeDimensions.height, maxHeight);

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      }

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onSave(blob, fileName);
          }
          setLoading(false);
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      console.error('Error processing image:', error);
      setLoading(false);
    }
  }, [
    image,
    resizeMode,
    cropArea,
    resizeDimensions,
    maxWidth,
    maxHeight,
    quality,
    fileName,
    onSave,
  ]);

  if (!image) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="flex items-center space-x-4">
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          <button
            onClick={() => setResizeMode('crop')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              resizeMode === 'crop'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            Crop
          </button>
          <button
            onClick={() => setResizeMode('resize')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              resizeMode === 'resize'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            Resize
          </button>
        </div>
      </div>

      {/* Controls */}
      {resizeMode === 'crop' ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Aspect Ratio:
            </label>
            <select
              value={selectedAspectRatio || ''}
              onChange={(e) =>
                handleAspectRatioChange(e.target.value ? parseFloat(e.target.value) : null)
              }
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio.label} value={ratio.value || ''}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Width (px)
            </label>
            <Input
              type="number"
              value={resizeDimensions.width}
              onChange={(e) => handleResizeDimensionChange('width', parseInt(e.target.value))}
              min={1}
              max={maxWidth}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Height (px)
            </label>
            <Input
              type="number"
              value={resizeDimensions.height}
              onChange={(e) => handleResizeDimensionChange('height', parseInt(e.target.value))}
              min={1}
              max={maxHeight}
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={maintainAspectRatio}
                onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span>Maintain aspect ratio</span>
            </label>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={cn(
            'max-w-full h-auto border border-gray-200 dark:border-gray-700 rounded',
            resizeMode === 'crop' && 'cursor-crosshair'
          )}
        />
      </div>

      {/* Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {resizeMode === 'crop' ? (
          <p>
            Crop area: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}px
            {selectedAspectRatio &&
              ` (${aspectRatios.find((r) => r.value === selectedAspectRatio)?.label})`}
          </p>
        ) : (
          <p>
            Original: {image.naturalWidth} × {image.naturalHeight}px → New: {resizeDimensions.width}{' '}
            × {resizeDimensions.height}px
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Processing...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
