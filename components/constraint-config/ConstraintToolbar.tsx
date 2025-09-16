'use client';

import React from 'react';
import { Button } from '../ui/Button';

interface ConstraintToolbarProps {
  showGrid: boolean;
  onToggleGrid: () => void;
  showMeasurement: boolean;
  onToggleMeasurement: () => void;
  showGuidelines: boolean;
  onToggleGuidelines: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ConstraintToolbar({
  showGrid,
  onToggleGrid,
  showMeasurement,
  onToggleMeasurement,
  showGuidelines,
  onToggleGuidelines,
  snapToGrid,
  onToggleSnapToGrid,
  gridSize,
  onGridSizeChange,
  onClearAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ConstraintToolbarProps) {
  const gridSizes = [10, 20, 25, 50];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
      {/* View Controls */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
        <Button
          variant={showGrid ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleGrid}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          Grid
        </Button>

        <Button
          variant={showMeasurement ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleMeasurement}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Measure
        </Button>

        <Button
          variant={showGuidelines ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleGuidelines}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Guides
        </Button>
      </div>

      {/* Snap Controls */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Snap:</span>
        <Button
          variant={snapToGrid ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleSnapToGrid}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          To Grid
        </Button>

        {snapToGrid && (
          <select
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {gridSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        )}
      </div>

      {/* History Controls */}
      <div className="flex items-center gap-2 border-r border-gray-300 dark:border-gray-600 pr-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="flex items-center gap-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Clear All
        </Button>
      </div>

      {/* Help */}
      <div className="ml-auto">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block mr-3">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Click</kbd>{' '}
            Create
          </span>
          <span className="inline-block mr-3">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Drag</kbd>{' '}
            Move
          </span>
          <span className="inline-block mr-3">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Del</kbd>{' '}
            Remove
          </span>
          <span className="inline-block">
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd>{' '}
            Deselect
          </span>
        </div>
      </div>
    </div>
  );
}
