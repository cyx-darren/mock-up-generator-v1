'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FileUploadManager } from '@/components/ui/FileUploadManager';
import Image from 'next/image';

interface AllOverConstraint {
  id?: string;
  constraintImageUrl?: string;
  patternRepeatX?: number;
  patternRepeatY?: number;
  minPatternWidth?: number;
  minPatternHeight?: number;
  maxPatternWidth?: number;
  maxPatternHeight?: number;
  patternSpacing?: number;
  guidelinesText?: string;
  isEnabled?: boolean;
}

interface AllOverConstraintConfigProps {
  productId: string;
  existingConstraint?: AllOverConstraint;
  onSave: (constraintData: any) => Promise<void>;
  onCancel: () => void;
}

export function AllOverConstraintConfig({
  productId,
  existingConstraint,
  onSave,
  onCancel,
}: AllOverConstraintConfigProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [constraintImage, setConstraintImage] = useState<string>(existingConstraint?.constraintImageUrl || '');
  const [patternRepeatX, setPatternRepeatX] = useState<number>(existingConstraint?.patternRepeatX || 3);
  const [patternRepeatY, setPatternRepeatY] = useState<number>(existingConstraint?.patternRepeatY || 4);
  const [minPatternWidth, setMinPatternWidth] = useState<number>(existingConstraint?.minPatternWidth || 20);
  const [minPatternHeight, setMinPatternHeight] = useState<number>(existingConstraint?.minPatternHeight || 20);
  const [maxPatternWidth, setMaxPatternWidth] = useState<number>(existingConstraint?.maxPatternWidth || 200);
  const [maxPatternHeight, setMaxPatternHeight] = useState<number>(existingConstraint?.maxPatternHeight || 200);
  const [patternSpacing, setPatternSpacing] = useState<number>(existingConstraint?.patternSpacing || 10);
  const [guidelinesText, setGuidelinesText] = useState<string>(existingConstraint?.guidelinesText || '');
  const [isEnabled, setIsEnabled] = useState<boolean>(existingConstraint?.isEnabled || false);
  const [patternAnalysis, setPatternAnalysis] = useState<{
    totalPixels: number;
    coveragePercentage: number;
    estimatedRepeats: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (constraintImage) {
      analyzePatternImage();
    }
  }, [constraintImage, patternRepeatX, patternRepeatY]);

  const analyzePatternImage = () => {
    if (!constraintImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const analysis = analyzePatternCoverage(imageData, canvas.width, canvas.height);
      setPatternAnalysis(analysis);
    };

    img.src = constraintImage;
  };

  const analyzePatternCoverage = (imageData: ImageData, width: number, height: number) => {
    const data = imageData.data;
    let patternPixelCount = 0;
    const totalPixels = width * height;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a > 200) {
        const brightness = (r + g + b) / 3;
        if (brightness < 240) {
          patternPixelCount++;
        }
      }
    }

    const coveragePercentage = (patternPixelCount / totalPixels) * 100;
    const estimatedRepeats = patternRepeatX * patternRepeatY;

    return {
      totalPixels: patternPixelCount,
      coveragePercentage,
      estimatedRepeats,
    };
  };

  const handleImageUpload = (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB');
      return;
    }

    setError('');
    const objectUrl = URL.createObjectURL(file);
    setConstraintImage(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!constraintImage) {
        setError('Please upload a pattern image');
        return;
      }

      if (minPatternWidth >= maxPatternWidth || minPatternHeight >= maxPatternHeight) {
        setError('Minimum dimensions must be smaller than maximum dimensions');
        return;
      }

      const constraintData = {
        productId,
        placementType: 'all_over',
        constraintImageUrl: constraintImage,
        patternRepeatX,
        patternRepeatY,
        minPatternWidth,
        minPatternHeight,
        maxPatternWidth,
        maxPatternHeight,
        patternSpacing,
        guidelinesText,
        isEnabled,
        detectedAreaPixels: patternAnalysis?.totalPixels,
        detectedAreaPercentage: patternAnalysis?.coveragePercentage,
      };

      await onSave(constraintData);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save constraint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}

      {/* Pattern Image Upload */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pattern Template Image
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload an image showing how the all-over pattern should be applied
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <FileUploadManager
              onFilesSelected={handleImageUpload}
              accept="image/*"
              maxFiles={1}
              maxFileSize={10 * 1024 * 1024}
              onUploadProgress={setUploadProgress}
            />
            
            {constraintImage && (
              <div className="space-y-4">
                <div className="relative w-full max-w-md mx-auto">
                  <Image
                    src={constraintImage}
                    alt="Pattern template"
                    width={400}
                    height={300}
                    className="w-full h-auto border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                {patternAnalysis && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pattern Analysis</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Pattern Coverage:</span>
                        <div className="font-medium">{patternAnalysis.coveragePercentage.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Pattern Pixels:</span>
                        <div className="font-medium">{patternAnalysis.totalPixels.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">Est. Repeats:</span>
                        <div className="font-medium">{patternAnalysis.estimatedRepeats}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </CardBody>
      </Card>

      {/* Pattern Repeat Configuration */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pattern Repeat Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure how the pattern repeats across the product
          </p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horizontal Repeats
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={patternRepeatX}
                onChange={(e) => setPatternRepeatX(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Number of pattern repeats horizontally
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vertical Repeats
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={patternRepeatY}
                onChange={(e) => setPatternRepeatY(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Number of pattern repeats vertically
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern Spacing (px)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={patternSpacing}
                onChange={(e) => setPatternSpacing(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Space between repeated patterns
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Pattern Size Settings */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pattern Size Constraints
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set minimum and maximum dimensions for each pattern repeat
          </p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Minimum Size</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Width (px)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={minPatternWidth}
                  onChange={(e) => setMinPatternWidth(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Height (px)
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={minPatternHeight}
                  onChange={(e) => setMinPatternHeight(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Maximum Size</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Width (px)
                </label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={maxPatternWidth}
                  onChange={(e) => setMaxPatternWidth(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Height (px)
                </label>
                <input
                  type="number"
                  min="20"
                  max="1000"
                  value={maxPatternHeight}
                  onChange={(e) => setMaxPatternHeight(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Guidelines Editor */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pattern Guidelines
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add specific instructions for all-over pattern application
          </p>
        </CardHeader>
        <CardBody>
          <textarea
            value={guidelinesText}
            onChange={(e) => setGuidelinesText(e.target.value)}
            rows={4}
            placeholder="Enter guidelines for all-over pattern placement, such as alignment requirements, color restrictions, or special considerations..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
        </CardBody>
      </Card>

      {/* Enable/Disable Toggle */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                All-Over Print Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable or disable all-over printing for this product
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}