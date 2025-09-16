'use client';

import React from 'react';

interface ViewToggleProps {
  currentView: 'front' | 'back';
  onViewChange: (view: 'front' | 'back') => void;
  hasBackView: boolean;
  frontMockup?: string | null;
  backMockup?: string | null;
}

export function ViewToggle({
  currentView,
  onViewChange,
  hasBackView,
  frontMockup,
  backMockup,
}: ViewToggleProps) {
  return (
    <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        onClick={() => onViewChange('front')}
        disabled={!frontMockup}
        className={`
          px-4 py-2 rounded-md font-medium transition-all duration-200
          ${
            currentView === 'front'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }
          ${!frontMockup ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={frontMockup ? 'View front side' : 'Front view not available'}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Front View</span>
          {frontMockup && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded">
              ✓
            </span>
          )}
        </div>
      </button>

      <button
        onClick={() => onViewChange('back')}
        disabled={!hasBackView || !backMockup}
        className={`
          px-4 py-2 rounded-md font-medium transition-all duration-200
          ${
            currentView === 'back'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }
          ${!hasBackView || !backMockup ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={
          !hasBackView
            ? 'Product does not support back printing'
            : !backMockup
              ? 'Generate front view first'
              : 'View back side'
        }
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <span>Back View</span>
          {hasBackView && backMockup && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded">
              ✓
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactViewToggle({
  currentView,
  onViewChange,
  hasBackView,
  className = '',
}: Omit<ViewToggleProps, 'frontMockup' | 'backMockup'> & { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded ${className}`}
    >
      <button
        onClick={() => onViewChange('front')}
        className={`
          px-2 py-1 text-xs rounded transition-all duration-200
          ${
            currentView === 'front'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }
        `}
        title="Front view"
      >
        Front
      </button>
      <button
        onClick={() => onViewChange('back')}
        disabled={!hasBackView}
        className={`
          px-2 py-1 text-xs rounded transition-all duration-200
          ${
            currentView === 'back'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }
          ${!hasBackView ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={hasBackView ? 'Back view' : 'Back view not available'}
      >
        Back
      </button>
    </div>
  );
}
