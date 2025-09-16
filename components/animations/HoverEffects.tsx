'use client';

import React, { useState, useRef, useEffect } from 'react';
import { hoverEffects, microInteractions, durations, easingFunctions } from './AnimationUtils';

// Hover lift effect
export function HoverLift({
  children,
  liftHeight = '4px',
  duration = '300ms',
  className = '',
}: {
  children: React.ReactNode;
  liftHeight?: string;
  duration?: string;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`transition-transform ${className}`}
      style={{
        transform: isHovered ? `translateY(-${liftHeight})` : 'translateY(0)',
        transitionDuration: duration,
        transitionTimingFunction: easingFunctions.easeOut,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// Hover scale effect
export function HoverScale({
  children,
  scale = '1.05',
  duration = '300ms',
  className = '',
}: {
  children: React.ReactNode;
  scale?: string;
  duration?: string;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`transition-transform ${className}`}
      style={{
        transform: isHovered ? `scale(${scale})` : 'scale(1)',
        transitionDuration: duration,
        transitionTimingFunction: easingFunctions.easeOut,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// Hover glow effect
export function HoverGlow({
  children,
  glowColor = '59, 130, 246',
  intensity = '0.5',
  className = '',
}: {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: string;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`transition-shadow ${className}`}
      style={{
        boxShadow: isHovered
          ? `0 0 20px rgba(${glowColor}, ${intensity})`
          : '0 0 0px rgba(0, 0, 0, 0)',
        transitionDuration: durations.normal,
        transitionTimingFunction: easingFunctions.easeOut,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// Shimmer hover effect
export function HoverShimmer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -translate-x-full"
        style={{
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
          transition: `transform 600ms ${easingFunctions.easeOut}`,
        }}
      />
    </div>
  );
}

// Tilt effect on hover
export function HoverTilt({
  children,
  tiltDegree = '10',
  className = '',
}: {
  children: React.ReactNode;
  tiltDegree?: string;
  className?: string;
}) {
  const [transform, setTransform] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const card = ref.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = ((y - centerY) / centerY) * parseInt(tiltDegree);
    const rotateY = ((centerX - x) / centerX) * parseInt(tiltDegree);

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`
    );
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={ref}
      className={`transition-transform ${className}`}
      style={{
        transform,
        transitionDuration: durations.normal,
        transitionTimingFunction: easingFunctions.easeOut,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Magnetic effect
export function HoverMagnetic({
  children,
  strength = 0.3,
  className = '',
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const [transform, setTransform] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const card = ref.current;
    const box = card.getBoundingClientRect();
    const x = e.clientX - (box.left + box.width / 2);
    const y = e.clientY - (box.top + box.height / 2);

    setTransform(`translate3d(${x * strength}px, ${y * strength}px, 0) scale3d(1, 1, 1)`);
  };

  const handleMouseLeave = () => {
    setTransform('translate3d(0px, 0px, 0) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={ref}
      className={`transition-transform ${className}`}
      style={{
        transform,
        transitionDuration: durations.slow,
        transitionTimingFunction: easingFunctions.easeOut,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Reveal animation on hover
export function HoverReveal({
  children,
  overlay,
  className = '',
}: {
  children: React.ReactNode;
  overlay: React.ReactNode;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
          transition: `all ${durations.normal} ${easingFunctions.easeOut}`,
        }}
      >
        {overlay}
      </div>
    </div>
  );
}

// Button with ripple effect
export function RippleButton({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.6)',
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  rippleColor?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>(
    []
  );

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(button.offsetWidth, button.offsetHeight);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <button className={`relative overflow-hidden ${className}`} onClick={createRipple}>
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ping pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            transform: 'scale(0)',
            animation: 'ripple 600ms linear',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
}
