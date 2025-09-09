'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  ColorDetectionResult,
  DetectionSettings,
  GREEN_COLOR_RANGES,
  DEFAULT_DETECTION_SETTINGS,
  colorDetectionService,
} from '@/lib/color-detection';
import {
  GeneratedMask,
  MaskGenerationOptions,
  DEFAULT_MASK_OPTIONS,
  maskGenerationService,
  MaskValidationResult,
} from '@/lib/mask-generation';

export default function TestMaskGenerationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ColorDetectionResult | null>(null);
  const [maskResult, setMaskResult] = useState<GeneratedMask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [maskPreviewUrl, setMaskPreviewUrl] = useState<string | null>(null);
  const [svgMask, setSvgMask] = useState<string | null>(null);

  // Settings
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(
    DEFAULT_DETECTION_SETTINGS
  );
  const [maskOptions, setMaskOptions] = useState<MaskGenerationOptions>(DEFAULT_MASK_OPTIONS);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json'>('png');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setDetectionResult(null);
      setMaskResult(null);
      setMaskPreviewUrl(null);
      setSvgMask(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateMask = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setDetectionResult(null);
    setMaskResult(null);
    setMaskPreviewUrl(null);
    setSvgMask(null);

    try {
      // First detect colors
      colorDetectionService.updateSettings(detectionSettings);
      const detection = await colorDetectionService.analyzeImage(selectedFile);
      setDetectionResult(detection);

      if (detection.regions.length === 0) {
        setError('No green constraint areas detected. Try adjusting color tolerance or range.');
        return;
      }

      // Create image data for mask generation
      const url = URL.createObjectURL(selectedFile);
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Generate mask
        maskGenerationService.updateOptions(maskOptions);
        const mask = await maskGenerationService.generateMask(imageData, detectionSettings);
        setMaskResult(mask);

        // Create PNG preview
        const pngBlob = await maskGenerationService.exportMask(mask, 'png');
        if (pngBlob instanceof Blob) {
          const pngUrl = URL.createObjectURL(pngBlob);
          setMaskPreviewUrl(pngUrl);
        }

        // Create SVG preview
        const svgString = await maskGenerationService.exportMask(mask, 'svg');
        if (typeof svgString === 'string') {
          setSvgMask(svgString);
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Mask generation error:', err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportMask = async () => {
    if (!maskResult) return;

    try {
      const exported = await maskGenerationService.exportMask(maskResult, exportFormat);

      if (exported instanceof Blob) {
        // Download as file
        const url = URL.createObjectURL(exported);
        const link = document.createElement('a');
        link.href = url;
        link.download = `constraint-mask.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Copy to clipboard or download as text
        if (exportFormat === 'svg' || exportFormat === 'json') {
          navigator.clipboard.writeText(exported);
          alert(`${exportFormat.toUpperCase()} data copied to clipboard`);
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const updateDetectionSettings = (key: keyof DetectionSettings, value: any) => {
    setDetectionSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateMaskOptions = (section: keyof MaskGenerationOptions, key: string, value: any) => {
    setMaskOptions((prev) => ({
      ...prev,
      [section]:
        typeof prev[section] === 'object' ? { ...(prev[section] as any), [key]: value } : value,
    }));
  };

  const renderValidationResults = (validation: MaskValidationResult) => {
    return (
      <div className="space-y-3">
        <div
          className={`p-3 rounded ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}
        >
          <div className="font-medium">
            Validation: {validation.isValid ? '✅ Valid' : '❌ Invalid'}
          </div>
        </div>

        {validation.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <div className="font-medium text-red-800 mb-1">Errors:</div>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <div className="font-medium text-yellow-800 mb-1">Warnings:</div>
            <ul className="text-sm text-yellow-700 space-y-1">
              {validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <div className="font-medium text-blue-800 mb-1">Suggestions:</div>
            <ul className="text-sm text-blue-700 space-y-1">
              {validation.suggestions.map((suggestion, i) => (
                <li key={i}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 p-3 rounded">
          <div className="font-medium text-gray-800 mb-2">Quality Metrics:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Area: {Math.round(validation.metrics.area)} px²</div>
            <div>Perimeter: {Math.round(validation.metrics.perimeter)} px</div>
            <div>Aspect Ratio: {validation.metrics.aspectRatio.toFixed(2)}</div>
            <div>Solidity: {validation.metrics.solidity.toFixed(2)}</div>
            <div>Compactness: {validation.metrics.compactness.toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Mask Generation & Validation Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test the complete mask generation pipeline: detection → binary mask → morphological
              ops → contour detection → validation
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Upload */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Upload Image
                </h2>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>

              {/* Detection Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Detection Settings
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Range</label>
                    <select
                      value={Object.keys(GREEN_COLOR_RANGES).find(
                        (key) =>
                          GREEN_COLOR_RANGES[key as keyof typeof GREEN_COLOR_RANGES] ===
                          detectionSettings.colorRange
                      )}
                      onChange={(e) =>
                        updateDetectionSettings(
                          'colorRange',
                          GREEN_COLOR_RANGES[e.target.value as keyof typeof GREEN_COLOR_RANGES]
                        )
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      {Object.keys(GREEN_COLOR_RANGES).map((key) => (
                        <option key={key} value={key}>
                          {key.replace('_', ' ').toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tolerance: {detectionSettings.tolerance}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={detectionSettings.tolerance}
                      onChange={(e) =>
                        updateDetectionSettings('tolerance', parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Mask Options */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Mask Options
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maskOptions.fillHoles}
                      onChange={(e) => updateMaskOptions('fillHoles', '', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Fill holes</span>
                  </label>

                  {maskOptions.fillHoles && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Min hole size: {maskOptions.minHoleSize}
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        value={maskOptions.minHoleSize}
                        onChange={(e) =>
                          updateMaskOptions('minHoleSize', '', parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maskOptions.smoothing.enabled}
                      onChange={(e) => updateMaskOptions('smoothing', 'enabled', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Morphological smoothing</span>
                  </label>

                  {maskOptions.smoothing.enabled && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Iterations: {maskOptions.smoothing.iterations}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={maskOptions.smoothing.iterations}
                          onChange={(e) =>
                            updateMaskOptions('smoothing', 'iterations', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Kernel size: {maskOptions.smoothing.kernelSize}
                        </label>
                        <input
                          type="range"
                          min="3"
                          max="9"
                          step="2"
                          value={maskOptions.smoothing.kernelSize}
                          onChange={(e) =>
                            updateMaskOptions('smoothing', 'kernelSize', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={maskOptions.contourSimplification.enabled}
                      onChange={(e) =>
                        updateMaskOptions('contourSimplification', 'enabled', e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Contour simplification</span>
                  </label>

                  {maskOptions.contourSimplification.enabled && (
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Epsilon: {maskOptions.contourSimplification.epsilon}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={maskOptions.contourSimplification.epsilon}
                        onChange={(e) =>
                          updateMaskOptions(
                            'contourSimplification',
                            'epsilon',
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerateMask}
                  disabled={!selectedFile || isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? 'Generating...' : 'Generate Mask'}
                </Button>
              </div>

              {/* Export */}
              {maskResult && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Export Mask
                  </h2>
                  <div className="space-y-3">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg' | 'json')}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="png">PNG Image</option>
                      <option value="svg">SVG Vector</option>
                      <option value="json">JSON Data</option>
                    </select>
                    <Button onClick={handleExportMask} className="w-full">
                      Export as {exportFormat.toUpperCase()}
                    </Button>
                  </div>
                </div>
              )}
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

              {maskPreviewUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Generated Mask
                  </h2>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={maskPreviewUrl}
                      alt="Generated Mask"
                      className="max-w-full max-h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </div>
              )}

              {svgMask && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    SVG Contours
                  </h2>
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <div
                      dangerouslySetInnerHTML={{ __html: svgMask }}
                      className="max-w-full max-h-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {maskResult && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                  <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                    Generation Results
                  </h2>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span>{maskResult.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contours Found:</span>
                      <span>{maskResult.contours.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mask Size:</span>
                      <span>
                        {maskResult.width} × {maskResult.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fill Holes:</span>
                      <span>{maskResult.options.fillHoles ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smoothing:</span>
                      <span>{maskResult.options.smoothing.enabled ? '✅' : '❌'}</span>
                    </div>
                  </div>
                </div>
              )}

              {maskResult?.validation && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Validation Results
                  </h2>
                  {renderValidationResults(maskResult.validation)}
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
                  Mask Generation Pipeline
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>1. ✓ Color detection & region identification</p>
                  <p>2. ✓ Binary mask creation</p>
                  <p>3. ✓ Morphological operations (open/close)</p>
                  <p>4. ✓ Hole filling algorithm</p>
                  <p>5. ✓ Contour detection (Moore tracing)</p>
                  <p>6. ✓ Contour simplification (Douglas-Peucker)</p>
                  <p>7. ✓ Quality validation & metrics</p>
                  <p>8. ✓ Multi-format export (PNG/SVG/JSON)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
