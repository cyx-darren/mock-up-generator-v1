'use client';

import React, { useState, useEffect } from 'react';
import { microInteractions, successAnimations, durations, easingFunctions } from './AnimationUtils';

// Button with micro-interactions
export function InteractiveButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
  disabled?: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  return (
    <button
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 transform ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        transform: `scale(${isPressed ? '0.95' : isHovered ? '1.02' : '1'})`,
        boxShadow:
          isHovered && !disabled
            ? '0 8px 25px rgba(0, 0, 0, 0.15)'
            : '0 2px 10px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Heart animation
export function HeartButton({
  isLiked = false,
  onToggle,
  className = '',
}: {
  isLiked?: boolean;
  onToggle?: (liked: boolean) => void;
  className?: string;
}) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onToggle?.(!isLiked);

    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-300'} ${className}`}
      onClick={handleClick}
    >
      <svg
        className="w-6 h-6"
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{
          animation: animating ? `${microInteractions.heartbeat} 0.6s ease-in-out` : 'none',
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}

// Wiggle animation trigger
export function WiggleOnClick({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isWiggling, setIsWiggling] = useState(false);

  const handleClick = () => {
    setIsWiggling(true);
    setTimeout(() => setIsWiggling(false), 820);
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      style={{
        animation: isWiggling ? `${microInteractions.wiggle} 0.82s ease-in-out` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </div>
  );
}

// Rubber band effect
export function RubberBandClick({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      style={{
        animation: isAnimating ? `${microInteractions.rubberBand} 1s ease-in-out` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </div>
  );
}

// Tada effect
export function TadaClick({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      style={{
        animation: isAnimating ? `${microInteractions.tada} 1s ease-in-out` : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </div>
  );
}

// Floating action button
export function FloatingActionButton({
  children,
  onClick,
  position = 'bottom-right',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <button
      className={`fixed z-50 w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${positionClasses[position]} ${className}`}
      style={{
        transform: `scale(${isHovered ? '1.1' : '1'})`,
        boxShadow: isHovered
          ? '0 12px 30px rgba(59, 130, 246, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Input with focus animations
export function AnimatedInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 peer"
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFocused || hasValue
            ? 'text-sm text-blue-500 -translate-y-7 bg-white px-1'
            : 'text-gray-500 top-3'
        }`}
      >
        {label}
      </label>
    </div>
  );
}

// Toggle switch with animation
export function AnimatedToggle({
  isOn,
  onToggle,
  size = 'md',
  className = '',
}: {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: { switch: 'w-10 h-6', circle: 'w-4 h-4', translate: 'translate-x-4' },
    md: { switch: 'w-12 h-7', circle: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { switch: 'w-14 h-8', circle: 'w-6 h-6', translate: 'translate-x-6' },
  };

  return (
    <button
      className={`relative inline-flex ${sizes[size].switch} items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isOn ? 'bg-blue-500' : 'bg-gray-300'
      } ${className}`}
      onClick={() => onToggle(!isOn)}
    >
      <span
        className={`inline-block ${sizes[size].circle} bg-white rounded-full transform transition-transform duration-300 ease-in-out ${
          isOn ? sizes[size].translate : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Progress steps with animation
export function AnimatedSteps({
  currentStep,
  steps,
  className = '',
}: {
  currentStep: number;
  steps: string[];
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-1 transition-all duration-500 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
