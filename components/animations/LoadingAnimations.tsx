'use client';

import React from 'react';
import { loadingAnimations, durations, easingFunctions } from './AnimationUtils';

// Spinner component
export function Spinner({
  size = 'md',
  color = 'blue-500',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div
      className={`inline-block ${sizeClasses[size]} border-2 border-gray-200 border-t-${color} rounded-full ${className}`}
      style={{
        animation: `${loadingAnimations.spin} 1s linear infinite`,
      }}
    />
  );
}

// Pulsing dots
export function PulsingDots({
  color = 'blue-500',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div className={`flex space-x-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-3 h-3 bg-${color} rounded-full`}
          style={{
            animation: `${loadingAnimations.pulse} 1.4s ease-in-out infinite both`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

// Wave loading
export function WaveLoading({
  color = 'blue-500',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`w-2 h-8 bg-${color} rounded-sm`}
          style={{
            animation: `${loadingAnimations.wave} 1.2s ease-in-out infinite`,
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Skeleton loading
export function SkeletonLoading({
  width = '100%',
  height = '20px',
  className = '',
  variant = 'rectangular',
}: {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
}) {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-gray-200';
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width,
        height,
        backgroundSize: '200px 100%',
        animation: `${loadingAnimations.skeleton} 1.5s ease-in-out infinite`,
      }}
    />
  );
}

// Bouncing balls
export function BouncingBalls({
  color = 'blue-500',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`w-4 h-4 bg-${color} rounded-full`}
          style={{
            animation: `${loadingAnimations.bounce} 1.4s ease-in-out infinite both`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

// Progress bar with animation
export function AnimatedProgressBar({
  progress = 0,
  color = 'blue-500',
  backgroundColor = 'gray-200',
  height = 'h-2',
  className = '',
  showPercentage = false,
}: {
  progress?: number;
  color?: string;
  backgroundColor?: string;
  height?: string;
  className?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={`w-full bg-${backgroundColor} rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} bg-${color} rounded-full transition-all duration-300 ease-out`}
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundImage: `linear-gradient(
              45deg,
              rgba(255,255,255,0.2) 25%,
              transparent 25%,
              transparent 50%,
              rgba(255,255,255,0.2) 50%,
              rgba(255,255,255,0.2) 75%,
              transparent 75%,
              transparent
            )`,
            backgroundSize: '20px 20px',
            animation: progress > 0 ? `${loadingAnimations.skeleton} 1s linear infinite` : 'none',
          }}
        />
      </div>
    </div>
  );
}

// Loading overlay
export function LoadingOverlay({
  isVisible = false,
  message = 'Loading...',
  className = '',
}: {
  isVisible?: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      style={{
        backdropFilter: 'blur(4px)',
        animation: `${loadingAnimations.pulse} 2s ease-in-out infinite`,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center space-y-4 shadow-xl">
        <Spinner size="lg" />
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}

// Shimmer effect for loading cards
export function ShimmerCard({ className = '', lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <SkeletonLoading key={index} height="16px" width={index === lines - 1 ? '60%' : '100%'} />
        ))}
      </div>
    </div>
  );
}

// Typing indicator
export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      <span className="text-gray-500">Typing</span>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="text-gray-500"
          style={{
            animation: `${loadingAnimations.pulse} 1.4s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        >
          .
        </span>
      ))}
    </div>
  );
}
