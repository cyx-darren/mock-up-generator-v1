'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  disabled = false,
}: SliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentValue = value[0] || 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const rawValue = (percentage / 100) * (max - min) + min;
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onValueChange([clampedValue]);
    },
    [min, max, step, onValueChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      updateValue(e.clientX);
    },
    [disabled, updateValue]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updateValue(e.clientX);
    },
    [isDragging, updateValue]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative flex items-center w-full ${className}`} aria-disabled={disabled}>
      <div
        ref={sliderRef}
        className={`relative h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        {/* Track */}
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={`absolute w-5 h-5 bg-white border-2 border-blue-600 rounded-full transform -translate-y-1/2 top-1/2 shadow-lg transition-all ${
            isDragging ? 'scale-110' : ''
          } ${disabled ? 'cursor-not-allowed' : 'cursor-grab'} ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>
    </div>
  );
}
