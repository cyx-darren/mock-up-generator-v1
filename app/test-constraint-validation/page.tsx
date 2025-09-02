'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  ColorDetectionResult,
  DetectionSettings,
  GREEN_COLOR_RANGES,
  DEFAULT_DETECTION_SETTINGS,
  colorDetectionService
} from '@/lib/color-detection';
import {
  GeneratedMask,
  MaskGenerationOptions,
  DEFAULT_MASK_OPTIONS,
  maskGenerationService
} from '@/lib/mask-generation';
import {
  ConstraintValidationResult,
  ConstraintRequirements,
  DEFAULT_CONSTRAINT_REQUIREMENTS,
  constraintValidationService,
  ValidationIssue,
  PlacementZone
} from '@/lib/constraint-validation';

export default function TestConstraintValidationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ColorDetectionResult | null>(null);
  const [maskResult, setMaskResult] = useState<GeneratedMask | null>(null);
  const [validationResult, setValidationResult] = useState<ConstraintValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [visualizationUrl, setVisualizationUrl] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<string | null>(null);
  
  // Settings
  const [detectionSettings, setDetectionSettings] = useState<DetectionSettings>(DEFAULT_DETECTION_SETTINGS);
  const [maskOptions, setMaskOptions] = useState<MaskGenerationOptions>(DEFAULT_MASK_OPTIONS);
  const [constraintRequirements, setConstraintRequirements] = useState<ConstraintRequirements>(DEFAULT_CONSTRAINT_REQUIREMENTS);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setDetectionResult(null);
      setMaskResult(null);
      setValidationResult(null);
      setVisualizationUrl(null);
      setValidationReport(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteValidation = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setDetectionResult(null);
    setMaskResult(null);
    setValidationResult(null);
    setVisualizationUrl(null);
    setValidationReport(null);

    try {
      // Step 1: Color Detection
      colorDetectionService.updateSettings(detectionSettings);
      const detection = await colorDetectionService.analyzeImage(selectedFile);
      setDetectionResult(detection);
      
      if (detection.regions.length === 0) {
        setError('No green constraint areas detected. Try adjusting color detection settings.');
        return;
      }

      // Step 2: Create image data for processing
      const url = URL.createObjectURL(selectedFile);
      let imageWidth = 0;
      let imageHeight = 0;
      
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });

        imageWidth = img.width;
        imageHeight = img.height;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        canvas.width = imageWidth;
        canvas.height = imageHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Step 3: Mask Generation
        maskGenerationService.updateOptions(maskOptions);
        const mask = await maskGenerationService.generateMask(imageData, detectionSettings);
        setMaskResult(mask);

        // Step 4: Constraint Validation
        constraintValidationService.updateRequirements(constraintRequirements);
        const validation = constraintValidationService.validateConstraint(mask, imageWidth, imageHeight);
        setValidationResult(validation);

        // Step 5: Create validation report
        const report = constraintValidationService.createValidationReport(validation);
        setValidationReport(report);

        // Step 6: Create visualization
        const visualizationBlob = await colorDetectionService.createVisualizationMask(
          selectedFile,
          detection.regions
        );
        const visUrl = URL.createObjectURL(visualizationBlob);
        setVisualizationUrl(visUrl);

      } finally {
        URL.revokeObjectURL(url);
      }
      
    } catch (err) {
      console.error('Constraint validation error:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const updateDetectionSettings = (key: keyof DetectionSettings, value: any) => {
    setDetectionSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateConstraintRequirements = (section: string, key: string, value: any) => {
    setConstraintRequirements(prev => ({
      ...prev,
      [section]: typeof prev[section as keyof ConstraintRequirements] === 'object' 
        ? { ...prev[section as keyof ConstraintRequirements] as any, [key]: value }
        : value
    }));
  };

  const getSeverityIcon = (level: string) => {
    switch (level) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Complete Constraint Validation Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              End-to-end validation: Color Detection → Mask Generation → Constraint Validation → Quality Assessment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Panel */}
            <div className="space-y-6">
              {/* Upload */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Upload Test Image
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
                
                <Button
                  onClick={handleCompleteValidation}
                  disabled={!selectedFile || isProcessing}
                  className="w-full mt-4"
                >
                  {isProcessing ? 'Processing...' : 'Run Complete Validation'}
                </Button>
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
                      value={Object.keys(GREEN_COLOR_RANGES).find(key => 
                        GREEN_COLOR_RANGES[key as keyof typeof GREEN_COLOR_RANGES] === detectionSettings.colorRange
                      )}
                      onChange={(e) => updateDetectionSettings('colorRange', GREEN_COLOR_RANGES[e.target.value as keyof typeof GREEN_COLOR_RANGES])}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      {Object.keys(GREEN_COLOR_RANGES).map(key => (
                        <option key={key} value={key}>{key.replace('_', ' ').toLowerCase()}</option>
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
                      onChange={(e) => updateDetectionSettings('tolerance', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Constraint Requirements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Validation Requirements
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min Area: {constraintRequirements.minArea} px²
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      value={constraintRequirements.minArea}
                      onChange={(e) => updateConstraintRequirements('minArea', '', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Min Logo Size: {constraintRequirements.logoPlacement.minLogoSize} px
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      value={constraintRequirements.logoPlacement.minLogoSize}
                      onChange={(e) => updateConstraintRequirements('logoPlacement', 'minLogoSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Edge Margin: {constraintRequirements.position.marginFromEdges} px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={constraintRequirements.position.marginFromEdges}
                      onChange={(e) => updateConstraintRequirements('position', 'marginFromEdges', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={constraintRequirements.contiguity.requireSingleRegion}
                      onChange={(e) => updateConstraintRequirements('contiguity', 'requireSingleRegion', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Require single region</span>
                  </label>
                </div>
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

              {validationReport && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Validation Report
                  </h2>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                    {validationReport}
                  </pre>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {validationResult && (
                <div className={`rounded-lg border p-6 ${
                  validationResult.isValid 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <h2 className={`text-xl font-semibold mb-4 ${
                    validationResult.isValid 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    Validation Results
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">
                        {validationResult.isValid ? '✅ Valid' : '❌ Invalid'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usable:</span>
                      <span className="font-medium">
                        {validationResult.isUsable ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium">
                        {(validationResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issues Found:</span>
                      <span>{validationResult.issues.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Placement Zones:</span>
                      <span>{validationResult.placementZones.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {validationResult?.issues && validationResult.issues.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Validation Issues
                  </h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {validationResult.issues.map((issue, index) => (
                      <div key={issue.id} className="border-l-4 border-gray-300 pl-4">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">{getSeverityIcon(issue.severity.level)}</span>
                          <div className="flex-1">
                            <div className={`font-medium ${getSeverityColor(issue.severity.level)}`}>
                              {issue.title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {issue.description}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              💡 {issue.suggestion}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResult?.placementZones && validationResult.placementZones.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Placement Zones
                  </h2>
                  <div className="space-y-3">
                    {validationResult.placementZones.map((zone, index) => (
                      <div key={zone.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium capitalize">{zone.id} Zone</span>
                          <span className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                            {Math.round(zone.quality * 100)}% Quality
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Size: {zone.region.width} × {zone.region.height} px</div>
                          <div>Center: ({zone.centerPoint.x}, {zone.centerPoint.y})</div>
                          <div>Suggested Logo: {zone.suggestedLogoSize.width} × {zone.suggestedLogoSize.height} px</div>
                          {zone.restrictions.length > 0 && (
                            <div className="text-xs text-yellow-600">
                              ⚠️ {zone.restrictions.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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

              {/* Pipeline Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Validation Pipeline
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>1. ✓ Color detection & region identification</p>
                  <p>2. ✓ Binary mask generation & refinement</p>
                  <p>3. ✓ Area & geometry validation</p>
                  <p>4. ✓ Position & edge distance checks</p>
                  <p>5. ✓ Logo placement feasibility analysis</p>
                  <p>6. ✓ Quality scoring & confidence rating</p>
                  <p>7. ✓ Placement zone optimization</p>
                  <p>8. ✓ Comprehensive validation report</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}