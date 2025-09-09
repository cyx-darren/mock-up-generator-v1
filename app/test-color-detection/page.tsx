'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  ColorDetectionResult,
  DetectionSettings,
  GREEN_COLOR_RANGES,
  DEFAULT_DETECTION_SETTINGS,
  colorDetectionService,
  DetectedRegion,
  HSVColor,
} from '@/lib/color-detection';

export default function TestColorDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ColorDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [visualizationUrl, setVisualizationUrl] = useState<string | null>(null);

  // Detection settings
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_DETECTION_SETTINGS);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setVisualizationUrl(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectConstraints = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setVisualizationUrl(null);

    try {
      // Update service settings
      colorDetectionService.updateSettings(settings);

      // Analyze image
      const detectionResult = await colorDetectionService.analyzeImage(selectedFile);
      setResult(detectionResult);

      // Create visualization if regions found
      if (detectionResult.regions.length > 0) {
        const visualizationBlob = await colorDetectionService.createVisualizationMask(
          selectedFile,
          detectionResult.regions
        );
        const visUrl = URL.createObjectURL(visualizationBlob);
        setVisualizationUrl(visUrl);
      }
    } catch (err) {
      console.error('Color detection error:', err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const updateColorRange = (rangeType: keyof typeof GREEN_COLOR_RANGES) => {
    setSettings((prev) => ({
      ...prev,
      colorRange: GREEN_COLOR_RANGES[rangeType],
    }));
  };

  const updateTolerance = (tolerance: number) => {
    setSettings((prev) => ({ ...prev, tolerance }));
  };

  const updateAreaConstraints = (minArea: number, maxArea: number) => {
    setSettings((prev) => ({ ...prev, minArea, maxArea }));
  };

  const updateNoiseReduction = (enabled: boolean, kernelSize?: number, iterations?: number) => {
    setSettings((prev) => ({
      ...prev,
      noiseReduction: {
        enabled,
        kernelSize: kernelSize ?? prev.noiseReduction.kernelSize,
        iterations: iterations ?? prev.noiseReduction.iterations,
      },
    }));
  };

  const updateEdgeSmoothing = (enabled: boolean, blurRadius?: number, threshold?: number) => {
    setSettings((prev) => ({
      ...prev,
      edgeSmoothing: {
        enabled,
        blurRadius: blurRadius ?? prev.edgeSmoothing.blurRadius,
        threshold: threshold ?? prev.edgeSmoothing.threshold,
      },
    }));
  };

  const formatColor = (color: HSVColor): string => {
    return `H:${color.h}° S:${color.s}% V:${color.v}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Color Detection & Constraint Analysis Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test the color detection algorithm for identifying green constraint areas in mockup
              templates
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Upload and Settings */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Upload Image
                </h2>

                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {selectedFile && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Range Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Color Range
                </h2>

                <div className="space-y-3">
                  {Object.entries(GREEN_COLOR_RANGES).map(([key, range]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="radio"
                        name="colorRange"
                        checked={settings.colorRange === range}
                        onChange={() => updateColorRange(key as keyof typeof GREEN_COLOR_RANGES)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {key.replace('_', ' ').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color Tolerance: {settings.tolerance}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={settings.tolerance}
                    onChange={(e) => updateTolerance(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Area Constraints */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Area Constraints
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Area: {settings.minArea} pixels
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      value={settings.minArea}
                      onChange={(e) =>
                        updateAreaConstraints(parseInt(e.target.value), settings.maxArea)
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Area: {settings.maxArea} pixels
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={settings.maxArea}
                      onChange={(e) =>
                        updateAreaConstraints(settings.minArea, parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Processing Options
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.noiseReduction.enabled}
                        onChange={(e) => updateNoiseReduction(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable noise reduction
                      </span>
                    </label>

                    {settings.noiseReduction.enabled && (
                      <div className="ml-6 mt-2 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Kernel Size: {settings.noiseReduction.kernelSize}
                          </label>
                          <input
                            type="range"
                            min="3"
                            max="9"
                            step="2"
                            value={settings.noiseReduction.kernelSize}
                            onChange={(e) => updateNoiseReduction(true, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Iterations: {settings.noiseReduction.iterations}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="3"
                            value={settings.noiseReduction.iterations}
                            onChange={(e) =>
                              updateNoiseReduction(true, undefined, parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.edgeSmoothing.enabled}
                        onChange={(e) => updateEdgeSmoothing(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable edge smoothing
                      </span>
                    </label>

                    {settings.edgeSmoothing.enabled && (
                      <div className="ml-6 mt-2 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Blur Radius: {settings.edgeSmoothing.blurRadius}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={settings.edgeSmoothing.blurRadius}
                            onChange={(e) => updateEdgeSmoothing(true, parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Threshold: {settings.edgeSmoothing.threshold}
                          </label>
                          <input
                            type="range"
                            min="64"
                            max="192"
                            value={settings.edgeSmoothing.threshold}
                            onChange={(e) =>
                              updateEdgeSmoothing(true, undefined, parseInt(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleDetectConstraints}
                  disabled={!selectedFile || isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? 'Analyzing...' : 'Detect Constraints'}
                </Button>
              </div>
            </div>

            {/* Image Previews */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Original Image
                </h2>

                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {originalPreviewUrl ? (
                    <img
                      src={originalPreviewUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">No image selected</div>
                  )}
                </div>
              </div>

              {visualizationUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Detected Constraints
                  </h2>

                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={visualizationUrl}
                      alt="Detected Constraints"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="space-y-6">
              {result && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                  <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                    Detection Results
                  </h2>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span>{result.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regions Found:</span>
                      <span>{result.regions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Area:</span>
                      <span>{result.totalArea.toLocaleString()} pixels</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Confidence:</span>
                      <span>{result.averageConfidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Has Target Color:</span>
                      <span>{result.imageAnalysis.hasTargetColor ? '✅ Yes' : '❌ No'}</span>
                    </div>
                  </div>

                  {result.regions.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Region Details
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {result.regions.map((region, index) => (
                          <div
                            key={index}
                            className="text-xs bg-green-100 dark:bg-green-800 p-2 rounded"
                          >
                            <div>
                              Region {index + 1}: {region.width}×{region.height}
                            </div>
                            <div>
                              Center: ({region.center.x}, {region.center.y})
                            </div>
                            <div>Area: {region.area} pixels</div>
                            <div>Confidence: {region.confidence}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.imageAnalysis.dominantColors.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Dominant Colors
                      </h3>
                      <div className="space-y-1">
                        {result.imageAnalysis.dominantColors.slice(0, 3).map((color, index) => (
                          <div key={index} className="text-xs">
                            Color {index + 1}: {formatColor(color)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6">
                  <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-4">
                    Error
                  </h2>
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Algorithm Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Algorithm Features
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>✓ RGB to HSV color space conversion</p>
                  <p>✓ Multiple green color range presets</p>
                  <p>✓ Adjustable color tolerance</p>
                  <p>✓ Morphological noise reduction</p>
                  <p>✓ Gaussian blur edge smoothing</p>
                  <p>✓ Connected component analysis</p>
                  <p>✓ Area-based filtering</p>
                  <p>✓ Confidence scoring</p>
                  <p>✓ Visual constraint overlay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
