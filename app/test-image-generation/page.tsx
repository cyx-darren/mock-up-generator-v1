'use client';

import React, { useState, useCallback } from 'react';
import { GoogleAIApiClient, ImageGenerationOptions } from '../../lib/google-ai-api-client';

export default function TestImageGenerationPage() {
  const [client] = useState(() => new GoogleAIApiClient());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  // Image generation states
  const [prompt, setPrompt] = useState(
    'Create a picture of a nano banana dish in a fancy restaurant'
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3' | '3:4'>('1:1');
  const [seed, setSeed] = useState<number>(42);
  const [includeText, setIncludeText] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [tokensUsed, setTokensUsed] = useState<number | null>(null);

  // Check connection
  const checkConnection = useCallback(async () => {
    try {
      const result = await client.checkConnection();
      setIsConnected(result.connected);
      setConnectionMessage(result.message);
    } catch (err: any) {
      setIsConnected(false);
      setConnectionMessage('Failed to check connection');
      setError(err.message);
    }
  }, [client]);

  // Generate image
  const generateImage = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setGenerationTime(null);
    setTokensUsed(null);

    try {
      const options: ImageGenerationOptions = {
        prompt,
        aspectRatio,
        seed: seed || undefined,
        includeText,
      };

      const startTime = Date.now();
      const result = await client.generateImage(options);
      const endTime = Date.now();

      setGeneratedImages(result.images);
      setGenerationTime(endTime - startTime);
      setTokensUsed(result.tokensUsed || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, [client, prompt, aspectRatio, seed, includeText]);

  // Test prompts
  const testPrompts = [
    'Create a picture of a nano banana dish in a fancy restaurant',
    'A futuristic robot painting a sunset landscape',
    'A cozy coffee shop with warm lighting and vintage furniture',
    'An underwater city with glowing coral and swimming fish',
    'A magical forest with floating crystals and ethereal light',
  ];

  // Initialize connection check
  React.useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Image Generation Test (Gemini)</h1>

        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">API Connection Status</h2>

          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
            />
            <span className="font-medium">{connectionMessage || 'Not checked'}</span>
          </div>

          <button
            onClick={checkConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Check Connection
          </button>
        </div>

        {/* Image Generation */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate Images</h2>

          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border rounded h-32 font-mono text-sm"
              placeholder="Describe the image you want to generate..."
            />
          </div>

          {/* Quick Prompts */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Quick Prompts:</label>
            <div className="flex flex-wrap gap-2">
              {testPrompts.map((testPrompt, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(testPrompt)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  {testPrompt.substring(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="3:4">Tall (3:4)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seed (optional)</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded"
                placeholder="42"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeText}
                  onChange={(e) => setIncludeText(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Include text in image</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={generateImage}
              disabled={!isConnected || isGenerating || !prompt}
              className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </button>

            <button
              onClick={() => {
                setGeneratedImages([]);
                setError(null);
                setGenerationTime(null);
                setTokensUsed(null);
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>

          {/* Generation Stats */}
          {(generationTime || tokensUsed) && (
            <div className="mb-4 p-3 bg-blue-50 rounded">
              {generationTime && (
                <span className="text-sm">Generation time: {generationTime}ms</span>
              )}
              {tokensUsed && <span className="text-sm ml-4">Tokens used: {tokensUsed}</span>}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Generated Images ({generatedImages.length}):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="border rounded p-4">
                    {image.data !== 'placeholder-base64-image-data' ? (
                      <img
                        src={`data:${image.mimeType};base64,${image.data}`}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-auto rounded"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500">Placeholder Image</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Type: {image.mimeType}</div>
                      {image.seed && <div>Seed: {image.seed}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Task Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Task 5.1.2 Implementation Status</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Model documentation studied</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Model parameters configured (gemini-2.5-flash-image-preview)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Input formatting implemented (aspect ratio, seed, text options)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Output parsing implemented (base64 image extraction)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Timeout handling added (60s server, 120s client)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Retry logic integrated from existing client</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-50 rounded">
            <h3 className="font-semibold mb-2">Implementation Details:</h3>
            <ul className="text-sm space-y-1">
              <li>
                • <strong>Model:</strong> gemini-2.5-flash-image-preview
              </li>
              <li>
                • <strong>API Route:</strong> /api/google-ai/image (POST)
              </li>
              <li>
                • <strong>Supported Formats:</strong> PNG, JPEG (base64 encoded)
              </li>
              <li>
                • <strong>Aspect Ratios:</strong> 1:1, 16:9, 9:16, 4:3, 3:4
              </li>
              <li>
                • <strong>Timeout:</strong> 60s server / 120s client
              </li>
              <li>
                • <strong>Watermark:</strong> SynthID watermark included
              </li>
              <li>
                • <strong>Features:</strong> Seed control, text inclusion toggle
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
