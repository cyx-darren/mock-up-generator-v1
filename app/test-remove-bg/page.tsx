'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
interface RemoveBgResponse {
  data: Blob;
  detectedType?: string;
  result?: {
    width: number;
    height: number;
    credits_charged: number;
  };
}

interface RemoveBgError {
  title: string;
  detail: string;
  code: string;
  status: number;
}

export default function TestRemoveBgPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<RemoveBgResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResult(null);
      setPreviewUrl(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
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
      formData.append('size', 'preview');
      formData.append('format', 'png');

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to process image');
      }

      // Get metadata from headers
      const detectedType = response.headers.get('X-Detected-Type') || undefined;
      const width = parseInt(response.headers.get('X-Width') || '0');
      const height = parseInt(response.headers.get('X-Height') || '0');
      const creditsCharged = parseInt(response.headers.get('X-Credits-Charged') || '0');

      // Get image data
      const blob = await response.blob();

      const processedResponse: RemoveBgResponse = {
        data: blob,
        detectedType,
        result: {
          width,
          height,
          credits_charged: creditsCharged,
        },
      };

      setResult(processedResponse);

      // Create blob URL for display
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);

      // Update usage stats
      await handleRefreshStats();
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

  const handleCheckCredits = async () => {
    try {
      const response = await fetch('/api/remove-bg/credits');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to check credits');
      }
      const creditInfo = await response.json();
      setCredits(creditInfo);
    } catch (err) {
      console.error('Credits check error:', err);
      if (err instanceof Error) {
        setError(`Credits check failed: ${err.message}`);
      }
    }
  };

  const handleRefreshStats = async () => {
    try {
      const response = await fetch('/api/remove-bg');
      if (!response.ok) {
        console.error('Failed to fetch usage stats');
        return;
      }
      const stats = await response.json();
      setUsageStats(stats);
    } catch (err) {
      console.error('Usage stats error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Remove.bg API Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test background removal functionality using Remove.bg API
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload and Controls */}
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
                      Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </div>
                  )}

                  <Button
                    onClick={handleRemoveBackground}
                    disabled={!selectedFile || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? 'Removing Background...' : 'Remove Background'}
                  </Button>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  API Information
                </h2>

                <div className="space-y-4">
                  <Button onClick={handleCheckCredits} variant="outline" className="w-full">
                    Check Credits
                  </Button>

                  <Button onClick={handleRefreshStats} variant="outline" className="w-full">
                    Refresh Usage Stats
                  </Button>

                  {credits && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Account Credits
                      </h3>
                      <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <p>Total: {credits.credits?.total || 'N/A'}</p>
                        <p>Subscription: {credits.credits?.subscription || 'N/A'}</p>
                        <p>Pay-as-you-go: {credits.credits?.payg || 'N/A'}</p>
                        <p>Free Calls: {credits.api?.free_calls || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {usageStats && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Usage Statistics
                      </h3>
                      <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                        <p>Total Requests: {usageStats.totalRequests}</p>
                        <p>Successful: {usageStats.successfulRequests}</p>
                        <p>Failed: {usageStats.failedRequests}</p>
                        <p>Rate Limited: {usageStats.rateLimitHits}</p>
                        <p>Credits Used: {usageStats.creditsUsed}</p>
                        {usageStats.averageResponseTime && (
                          <p>Avg Response: {Math.round(usageStats.averageResponseTime)}ms</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview and Results */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Preview
                </h2>

                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500">No image selected</div>
                  )}
                </div>
              </div>

              {result && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                  <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">
                    Success!
                  </h2>
                  <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <p>Detected Type: {result.detectedType || 'N/A'}</p>
                    <p>
                      Dimensions: {result.result?.width} × {result.result?.height}
                    </p>
                    <p>Credits Charged: {result.result?.credits_charged}</p>
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
            </div>
          </div>

          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Test Instructions</h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>1. Upload an image file (PNG, JPG, WebP)</p>
              <p>2. Click "Remove Background" to process</p>
              <p>3. Check your API credits and usage statistics</p>
              <p>4. Verify the processed image appears correctly</p>
              <p>5. Test error handling with invalid images or when rate limited</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
