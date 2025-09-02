'use client';

import React from 'react';
import { DetectedArea } from '@/lib/constraint-detection/greenColorDetector';
import {
  ValidationResult,
  ConstraintMetrics,
} from '@/lib/constraint-detection/constraintCalculator';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

interface ConstraintStatsProps {
  detectedArea: DetectedArea | null;
  validation?: ValidationResult | null;
  metrics?: ConstraintMetrics | null;
  imageWidth?: number;
  imageHeight?: number;
  showDetailedStats?: boolean;
}

export function ConstraintStats({
  detectedArea,
  validation,
  metrics,
  imageWidth = 0,
  imageHeight = 0,
  showDetailedStats = false,
}: ConstraintStatsProps) {
  if (!detectedArea) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-4">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">No constraint area detected</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Upload an image with green marked areas
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Validation Status
              </h3>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  validation.isValid
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {validation.isValid ? 'Valid' : 'Issues Found'}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {/* Quality Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quality Score
                </span>
                <span className="text-sm font-bold">{Math.round(validation.score * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    validation.score > 0.7
                      ? 'bg-green-600'
                      : validation.score > 0.4
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${validation.score * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  Warnings ({validation.warnings.length})
                </h4>
                <div className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <Alert key={index} type="warning" message={warning} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {validation.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Recommendations ({validation.recommendations.length})
                </h4>
                <div className="space-y-1">
                  {validation.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-2"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Basic Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detection Statistics
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {detectedArea.pixels.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Detected Pixels</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {detectedArea.percentage}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Image Coverage</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {detectedArea.quality.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Quality Score</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {detectedArea.contours.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Detected Areas</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Area Dimensions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Area Dimensions</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Size</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {detectedArea.bounds.width} × {detectedArea.bounds.height} px
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aspect Ratio</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {detectedArea.aspectRatio}:1
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Position</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ({detectedArea.bounds.x}, {detectedArea.bounds.y})
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Centroid</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                ({detectedArea.centroid.x}, {detectedArea.centroid.y})
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Usable Area */}
      {validation?.usableArea && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Usable Logo Area
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usable Size</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {validation.usableArea.bounds.width} × {validation.usableArea.bounds.height} px
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usable Area</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {validation.usableArea.pixels.toLocaleString()} px²
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Area Efficiency</div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${validation.usableArea.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {validation.usableArea.percentage}% of detected area is usable
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Detailed Metrics */}
      {showDetailedStats && metrics && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Metrics
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {/* Edge Distances */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Edge Distances
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Top:</span>
                    <span className="text-sm font-medium">{metrics.edgeDistances.top}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Right:</span>
                    <span className="text-sm font-medium">{metrics.edgeDistances.right}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bottom:</span>
                    <span className="text-sm font-medium">{metrics.edgeDistances.bottom}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Left:</span>
                    <span className="text-sm font-medium">{metrics.edgeDistances.left}px</span>
                  </div>
                </div>
              </div>

              {/* Center Offset */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Center Offset
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">X Offset:</span>
                    <span className="text-sm font-medium">{metrics.centerOffset.x}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Y Offset:</span>
                    <span className="text-sm font-medium">{metrics.centerOffset.y}px</span>
                  </div>
                </div>
              </div>

              {/* Compactness */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Compactness
                  </span>
                  <span className="text-sm font-bold">
                    {Math.round(metrics.compactness * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.compactness * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How well the area fills its bounding box
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
