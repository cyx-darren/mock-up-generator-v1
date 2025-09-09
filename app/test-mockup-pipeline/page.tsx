'use client';

import React, { useState, useEffect } from 'react';
import {
  getMockupGenerationPipeline,
  MockupGenerationRequest,
  PreparedInput,
  MockupGenerationResult,
  LogoInput,
  ProductInput,
} from '../../lib/mockup-generation-pipeline';

export default function TestMockupPipelinePage() {
  const [pipeline] = useState(() => getMockupGenerationPipeline());
  const [preparedInput, setPreparedInput] = useState<PreparedInput | null>(null);
  const [mockupResult, setMockupResult] = useState<MockupGenerationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample test data
  const sampleLogo: LogoInput = {
    file: '/api/placeholder/logo.png', // Using placeholder URL
    originalDimensions: { width: 200, height: 100 },
    format: 'png',
    hasTransparency: true,
  };

  const sampleProduct: ProductInput = {
    id: 'test-mug-1',
    name: 'Classic Coffee Mug',
    imageUrl: '/api/placeholder/mug.png',
    category: 'Drinkware',
    constraints: {
      horizontal: {
        area: { x: 100, y: 150, width: 200, height: 100 },
        maxLogoSize: { width: 180, height: 80 },
        position: { x: 200, y: 200 },
      },
      vertical: {
        area: { x: 180, y: 100, width: 40, height: 200 },
        maxLogoSize: { width: 35, height: 180 },
        position: { x: 200, y: 200 },
      },
    },
  };

  const [testRequest, setTestRequest] = useState<MockupGenerationRequest>({
    logo: sampleLogo,
    product: sampleProduct,
    placementType: 'horizontal',
    qualityLevel: 'enhanced',
    stylePreferences: {
      lighting: 'studio',
      angle: 'three-quarter',
      background: 'white',
      mood: 'professional',
      aesthetic: 'minimal',
    },
    customText: 'Test Company',
    brandColors: ['#2563eb', '#ffffff'],
    additionalRequirements: ['high quality', 'professional'],
  });

  // Test input preparation
  const testInputPreparation = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Testing input preparation with request:', testRequest);
      const result = await pipeline.prepareInputs(testRequest);
      setPreparedInput(result);
      console.log('Input preparation successful:', result);
    } catch (error: any) {
      console.error('Input preparation failed:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Test full mockup generation
  const testMockupGeneration = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log('Testing full mockup generation with request:', testRequest);
      const result = await pipeline.generateMockup(testRequest);
      setMockupResult(result);
      console.log('Mockup generation result:', result);
    } catch (error: any) {
      console.error('Mockup generation failed:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update request
  const updateRequest = (updates: Partial<MockupGenerationRequest>) => {
    setTestRequest((prev) => ({ ...prev, ...updates }));
  };

  const updateStylePreference = (category: string, value: string) => {
    setTestRequest((prev) => ({
      ...prev,
      stylePreferences: {
        ...prev.stylePreferences,
        [category]: value,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mockup Generation Pipeline Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Pipeline Configuration</h2>

            <div className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Product</label>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm">
                    <strong>{testRequest.product.name}</strong> ({testRequest.product.category})
                  </div>
                  <div className="text-xs text-gray-600">ID: {testRequest.product.id}</div>
                </div>
              </div>

              {/* Logo Information */}
              <div>
                <label className="block text-sm font-medium mb-2">Logo</label>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <div>Format: {testRequest.logo.format.toUpperCase()}</div>
                  <div>
                    Dimensions: {testRequest.logo.originalDimensions.width}×
                    {testRequest.logo.originalDimensions.height}
                  </div>
                  <div>Transparency: {testRequest.logo.hasTransparency ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Placement Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Placement Type</label>
                <select
                  value={testRequest.placementType}
                  onChange={(e) => updateRequest({ placementType: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="all-over">All-Over</option>
                  <option value="corner">Corner</option>
                  <option value="center">Center</option>
                </select>
              </div>

              {/* Quality Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Quality Level</label>
                <select
                  value={testRequest.qualityLevel}
                  onChange={(e) => updateRequest({ qualityLevel: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="basic">Basic</option>
                  <option value="enhanced">Enhanced</option>
                  <option value="premium">Premium</option>
                  <option value="ultra">Ultra</option>
                </select>
              </div>

              {/* Custom Text */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom Text</label>
                <input
                  type="text"
                  value={testRequest.customText || ''}
                  onChange={(e) => updateRequest({ customText: e.target.value })}
                  placeholder="Enter brand text"
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Style Preferences */}
              <div>
                <h3 className="font-medium mb-2">Style Preferences</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="block text-xs mb-1">Lighting</label>
                    <select
                      value={testRequest.stylePreferences.lighting || ''}
                      onChange={(e) => updateStylePreference('lighting', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      <option value="natural">Natural</option>
                      <option value="studio">Studio</option>
                      <option value="dramatic">Dramatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs mb-1">Background</label>
                    <select
                      value={testRequest.stylePreferences.background || ''}
                      onChange={(e) => updateStylePreference('background', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      <option value="white">White</option>
                      <option value="context">Context</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand Colors</label>
                <div className="flex gap-2">
                  {testRequest.brandColors?.map((color, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span>{color}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={testInputPreparation}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {isProcessing ? 'Processing...' : 'Test Input Preparation'}
                </button>
                <button
                  onClick={testMockupGeneration}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {isProcessing ? 'Processing...' : 'Generate Full Mockup'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Prepared Input Results */}
            {preparedInput && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Prepared Input Results</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Generated Prompt</h3>
                    <div className="p-3 bg-gray-50 rounded text-sm">
                      <div className="mb-2">
                        <strong>Variation:</strong> {preparedInput.prompt.metadata.variation}
                      </div>
                      <div className="mb-2">
                        <strong>Confidence:</strong>{' '}
                        {(preparedInput.prompt.metadata.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="mb-2">
                        <strong>Est. Tokens:</strong>{' '}
                        {preparedInput.prompt.metadata.estimatedTokens}
                      </div>
                      <div className="text-xs text-gray-600 whitespace-pre-wrap">
                        {preparedInput.prompt.finalPrompt}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">Metadata</h3>
                      <div className="text-sm space-y-1">
                        <div>Preparation Time: {preparedInput.metadata.preparationTime}ms</div>
                        <div>
                          Dimensions: {preparedInput.metadata.dimensions.width}×
                          {preparedInput.metadata.dimensions.height}
                        </div>
                        <div>
                          Compression: {(preparedInput.metadata.compression * 100).toFixed(0)}%
                        </div>
                        <div>Watermarked: {preparedInput.metadata.watermarked ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Constraints Applied</h3>
                      <div className="text-sm space-y-1">
                        <div>
                          Position: ({preparedInput.metadata.constraints.position.x.toFixed(2)},{' '}
                          {preparedInput.metadata.constraints.position.y.toFixed(2)})
                        </div>
                        <div>Scale: {preparedInput.metadata.constraints.scale.toFixed(2)}</div>
                        <div>
                          Valid: {preparedInput.metadata.constraints.isValid ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div>
                    <h3 className="font-medium mb-2">Combined Image Preview</h3>
                    <div className="border rounded p-2 bg-gray-50">
                      {preparedInput.combinedImageUrl ? (
                        <img
                          src={preparedInput.combinedImageUrl}
                          alt="Combined mockup preview"
                          className="max-w-full max-h-48 mx-auto"
                          onError={() => console.log('Image failed to load')}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Combined image preview will appear here
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mockup Generation Results */}
            {mockupResult && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Mockup Generation Result</h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          mockupResult.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : mockupResult.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : mockupResult.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {mockupResult.status}
                      </span>
                    </div>
                    <div>
                      <strong>ID:</strong> {mockupResult.id}
                    </div>
                    <div>
                      <strong>Created:</strong> {mockupResult.createdAt.toLocaleString()}
                    </div>
                    <div>
                      <strong>Processing Time:</strong> {mockupResult.processingTime}ms
                    </div>
                  </div>

                  {mockupResult.error && (
                    <div className="p-3 bg-red-50 rounded text-red-700 text-sm">
                      <strong>Error:</strong> {mockupResult.error}
                    </div>
                  )}

                  {mockupResult.generatedImageUrl && (
                    <div>
                      <h3 className="font-medium mb-2">Generated Mockup</h3>
                      <img
                        src={mockupResult.generatedImageUrl}
                        alt="Generated mockup"
                        className="max-w-full rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">Task 5.2.3 Implementation Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Completed Features</h3>
              <div className="space-y-2">
                {[
                  'Input validation and processing',
                  'Logo image processing pipeline',
                  'Constraint application integration',
                  'Product and logo image combination',
                  'Constraint mask generation',
                  'AI prompt generation integration',
                  'Image dimension normalization',
                  'Image compression implementation',
                  'Watermark support (configurable)',
                  'Metadata package creation',
                  'Complete pipeline orchestration',
                  'Interactive test interface',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Technical Implementation</h3>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>Input Types:</strong> File uploads, URLs, multiple formats
                </div>
                <div>
                  • <strong>Image Processing:</strong> Canvas API, dimension scaling
                </div>
                <div>
                  • <strong>Constraint Integration:</strong> Real constraint application
                </div>
                <div>
                  • <strong>AI Integration:</strong> Connects to Google AI pipeline
                </div>
                <div>
                  • <strong>Metadata Tracking:</strong> Complete processing history
                </div>
                <div>
                  • <strong>Error Handling:</strong> Comprehensive error recovery
                </div>
                <div>
                  • <strong>Performance:</strong> Async processing, progress tracking
                </div>
                <div>
                  • <strong>Quality Control:</strong> Multiple quality levels supported
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
