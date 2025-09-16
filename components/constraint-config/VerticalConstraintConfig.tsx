'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { FileUploadManager } from '../ui/FileUploadManager';
import { cn } from '@/lib/utils';

interface ConstraintDimensions {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

interface ConstraintPosition {
  x: number;
  y: number;
}

interface ConstraintImagePreviewData {
  file: File;
  url: string;
  detectedArea?: {
    pixels: number;
    percentage: number;
    bounds: { x: number; y: number; width: number; height: number };
  };
}

interface VerticalConstraintConfigProps {
  productId: string;
  existingConstraint?: {
    id: string;
    constraintImageUrl: string;
    detectedAreaPixels?: number;
    detectedAreaPercentage?: number;
    minLogoWidth?: number;
    minLogoHeight?: number;
    maxLogoWidth?: number;
    maxLogoHeight?: number;
    defaultXPosition?: number;
    defaultYPosition?: number;
    guidelinesText?: string;
    isEnabled: boolean;
  };
  onSave: (constraintData: any) => Promise<void>;
  onCancel: () => void;
}

export function VerticalConstraintConfig({
  productId,
  existingConstraint,
  onSave,
  onCancel,
}: VerticalConstraintConfigProps) {
  const [constraintImage, setConstraintImage] = useState<ConstraintImagePreviewData | null>(null);
  const [dimensions, setDimensions] = useState<ConstraintDimensions>({
    minWidth: existingConstraint?.minLogoWidth || 30,
    minHeight: existingConstraint?.minLogoHeight || 80,
    maxWidth: existingConstraint?.maxLogoWidth || 300,
    maxHeight: existingConstraint?.maxLogoHeight || 600,
  });
  const [position, setPosition] = useState<ConstraintPosition>({
    x: existingConstraint?.defaultXPosition || 150,
    y: existingConstraint?.defaultYPosition || 50,
  });
  const [guidelines, setGuidelines] = useState(existingConstraint?.guidelinesText || '');
  const [isEnabled, setIsEnabled] = useState(existingConstraint?.isEnabled ?? true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle file upload completion
  const handleFileUpload = useCallback(async (files: { file: File; url: string }[]) => {
    if (files.length === 0) return;

    const uploadedFile = files[0];
    const constraintImageData: ConstraintImagePreviewData = {
      file: uploadedFile.file,
      url: uploadedFile.url,
    };

    setConstraintImage(constraintImageData);
    setError('');

    // Start green area detection
    await detectGreenAreas(uploadedFile.file);
  }, []);

  // Detect green areas in the uploaded image
  const detectGreenAreas = useCallback(
    async (file: File) => {
      setIsDetecting(true);
      try {
        // Create image element for processing
        const img = new Image();
        const canvas = canvasRef.current;

        if (!canvas) {
          throw new Error('Canvas not available');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Cannot get canvas context');
        }

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0);

            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const detectedArea = analyzeGreenPixels(imageData, canvas.width, canvas.height);

            if (constraintImage) {
              setConstraintImage((prev) =>
                prev
                  ? {
                      ...prev,
                      detectedArea,
                    }
                  : null
              );
            }

            resolve();
          };

          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      } catch (error) {
        console.error('Green area detection error:', error);
        setError(error instanceof Error ? error.message : 'Failed to detect green areas');
      } finally {
        setIsDetecting(false);
      }
    },
    [constraintImage]
  );

  // Analyze green pixels in image data - optimized for vertical detection
  const analyzeGreenPixels = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data;
    let greenPixelCount = 0;
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    const verticalSegments = new Map<number, number>(); // Track vertical distribution

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if pixel is green (adjusted thresholds for vertical detection)
      if (g > 100 && g > r * 1.4 && g > b * 1.4) {
        greenPixelCount++;

        // Calculate pixel position
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        // Update bounds
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        // Track vertical distribution
        const ySegment = Math.floor(y / 10);
        verticalSegments.set(ySegment, (verticalSegments.get(ySegment) || 0) + 1);
      }
    }

    const totalPixels = width * height;
    const percentage = (greenPixelCount / totalPixels) * 100;

    // Check if the green area is primarily vertical
    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;
    const isVertical = boundsHeight > boundsWidth * 1.5;

    return {
      pixels: greenPixelCount,
      percentage: parseFloat(percentage.toFixed(2)),
      bounds: {
        x: minX,
        y: minY,
        width: boundsWidth,
        height: boundsHeight,
      },
      isVertical,
      verticalSegments: verticalSegments.size,
    };
  };

  // Handle dimension changes
  const handleDimensionChange = useCallback((field: keyof ConstraintDimensions, value: number) => {
    setDimensions((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  }, []);

  // Handle position changes
  const handlePositionChange = useCallback((field: keyof ConstraintPosition, value: number) => {
    setPosition((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!constraintImage && !existingConstraint) {
      setError('Please upload a constraint image');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const constraintData = {
        productId,
        placementType: 'vertical',
        constraintImageUrl: constraintImage?.url || existingConstraint?.constraintImageUrl,
        detectedAreaPixels:
          constraintImage?.detectedArea?.pixels || existingConstraint?.detectedAreaPixels,
        detectedAreaPercentage:
          constraintImage?.detectedArea?.percentage || existingConstraint?.detectedAreaPercentage,
        minLogoWidth: dimensions.minWidth,
        minLogoHeight: dimensions.minHeight,
        maxLogoWidth: dimensions.maxWidth,
        maxLogoHeight: dimensions.maxHeight,
        defaultXPosition: position.x,
        defaultYPosition: position.y,
        guidelinesText: guidelines,
        isEnabled,
      };

      await onSave(constraintData);
      setSuccess('Vertical constraint saved successfully!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save constraint');
    } finally {
      setIsSaving(false);
    }
  }, [
    constraintImage,
    existingConstraint,
    productId,
    dimensions,
    position,
    guidelines,
    isEnabled,
    onSave,
  ]);

  // Clear errors
  const handleClearError = useCallback(() => {
    setError('');
  }, []);

  // Clear success
  const handleClearSuccess = useCallback(() => {
    setSuccess('');
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (constraintImage?.url) {
        URL.revokeObjectURL(constraintImage.url);
      }
    };
  }, [constraintImage]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vertical Placement Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure vertical logo placement constraints for tall or portrait-oriented products
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enabled
              </label>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {error && <Alert type="error" message={error} onClose={handleClearError} />}
          {success && <Alert type="success" message={success} onClose={handleClearSuccess} />}

          {/* Constraint Image Upload */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Constraint Image
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload an image with green areas marking where logos can be placed vertically. This is
              ideal for tall products like water bottles, tumblers, or banners.
            </p>

            {/* Show existing constraint info */}
            {existingConstraint?.constraintImageUrl && !constraintImage && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      ✅ Existing Constraint Active
                    </h5>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Vertical placement constraint is configured and saved
                    </p>
                    {existingConstraint.detectedAreaPixels && (
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Coverage: {existingConstraint.detectedAreaPercentage}% (
                        {existingConstraint.detectedAreaPixels.toLocaleString()} pixels)
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConstraintImage({ file: null as any, url: '', detectedArea: undefined })
                    }
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Replace Image
                  </Button>
                </div>
              </div>
            )}

            {/* Show upload area when no existing constraint or user wants to replace */}
            {!existingConstraint?.constraintImageUrl && !constraintImage && (
              <div className="mb-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-lg mb-4">
                  <div className="flex items-center">
                    <div className="text-amber-600 dark:text-amber-400 mr-2">⚠️</div>
                    <div>
                      <h5 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        No Constraint Configured
                      </h5>
                      <p className="text-xs text-amber-600 dark:text-amber-300">
                        Upload a constraint image to enable vertical placement
                      </p>
                    </div>
                  </div>
                </div>
                <FileUploadManager
                  onUploadComplete={handleFileUpload}
                  maxFiles={1}
                  multiple={false}
                  validation={{
                    maxSize: 10 * 1024 * 1024, // 10MB
                    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                  }}
                />
              </div>
            )}

            {/* Show upload area when replacing existing constraint */}
            {constraintImage?.file === null && (
              <FileUploadManager
                onUploadComplete={handleFileUpload}
                maxFiles={1}
                multiple={false}
                validation={{
                  maxSize: 10 * 1024 * 1024, // 10MB
                  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
                }}
              />
            )}

            {/* Show constraint image preview */}
            {(constraintImage?.url || existingConstraint?.constraintImageUrl) &&
              constraintImage?.file !== null && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      Constraint Image Preview
                    </h5>
                    {(constraintImage?.url || existingConstraint?.constraintImageUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConstraintImage({
                            file: null as any,
                            url: '',
                            detectedArea: undefined,
                          })
                        }
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Replace
                      </Button>
                    )}
                  </div>
                  <img
                    ref={imageRef}
                    src={constraintImage?.url || existingConstraint?.constraintImageUrl}
                    alt="Vertical constraint preview"
                    className="max-w-full h-auto border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                  {isDetecting && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-sm flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Detecting vertical green areas...
                      </div>
                    </div>
                  )}

                  {/* Show detection results for new uploads */}
                  {constraintImage?.detectedArea && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>✅ New Vertical Detection Results:</strong>
                        <br />
                        Green pixels: {constraintImage.detectedArea.pixels.toLocaleString()}
                        <br />
                        Coverage: {constraintImage.detectedArea.percentage}%<br />
                        Bounds: {constraintImage.detectedArea.bounds.width} ×{' '}
                        {constraintImage.detectedArea.bounds.height}px
                        <br />
                        {constraintImage.detectedArea.isVertical
                          ? '✓ Vertical orientation detected'
                          : '⚠ Consider adjusting for vertical orientation'}
                      </p>
                    </div>
                  )}

                  {/* Show existing constraint stats */}
                  {!constraintImage?.detectedArea && existingConstraint?.detectedAreaPixels && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>📊 Saved Vertical Constraint Stats:</strong>
                        <br />
                        Green pixels: {existingConstraint.detectedAreaPixels.toLocaleString()}
                        <br />
                        Coverage: {existingConstraint.detectedAreaPercentage}%
                      </p>
                    </div>
                  )}
                </div>
              )}

            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          </div>

          {/* Dimension Input Fields - Optimized for vertical logos */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Vertical Logo Size Constraints
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set dimensions optimized for vertical logo placement
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Width (px)
                </label>
                <Input
                  type="number"
                  value={dimensions.minWidth}
                  onChange={(e) => handleDimensionChange('minWidth', parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Height (px)
                </label>
                <Input
                  type="number"
                  value={dimensions.minHeight}
                  onChange={(e) =>
                    handleDimensionChange('minHeight', parseInt(e.target.value) || 0)
                  }
                  min="1"
                  placeholder="80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Width (px)
                </label>
                <Input
                  type="number"
                  value={dimensions.maxWidth}
                  onChange={(e) => handleDimensionChange('maxWidth', parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Height (px)
                </label>
                <Input
                  type="number"
                  value={dimensions.maxHeight}
                  onChange={(e) =>
                    handleDimensionChange('maxHeight', parseInt(e.target.value) || 0)
                  }
                  min="1"
                  placeholder="600"
                />
              </div>
            </div>
          </div>

          {/* Position Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Default Position
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Set the default position for vertical logo placement
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  X Position (px)
                </label>
                <Input
                  type="number"
                  value={position.x}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Y Position (px)
                </label>
                <Input
                  type="number"
                  value={position.y}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="50"
                />
              </div>
            </div>
          </div>

          {/* Guidelines Text Editor */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Guidelines for Vertical Placement
            </h4>
            <textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Enter guidelines for vertical logo placement (e.g., 'For vertical placement, ensure your logo is oriented in portrait mode. The logo should be centered within the green area and maintain appropriate padding from edges...')"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              These guidelines will help users understand how to optimize their logo for vertical
              placement.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Vertical Configuration'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
