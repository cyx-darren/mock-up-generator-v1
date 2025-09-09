'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ProcessedResult {
  data: Blob;
  detectedType?: string;
  result?: {
    width: number;
    height: number;
    credits_charged: number;
  };
  processingTime: number;
  fromCache: boolean;
  originalSize: number;
  processedSize: number;
  metadata: {
    hasTransparency: boolean;
    colorProfile: string;
    edgeQuality: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

interface QualitySettings {
  size: string;
  format: string;
  enableCache: boolean;
  edgeRefinement: boolean;
  smoothing: number;
  feathering: number;
}

export default function TestBackgroundRemovalPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);

  // Quality settings
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>({
    size: 'preview',
    format: 'png',
    enableCache: true,
    edgeRefinement: false,
    smoothing: 2,
    feathering: 1,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setPreviewUrl(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('size', qualitySettings.size);
      formData.append('format', qualitySettings.format);
      formData.append('enableCache', qualitySettings.enableCache.toString());
      formData.append('edgeRefinement', qualitySettings.edgeRefinement.toString());
      formData.append('smoothing', qualitySettings.smoothing.toString());
      formData.append('feathering', qualitySettings.feathering.toString());

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to process image');
      }

      // Get enhanced metadata from headers
      const detectedType = response.headers.get('X-Detected-Type') || undefined;
      const width = parseInt(response.headers.get('X-Width') || '0');
      const height = parseInt(response.headers.get('X-Height') || '0');
      const creditsCharged = parseInt(response.headers.get('X-Credits-Charged') || '0');
      const processingTime = parseInt(response.headers.get('X-Processing-Time') || '0');
      const fromCache = response.headers.get('X-From-Cache') === 'true';
      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
      const processedSize = parseInt(response.headers.get('X-Processed-Size') || '0');
      const hasTransparency = response.headers.get('X-Has-Transparency') === 'true';
      const edgeQuality =
        (response.headers.get('X-Edge-Quality') as 'poor' | 'fair' | 'good' | 'excellent') ||
        'good';

      // Get image data
      const blob = await response.blob();

      const processedResult: ProcessedResult = {
        data: blob,
        detectedType,
        result: {
          width,
          height,
          credits_charged: creditsCharged,
        },
        processingTime,
        fromCache,
        originalSize,
        processedSize,
        metadata: {
          hasTransparency,
          colorProfile: 'image/png',
          edgeQuality,
        },
      };

      setResult(processedResult);

      // Create blob URL for display
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (err) {
      console.error('Remove background error:', err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityChange = (key: keyof QualitySettings, value: any) => {
    setQualitySettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Enhanced Background Removal Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test the enhanced background removal system with quality settings, caching, and edge
              refinement
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Quality Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Size Quality
                    </label>
                    <select
                      value={qualitySettings.size}
                      onChange={(e) => handleQualityChange('size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="preview">Preview (up to 0.25 megapixels)</option>
                      <option value="regular">Regular (up to 1 megapixel)</option>
                      <option value="medium">Medium (up to 1.5 megapixels)</option>
                      <option value="hd">HD (up to 4 megapixels)</option>
                      <option value="4k">4K (up to 10 megapixels)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Format
                    </label>
                    <select
                      value={qualitySettings.format}
                      onChange={(e) => handleQualityChange('format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="png">PNG (with transparency)</option>
                      <option value="jpg">JPG (no transparency)</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableCache"
                      checked={qualitySettings.enableCache}
                      onChange={(e) => handleQualityChange('enableCache', e.target.checked)}
                      className="mr-2"
                    />
                    <label
                      htmlFor="enableCache"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Enable result caching
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edgeRefinement"
                      checked={qualitySettings.edgeRefinement}
                      onChange={(e) => handleQualityChange('edgeRefinement', e.target.checked)}
                      className="mr-2"
                    />
                    <label
                      htmlFor="edgeRefinement"
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      Enable edge refinement
                    </label>
                  </div>

                  {qualitySettings.edgeRefinement && (
                    <div className="pl-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edge Smoothing: {qualitySettings.smoothing}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={qualitySettings.smoothing}
                          onChange={(e) =>
                            handleQualityChange('smoothing', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Edge Feathering: {qualitySettings.feathering}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={qualitySettings.feathering}
                          onChange={(e) =>
                            handleQualityChange('feathering', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleRemoveBackground}
                  disabled={!selectedFile || isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? 'Processing...' : 'Remove Background'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Original
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

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Processed
                </h2>

                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Processed"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">
                      {isProcessing ? 'Processing...' : 'No processed image'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results and Stats */}
            <div className="space-y-6">
              {result && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                  <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                    Processing Results
                  </h2>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span>{result.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>From Cache:</span>
                      <span>{result.fromCache ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Original Size:</span>
                      <span>{formatFileSize(result.originalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processed Size:</span>
                      <span>{formatFileSize(result.processedSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size Reduction:</span>
                      <span>
                        {result.originalSize > 0
                          ? (
                              ((result.originalSize - result.processedSize) / result.originalSize) *
                              100
                            ).toFixed(1)
                          : '0'}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span>
                        {result.result?.width} × {result.result?.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span>{result.result?.credits_charged || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Has Transparency:</span>
                      <span>{result.metadata.hasTransparency ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Edge Quality:</span>
                      <span
                        className={`capitalize ${
                          result.metadata.edgeQuality === 'excellent'
                            ? 'text-green-600'
                            : result.metadata.edgeQuality === 'good'
                              ? 'text-blue-600'
                              : result.metadata.edgeQuality === 'fair'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                        }`}
                      >
                        {result.metadata.edgeQuality}
                      </span>
                    </div>
                  </div>
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

              {/* Test Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Test Features</h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>✓ Quality settings (size, format)</p>
                  <p>✓ Result caching for faster repeat requests</p>
                  <p>✓ Edge refinement with smoothing controls</p>
                  <p>✓ Detailed processing metrics</p>
                  <p>✓ Transparency detection</p>
                  <p>✓ File size optimization</p>
                  <p>✓ Processing time tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
