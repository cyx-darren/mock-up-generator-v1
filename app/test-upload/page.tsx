'use client';

import React, { useState } from 'react';
import { FileUpload, UploadFile } from '@/components/upload/FileUpload';
import { Button } from '@/components/ui/Button';

export default function TestUploadPage() {
  const [uploadResults, setUploadResults] = useState<string[]>([]);
  const [simulateProgress, setSimulateProgress] = useState(false);

  const handleFilesAdded = (files: File[]) => {
    console.log('Files added:', files);
    setUploadResults((prev) => [
      ...prev,
      `Added ${files.length} file(s): ${files.map((f) => f.name).join(', ')}`,
    ]);

    // Simulate upload progress for testing
    if (simulateProgress) {
      files.forEach((file, index) => {
        simulateUpload(file.name, index * 1000);
      });
    }
  };

  const simulateUpload = (fileName: string, delay: number) => {
    setTimeout(() => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadResults((prev) => [...prev, `✅ Upload completed: ${fileName}`]);
        }
        // Note: In a real implementation, you would update the FileUpload component's progress
        console.log(`Upload progress for ${fileName}: ${progress.toFixed(1)}%`);
      }, 200);
    }, delay);
  };

  const handleUploadProgress = (fileId: string, progress: number) => {
    console.log(`Upload progress for ${fileId}: ${progress}%`);
  };

  const handleUploadComplete = (fileId: string, result: any) => {
    console.log(`Upload completed for ${fileId}:`, result);
    setUploadResults((prev) => [...prev, `✅ Upload completed for file ID: ${fileId}`]);
  };

  const handleUploadError = (fileId: string, error: string) => {
    console.log(`Upload error for ${fileId}:`, error);
    setUploadResults((prev) => [...prev, `❌ Upload error for file ID ${fileId}: ${error}`]);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              File Upload Component Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Test the drag-and-drop file upload functionality with validation and queue management.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Component */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Upload Files
                </h2>
                <FileUpload
                  onFilesAdded={handleFilesAdded}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxFiles={5}
                  multiple={true}
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={simulateProgress}
                    onChange={(e) => setSimulateProgress(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Simulate upload progress
                  </span>
                </label>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Test Results
                  </h2>
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                    disabled={uploadResults.length === 0}
                  >
                    Clear Results
                  </Button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[300px]">
                  {uploadResults.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No upload activity yet. Try uploading some files!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {uploadResults.map((result, index) => (
                        <div
                          key={index}
                          className="text-sm font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded border-l-2 border-blue-500"
                        >
                          <span className="text-gray-500 dark:text-gray-400">
                            [{new Date().toLocaleTimeString()}]
                          </span>{' '}
                          <span className="text-gray-900 dark:text-gray-100">{result}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Test Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Test Instructions
                </h3>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• Drag and drop image files (PNG, JPG, SVG, WebP)</p>
                  <p>• Click "Choose Files" to use file picker</p>
                  <p>• Test file validation with invalid types/sizes</p>
                  <p>• Try uploading more than 5 files</p>
                  <p>• Test duplicate file detection</p>
                  <p>• Use cancel/remove buttons</p>
                  <p>• Enable progress simulation for demo</p>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  Features Implemented
                </h3>
                <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Drag-and-drop zone with visual feedback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>File input fallback</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>File type validation (PNG, JPG, SVG, WebP)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>File size validation (10MB max)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Upload queue system with progress tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Cancel upload functionality</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>File preview with thumbnails</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Duplicate file detection</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Error handling and user feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
