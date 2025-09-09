'use client';

import React, { useState, useEffect } from 'react';
import {
  getPromptEngineeringService,
  PromptGenerationRequest,
  GeneratedPrompt,
  PlacementVariation,
  QualityModifier,
} from '../../lib/prompt-engineering';

export default function TestPromptEngineeringPage() {
  const [promptService] = useState(() => getPromptEngineeringService());
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [abTestVariations, setAbTestVariations] = useState<GeneratedPrompt[]>([]);

  // Form state
  const [request, setRequest] = useState<PromptGenerationRequest>({
    productType: 'mug',
    placementType: 'center',
    qualityLevel: 'enhanced',
    stylePreferences: {
      lighting: 'studio',
      angle: 'three-quarter',
      background: 'white',
      mood: 'professional',
      aesthetic: 'minimal',
    },
    customText: 'ACME Corp',
    brandColors: ['#2563eb', '#ffffff'],
    additionalRequirements: [],
  });

  // Available options
  const [availableProducts, setAvailableProducts] = useState<string[]>([]);
  const [availablePlacements, setAvailablePlacements] = useState<PlacementVariation['type'][]>([]);
  const [availableQualities, setAvailableQualities] = useState<QualityModifier['level'][]>([]);

  useEffect(() => {
    // Load available options
    setAvailableProducts(promptService.getAvailableProductTypes());
    setAvailablePlacements(promptService.getAvailablePlacementTypes());
    setAvailableQualities(promptService.getAvailableQualityLevels());

    // Generate initial prompt
    generatePrompt();
  }, []);

  const generatePrompt = () => {
    try {
      const prompt = promptService.generatePrompt(request);
      setGeneratedPrompt(prompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
    }
  };

  const generateABTestVariations = () => {
    try {
      const variations = promptService.generateABTestVariations(request);
      setAbTestVariations(variations);
    } catch (error) {
      console.error('Error generating A/B test variations:', error);
    }
  };

  const updateRequest = (updates: Partial<PromptGenerationRequest>) => {
    const newRequest = { ...request, ...updates };
    setRequest(newRequest);

    // Auto-generate prompt on change
    try {
      const prompt = promptService.generatePrompt(newRequest);
      setGeneratedPrompt(prompt);
    } catch (error) {
      console.error('Error generating prompt:', error);
    }
  };

  const updateStylePreference = (category: string, value: string) => {
    const newStylePreferences = {
      ...request.stylePreferences,
      [category]: value,
    };
    updateRequest({ stylePreferences: newStylePreferences });
  };

  const addRequirement = () => {
    const requirement = prompt('Enter additional requirement:');
    if (requirement) {
      updateRequest({
        additionalRequirements: [...(request.additionalRequirements || []), requirement],
      });
    }
  };

  const removeRequirement = (index: number) => {
    const newRequirements = [...(request.additionalRequirements || [])];
    newRequirements.splice(index, 1);
    updateRequest({ additionalRequirements: newRequirements });
  };

  const addBrandColor = () => {
    const color = prompt('Enter brand color (hex format):');
    if (color) {
      updateRequest({
        brandColors: [...(request.brandColors || []), color],
      });
    }
  };

  const removeBrandColor = (index: number) => {
    const newColors = [...(request.brandColors || [])];
    newColors.splice(index, 1);
    updateRequest({ brandColors: newColors });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Prompt Engineering Test Suite</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Prompt Configuration</h2>

            <div className="space-y-4">
              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Type</label>
                <select
                  value={request.productType}
                  onChange={(e) => updateRequest({ productType: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  {availableProducts.map((product) => (
                    <option key={product} value={product}>
                      {product.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placement Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Placement Type</label>
                <select
                  value={request.placementType}
                  onChange={(e) =>
                    updateRequest({ placementType: e.target.value as PlacementVariation['type'] })
                  }
                  className="w-full p-2 border rounded"
                >
                  {availablePlacements.map((placement) => (
                    <option key={placement} value={placement}>
                      {placement.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Quality Level</label>
                <select
                  value={request.qualityLevel}
                  onChange={(e) =>
                    updateRequest({ qualityLevel: e.target.value as QualityModifier['level'] })
                  }
                  className="w-full p-2 border rounded"
                >
                  {availableQualities.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Text */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom Text</label>
                <input
                  type="text"
                  value={request.customText || ''}
                  onChange={(e) => updateRequest({ customText: e.target.value })}
                  placeholder="Enter text for branding"
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Style Preferences */}
              <div>
                <h3 className="font-medium mb-2">Style Preferences</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {/* Lighting */}
                  <div>
                    <label className="block text-xs mb-1">Lighting</label>
                    <select
                      value={request.stylePreferences.lighting || ''}
                      onChange={(e) => updateStylePreference('lighting', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      {promptService.getStyleOptions('lighting').map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Angle */}
                  <div>
                    <label className="block text-xs mb-1">Angle</label>
                    <select
                      value={request.stylePreferences.angle || ''}
                      onChange={(e) => updateStylePreference('angle', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      {promptService.getStyleOptions('angle').map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Background */}
                  <div>
                    <label className="block text-xs mb-1">Background</label>
                    <select
                      value={request.stylePreferences.background || ''}
                      onChange={(e) => updateStylePreference('background', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      {promptService.getStyleOptions('background').map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-xs mb-1">Mood</label>
                    <select
                      value={request.stylePreferences.mood || ''}
                      onChange={(e) => updateStylePreference('mood', e.target.value)}
                      className="w-full p-1 border rounded text-xs"
                    >
                      <option value="">None</option>
                      {promptService.getStyleOptions('mood').map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Brand Colors */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand Colors</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {request.brandColors?.map((color, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-200 rounded text-xs flex items-center gap-1"
                    >
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
                      {color}
                      <button
                        onClick={() => removeBrandColor(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={addBrandColor}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                >
                  Add Color
                </button>
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Requirements</label>
                <div className="space-y-1 mb-2">
                  {request.additionalRequirements?.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">{req}</span>
                      <button
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addRequirement}
                  className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                >
                  Add Requirement
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={generatePrompt}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Generate Prompt
                </button>
                <button
                  onClick={generateABTestVariations}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  A/B Test Variations
                </button>
              </div>
            </div>
          </div>

          {/* Generated Prompt Display */}
          <div className="space-y-6">
            {/* Main Generated Prompt */}
            {generatedPrompt && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Generated Prompt</h2>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-medium mb-2">Final Prompt</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {generatedPrompt.finalPrompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">Metadata</h4>
                      <div className="text-xs space-y-1">
                        <div>Variation: {generatedPrompt.metadata.variation}</div>
                        <div>
                          Confidence: {(generatedPrompt.metadata.confidence * 100).toFixed(1)}%
                        </div>
                        <div>Est. Tokens: {generatedPrompt.metadata.estimatedTokens}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-1">Quality Modifiers</h4>
                      <div className="text-xs">
                        {generatedPrompt.components.qualityModifiers.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* A/B Test Variations */}
            {abTestVariations.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4">A/B Test Variations</h2>

                <div className="space-y-4">
                  {abTestVariations.map((variation, index) => (
                    <div key={index} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Variation {index + 1}</h3>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                          {variation.metadata.variation}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{variation.finalPrompt}</p>
                      <div className="text-xs text-gray-500">
                        Confidence: {(variation.metadata.confidence * 100).toFixed(1)}% | Tokens:{' '}
                        {variation.metadata.estimatedTokens}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">Task 5.2.2 Implementation Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Completed Features</h3>
              <div className="space-y-2">
                {[
                  'Base prompt templates with variable replacement',
                  'Product-specific prompts for 5 product types',
                  'Placement variations (horizontal, vertical, all-over, corner, center)',
                  'Quality modifiers (basic, enhanced, premium, ultra)',
                  'Style parameters (lighting, angle, background, mood, aesthetic)',
                  'A/B testing system with 3 variations',
                  'Interactive test interface for prompt generation',
                  'Real-time prompt preview and configuration',
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
              <h3 className="font-medium mb-3">Key Implementation Details</h3>
              <div className="text-sm space-y-2">
                <div>
                  • <strong>Template System:</strong> Variable-based prompt construction
                </div>
                <div>
                  • <strong>Product Types:</strong> Mug, T-shirt, Pen, Notebook, Tote Bag
                </div>
                <div>
                  • <strong>Placement Options:</strong> 5 different logo placement strategies
                </div>
                <div>
                  • <strong>Quality Levels:</strong> 4 tiers with increasing sophistication
                </div>
                <div>
                  • <strong>Style Categories:</strong> 5 categories with 3 options each
                </div>
                <div>
                  • <strong>A/B Testing:</strong> Standard, Modern, Premium variations
                </div>
                <div>
                  • <strong>Customization:</strong> Brand colors, custom text, requirements
                </div>
                <div>
                  • <strong>Metadata:</strong> Token estimation and confidence scoring
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
