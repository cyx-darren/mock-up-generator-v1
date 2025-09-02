'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { GreenColorDetector, DetectedArea } from '@/lib/constraint-detection/greenColorDetector';
import {
  ConstraintCalculator,
  ValidationResult,
  ConstraintMetrics,
} from '@/lib/constraint-detection/constraintCalculator';
import { ConstraintOverlay } from './ConstraintOverlay';
import { ConstraintStats } from './ConstraintStats';

interface ConstraintPreviewProps {
  imageUrl?: string;
  placementType: 'horizontal' | 'vertical' | 'all_over';
  dimensions: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };
  onDetectionComplete?: (result: {
    detectedArea: DetectedArea;
    validation: ValidationResult;
    metrics: ConstraintMetrics;
  }) => void;
  onDetectionError?: (error: string) => void;
}

export function ConstraintPreview({
  imageUrl,
  placementType,
  dimensions,
  onDetectionComplete,
  onDetectionError,
}: ConstraintPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedArea, setDetectedArea] = useState<DetectedArea | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [metrics, setMetrics] = useState<ConstraintMetrics | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState('');
  const [detectionConfig, setDetectionConfig] = useState({
    sensitivity: 0.5,
    noiseReduction: true,
    morphology: true,
    showAdvancedStats: false,
  });

  // Overlay display options
  const [overlayOptions, setOverlayOptions] = useState({
    showBounds: true,
    showCentroid: true,
    showContours: false,
    showGrid: false,
    opacity: 0.8,
  });

  const detector = useRef(
    new GreenColorDetector({
      tolerance: detectionConfig.sensitivity,
      noiseReduction: detectionConfig.noiseReduction,
      morphologyOps: detectionConfig.morphology,
    })
  );

  // Update detector when config changes
  useEffect(() => {
    detector.current = new GreenColorDetector({
      tolerance: detectionConfig.sensitivity,
      noiseReduction: detectionConfig.noiseReduction,
      morphologyOps: detectionConfig.morphology,
    });

    if (imageUrl && imageLoaded) {
      analyzeImage();
    }
  }, [detectionConfig, imageUrl, imageLoaded]);

  const analyzeImage = useCallback(async () => {
    if (!imageUrl || !canvasRef.current) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Cannot get canvas context');
      }

      // Load and draw image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });

          ctx.drawImage(img, 0, 0);
          resolve();
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      // Analyze image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detected = detector.current.detectGreenAreas(imageData, canvas.width, canvas.height);

      // Validate constraint
      const validationResult = ConstraintCalculator.validateConstraint(
        detected,
        dimensions,
        canvas.width,
        canvas.height,
        placementType
      );

      // Calculate metrics
      const metricsResult = ConstraintCalculator.calculateMetrics(
        detected,
        canvas.width,
        canvas.height
      );

      setDetectedArea(detected);
      setValidation(validationResult);
      setMetrics(metricsResult);

      // Notify parent component
      if (onDetectionComplete) {
        onDetectionComplete({
          detectedArea: detected,
          validation: validationResult,
          metrics: metricsResult,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image';
      setError(errorMessage);
      if (onDetectionError) {
        onDetectionError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageUrl, dimensions, placementType, onDetectionComplete, onDetectionError]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (imageUrl) {
      analyzeImage();
    }
  }, [imageUrl, analyzeImage]);

  const handleReanalyze = () => {
    if (imageUrl) {
      analyzeImage();
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setDetectionConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleOverlayChange = (key: string, value: any) => {
    setOverlayOptions((prev) => ({ ...prev, [key]: value }));
  };

  if (!imageUrl) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Image Selected
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload a constraint image to preview detection results
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}

      {/* Detection Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detection Controls
            </h3>
            <Button variant="outline" onClick={handleReanalyze} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sensitivity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sensitivity: {Math.round(detectionConfig.sensitivity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={detectionConfig.sensitivity}
                onChange={(e) => handleConfigChange('sensitivity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* Noise Reduction */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="noiseReduction"
                checked={detectionConfig.noiseReduction}
                onChange={(e) => handleConfigChange('noiseReduction', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="noiseReduction"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Noise Reduction
              </label>
            </div>

            {/* Morphology */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="morphology"
                checked={detectionConfig.morphology}
                onChange={(e) => handleConfigChange('morphology', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="morphology" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Edge Smoothing
              </label>
            </div>

            {/* Advanced Stats */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="advancedStats"
                checked={detectionConfig.showAdvancedStats}
                onChange={(e) => handleConfigChange('showAdvancedStats', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="advancedStats"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Advanced Stats
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Overlay Controls */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display Options</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Show Bounds */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showBounds"
                checked={overlayOptions.showBounds}
                onChange={(e) => handleOverlayChange('showBounds', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showBounds" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Bounds
              </label>
            </div>

            {/* Show Centroid */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCentroid"
                checked={overlayOptions.showCentroid}
                onChange={(e) => handleOverlayChange('showCentroid', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="showCentroid"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Centroid
              </label>
            </div>

            {/* Show Contours */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showContours"
                checked={overlayOptions.showContours}
                onChange={(e) => handleOverlayChange('showContours', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="showContours"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Contours
              </label>
            </div>

            {/* Show Grid */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGrid"
                checked={overlayOptions.showGrid}
                onChange={(e) => handleOverlayChange('showGrid', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showGrid" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Grid
              </label>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opacity: {Math.round(overlayOptions.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={overlayOptions.opacity}
                onChange={(e) => handleOverlayChange('opacity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Preview with Overlay */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detection Preview
            </h3>
          </CardHeader>
          <CardBody>
            <div className="relative">
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700 dark:text-gray-300">Analyzing image...</span>
                  </div>
                </div>
              )}

              <ConstraintOverlay
                imageUrl={imageUrl}
                detectedArea={detectedArea}
                validation={validation}
                showBounds={overlayOptions.showBounds}
                showCentroid={overlayOptions.showCentroid}
                showContours={overlayOptions.showContours}
                showGrid={overlayOptions.showGrid}
                overlayOpacity={overlayOptions.opacity}
                className="rounded-lg overflow-hidden"
              />
            </div>

            {/* Quick Info */}
            {detectedArea && !isAnalyzing && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Detection:</span>
                    <span
                      className={`ml-2 font-medium ${
                        validation?.isValid ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {validation?.isValid ? 'Valid' : 'Issues Found'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {detectedArea.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Statistics */}
        <div>
          <ConstraintStats
            detectedArea={detectedArea}
            validation={validation}
            metrics={metrics}
            imageWidth={imageDimensions.width}
            imageHeight={imageDimensions.height}
            showDetailedStats={detectionConfig.showAdvancedStats}
          />
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
      <img src={imageUrl} onLoad={handleImageLoad} className="hidden" alt="Analysis target" />
    </div>
  );
}
