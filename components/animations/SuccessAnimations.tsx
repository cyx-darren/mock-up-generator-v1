'use client';

import React, { useState, useEffect } from 'react';
import { successAnimations, durations, easingFunctions } from './AnimationUtils';

// Animated checkmark
export function AnimatedCheckmark({ 
  size = 64,
  color = '#10B981',
  strokeWidth = 3,
  className = '' 
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
    >
      {/* Circle background */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={color}
        opacity="0.1"
        style={{
          transform: isVisible ? 'scale(1)' : 'scale(0)',
          transition: `transform ${durations.normal} ${easingFunctions.bounceOut}`
        }}
      />
      
      {/* Checkmark */}
      <path
        d="M20 32L28 40L44 24"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="44"
        strokeDashoffset={isVisible ? 0 : 44}
        style={{
          transition: `stroke-dashoffset 0.6s ${easingFunctions.easeOut} 0.2s`
        }}
      />
    </svg>
  );
}

// Success toast notification
export function SuccessToast({ 
  message,
  isVisible = false,
  onClose,
  duration = 4000,
  className = '' 
}: {
  message: string;
  isVisible?: boolean;
  onClose?: () => void;
  duration?: number;
  className?: string;
}) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 ${className}`}
      style={{
        animation: `${successAnimations.fadeInSuccess} 0.5s ease-out`
      }}
    >
      <AnimatedCheckmark size={24} color="white" strokeWidth={2} />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

// Confetti animation
export function ConfettiSuccess({ 
  isActive = false,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  particleCount = 50,
  className = '' 
}: {
  isActive?: boolean;
  colors?: string[];
  particleCount?: number;
  className?: string;
}) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
  }>>([]);

  useEffect(() => {
    if (!isActive) return;

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, colors, particleCount]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animation: `${successAnimations.confetti} 3s ease-out forwards`
          }}
        />
      ))}
    </div>
  );
}

// Success modal
export function SuccessModal({ 
  isOpen = false,
  title = 'Success!',
  message = 'Your action was completed successfully.',
  onClose,
  showConfetti = true,
  className = '' 
}: {
  isOpen?: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
  showConfetti?: boolean;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div
          className={`bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl ${className}`}
          style={{
            animation: `${successAnimations.fadeInSuccess} 0.5s ease-out`
          }}
        >
          <div className="flex justify-center mb-6">
            <AnimatedCheckmark size={80} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          <button
            onClick={onClose}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Continue
          </button>
        </div>
      </div>
      
      {showConfetti && <ConfettiSuccess isActive={isOpen} />}
    </>
  );
}

// Progress success indicator
export function ProgressSuccess({ 
  steps,
  currentStep,
  className = '' 
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-center space-x-3 p-4 rounded-lg transition-all duration-300 ${
            index < currentStep
              ? 'bg-green-50 border border-green-200'
              : index === currentStep
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            {index < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          
          <span
            className={`font-medium transition-colors duration-300 ${
              index < currentStep
                ? 'text-green-700'
                : index === currentStep
                ? 'text-blue-700'
                : 'text-gray-600'
            }`}
          >
            {step}
          </span>
          
          {index < currentStep && (
            <div
              style={{
                animation: `${successAnimations.fadeInSuccess} 0.5s ease-out`
              }}
            >
              <AnimatedCheckmark size={20} color="#10B981" strokeWidth={2} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Success badge
export function SuccessBadge({ 
  text = 'Success',
  className = '' 
}: {
  text?: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`inline-flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: `all ${durations.normal} ${easingFunctions.bounceOut}`
      }}
    >
      <AnimatedCheckmark size={16} color="#10B981" strokeWidth={2} />
      <span>{text}</span>
    </div>
  );
}

// Celebration button
export function CelebrationButton({ 
  children,
  onClick,
  className = '' 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [celebrating, setCelebrating] = useState(false);

  const handleClick = () => {
    setCelebrating(true);
    onClick?.();
    
    setTimeout(() => setCelebrating(false), 3000);
  };

  return (
    <>
      <button
        className={`bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${className}`}
        onClick={handleClick}
      >
        {children}
      </button>
      
      <ConfettiSuccess isActive={celebrating} />
    </>
  );
}