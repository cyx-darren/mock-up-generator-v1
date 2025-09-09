'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  width?: number;
  height?: number;
  initialPosition?: number; // 0 to 100
  className?: string;
  onPositionChange?: (position: number) => void;
}

export function ComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  width = 600,
  height = 400,
  initialPosition = 50,
  className = '',
  onPositionChange
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
    
    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      updatePosition(e.touches[0].clientX);
    }
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      updatePosition(e.touches[0].clientX);
    }
  }, [isDragging, updatePosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newPosition = position;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newPosition = Math.max(position - 1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newPosition = Math.min(position + 1, 100);
        break;
      case 'Home':
        e.preventDefault();
        newPosition = 0;
        break;
      case 'End':
        e.preventDefault();
        newPosition = 100;
        break;
      case ' ':
        e.preventDefault();
        newPosition = 50;
        break;
    }
    
    if (newPosition !== position) {
      setPosition(newPosition);
      onPositionChange?.(newPosition);
    }
  }, [position, onPositionChange]);

  // Global mouse events for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div 
      className={`relative select-none ${className}`}
      style={{ width, height }}
    >
      {/* Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-lg cursor-col-resize"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          if (!isDragging) setIsDragging(false);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Image comparison slider"
      >
        {/* Before Image (Right Side) */}
        <div className="absolute inset-0">
          <Image
            src={beforeImage}
            alt={beforeLabel}
            width={width}
            height={height}
            className="w-full h-full object-cover"
            priority
          />
          
          {/* Before Label */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Left Side) - Clipped */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`
          }}
        >
          <Image
            src={afterImage}
            alt={afterLabel}
            width={width}
            height={height}
            className="w-full h-full object-cover"
            priority
          />
          
          {/* After Label - Only visible when slider is far enough right */}
          {position > 20 && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
              {afterLabel}
            </div>
          )}
        </div>

        {/* Slider Line */}
        <div
          className={`absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-opacity duration-200 ${
            isHovering || isDragging ? 'opacity-100' : 'opacity-80'
          }`}
          style={{ left: `${position}%` }}
        >
          {/* Slider Handle */}
          <div
            ref={sliderRef}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center cursor-col-resize transition-all duration-200 ${
              isHovering || isDragging ? 'scale-110' : 'scale-100'
            }`}
          >
            {/* Left Arrow */}
            <svg className="w-3 h-3 text-gray-600 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            
            {/* Right Arrow */}
            <svg className="w-3 h-3 text-gray-600 -mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Vertical line extensions */}
          <div className="absolute -top-2 left-0 right-0 h-2 bg-white"></div>
          <div className="absolute -bottom-2 left-0 right-0 h-2 bg-white"></div>
        </div>

        {/* Position Indicator */}
        {(isHovering || isDragging) && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {Math.round(position)}%
          </div>
        )}

        {/* Instructions */}
        <div className={`absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-xs transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}>
          Drag to compare • Arrow keys • Space for center
        </div>
      </div>
    </div>
  );
}

// Vertical Comparison Slider
export function VerticalComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  width = 400,
  height = 600,
  initialPosition = 50,
  className = '',
  onPositionChange
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = Math.min(Math.max(((clientY - rect.top) / rect.height) * 100, 0), 100);
    
    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientY);
  }, [updatePosition]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      updatePosition(e.touches[0].clientY);
    }
  }, [updatePosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newPosition = position;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newPosition = Math.max(position - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newPosition = Math.min(position + 1, 100);
        break;
      case 'Home':
        e.preventDefault();
        newPosition = 0;
        break;
      case 'End':
        e.preventDefault();
        newPosition = 100;
        break;
      case ' ':
        e.preventDefault();
        newPosition = 50;
        break;
    }
    
    if (newPosition !== position) {
      setPosition(newPosition);
      onPositionChange?.(newPosition);
    }
  }, [position, onPositionChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        updatePosition(e.touches[0].clientY);
      }
    };

    const handleGlobalEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <div 
      className={`relative select-none ${className}`}
      style={{ width, height }}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden rounded-lg cursor-row-resize"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          if (!isDragging) setIsDragging(false);
        }}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Vertical image comparison slider"
      >
        {/* Before Image (Bottom) */}
        <div className="absolute inset-0">
          <Image
            src={beforeImage}
            alt={beforeLabel}
            width={width}
            height={height}
            className="w-full h-full object-cover"
            priority
          />
          
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Top) - Clipped */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath: `polygon(0 0, 100% 0, 100% ${position}%, 0 ${position}%)`
          }}
        >
          <Image
            src={afterImage}
            alt={afterLabel}
            width={width}
            height={height}
            className="w-full h-full object-cover"
            priority
          />
          
          {position > 20 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
              {afterLabel}
            </div>
          )}
        </div>

        {/* Slider Line */}
        <div
          className={`absolute left-0 right-0 h-0.5 bg-white shadow-lg transition-opacity duration-200 ${
            isHovering || isDragging ? 'opacity-100' : 'opacity-80'
          }`}
          style={{ top: `${position}%` }}
        >
          {/* Slider Handle */}
          <div
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex flex-col items-center justify-center cursor-row-resize transition-all duration-200 ${
              isHovering || isDragging ? 'scale-110' : 'scale-100'
            }`}
          >
            {/* Up Arrow */}
            <svg className="w-3 h-3 text-gray-600 -mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            
            {/* Down Arrow */}
            <svg className="w-3 h-3 text-gray-600 -mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Horizontal line extensions */}
          <div className="absolute top-0 -left-2 bottom-0 w-2 bg-white"></div>
          <div className="absolute top-0 -right-2 bottom-0 w-2 bg-white"></div>
        </div>
      </div>
    </div>
  );
}