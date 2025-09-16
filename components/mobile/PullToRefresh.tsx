'use client';

import React, { useState, useRef, useCallback, ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  className?: string;
  disabled?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  resistance = 2,
  className = '',
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const touchStart = useRef<{ y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Only trigger if at the top of the page/container
      const container = containerRef.current;
      if (container && container.scrollTop > 0) return;

      if (e.touches.length === 1) {
        touchStart.current = {
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !touchStart.current) return;

      const container = containerRef.current;
      if (container && container.scrollTop > 0) return;

      const deltaY = e.touches[0].clientY - touchStart.current.y;

      // Only allow pulling down
      if (deltaY > 0) {
        e.preventDefault();

        // Apply resistance to make pulling feel more natural
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setPullDistance(distance);
        setCanRefresh(distance >= threshold);
      }
    },
    [disabled, isRefreshing, threshold, resistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !touchStart.current) return;

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    // Reset state
    setPullDistance(0);
    setCanRefresh(false);
    touchStart.current = null;
  }, [disabled, isRefreshing, canRefresh, pullDistance, threshold, onRefresh]);

  const getRefreshIconRotation = () => {
    if (isRefreshing) return 'animate-spin';
    return `rotate-${Math.min(pullDistance * 2, 180)}deg`;
  };

  const getRefreshText = () => {
    if (isRefreshing) return refreshingText;
    if (canRefresh) return releaseText;
    return pullText;
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center text-gray-600 bg-gray-50 border-b"
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          transform: `translateY(-${Math.max(pullDistance, 0)}px)`,
          opacity: pullDistance > 20 ? 1 : pullDistance / 20,
        }}
      >
        {pullDistance > 20 && (
          <>
            {/* Refresh icon */}
            <div className={`transition-transform duration-200 ${getRefreshIconRotation()}`}>
              <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>

            {/* Status text */}
            <div className="text-sm font-medium">{getRefreshText()}</div>

            {/* Progress indicator */}
            <div className="w-16 h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100 ease-out"
                style={{
                  width: `${Math.min((pullDistance / threshold) * 100, 100)}%`,
                }}
              />
            </div>
          </>
        )}
      </div>

      {children}
    </div>
  );
}

// Enhanced pull-to-refresh with custom animations
export function AnimatedPullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStage, setRefreshStage] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>(
    'idle'
  );

  const touchStart = useRef<{ y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const container = containerRef.current;
      if (container && container.scrollTop > 0) return;

      touchStart.current = { y: e.touches[0].clientY };
      setRefreshStage('pulling');
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !touchStart.current) return;

      const container = containerRef.current;
      if (container && container.scrollTop > 0) return;

      const deltaY = e.touches[0].clientY - touchStart.current.y;

      if (deltaY > 0) {
        e.preventDefault();

        const distance = Math.min(deltaY * 0.5, threshold * 1.2);
        setPullDistance(distance);

        if (distance >= threshold && refreshStage !== 'ready') {
          setRefreshStage('ready');
          // Add haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        } else if (distance < threshold && refreshStage !== 'pulling') {
          setRefreshStage('pulling');
        }
      }
    },
    [disabled, isRefreshing, threshold, refreshStage]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !touchStart.current) return;

    if (refreshStage === 'ready') {
      setRefreshStage('refreshing');
      setIsRefreshing(true);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setRefreshStage('idle');
      }
    } else {
      setRefreshStage('idle');
    }

    setPullDistance(0);
    touchStart.current = null;
  }, [disabled, isRefreshing, refreshStage, onRefresh]);

  const getIndicatorContent = () => {
    switch (refreshStage) {
      case 'pulling':
        return (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2" />
            <span className="text-sm text-gray-600">Pull to refresh</span>
          </div>
        );
      case 'ready':
        return (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm text-blue-600 font-medium">Release to refresh</span>
          </div>
        );
      case 'refreshing':
        return (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2 animate-spin" />
            <span className="text-sm text-blue-600">Refreshing...</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition:
          refreshStage === 'idle' || isRefreshing
            ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-gray-50 to-transparent"
        style={{
          height: `${Math.max(pullDistance + 20, 0)}px`,
          transform: `translateY(-${Math.max(pullDistance + 20, 0)}px)`,
          opacity: pullDistance > 10 ? 1 : pullDistance / 10,
        }}
      >
        {pullDistance > 10 && getIndicatorContent()}
      </div>

      {children}
    </div>
  );
}

// Simple refresh button for non-touch devices
export function RefreshButton({
  onRefresh,
  isRefreshing = false,
  className = '',
}: {
  onRefresh: () => void | Promise<void>;
  isRefreshing?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg
        className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
