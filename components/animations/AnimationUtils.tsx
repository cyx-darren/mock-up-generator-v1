'use client';

import { keyframes } from '@emotion/react';

// Page transition animations
export const pageTransitions = {
  fadeIn: keyframes`
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  `,
  
  slideInFromRight: keyframes`
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  slideInFromLeft: keyframes`
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  `,
  
  slideUp: keyframes`
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  `,
  
  scaleIn: keyframes`
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  `
};

// Loading animations
export const loadingAnimations = {
  spin: keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `,
  
  pulse: keyframes`
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  `,
  
  wave: keyframes`
    0%, 60%, 100% {
      transform: initial;
    }
    30% {
      transform: translateY(-15px);
    }
  `,
  
  skeleton: keyframes`
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  `,
  
  bounce: keyframes`
    0%, 20%, 53%, 80%, 100% {
      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
      transform: translateY(0);
    }
    40%, 43% {
      animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
      transform: translateY(-30px);
    }
    70% {
      animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
      transform: translateY(-15px);
    }
    90% {
      transform: translateY(-4px);
    }
  `
};

// Hover effects
export const hoverEffects = {
  liftUp: keyframes`
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-4px);
    }
  `,
  
  scaleHover: keyframes`
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.05);
    }
  `,
  
  glow: keyframes`
    from {
      box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
    to {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
    }
  `,
  
  shimmer: keyframes`
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  `
};

// Micro-interactions
export const microInteractions = {
  heartbeat: keyframes`
    0% {
      transform: scale(1);
    }
    14% {
      transform: scale(1.3);
    }
    28% {
      transform: scale(1);
    }
    42% {
      transform: scale(1.3);
    }
    70% {
      transform: scale(1);
    }
  `,
  
  wiggle: keyframes`
    0%, 7% {
      transform: rotateZ(0);
    }
    15% {
      transform: rotateZ(-15deg);
    }
    20% {
      transform: rotateZ(10deg);
    }
    25% {
      transform: rotateZ(-10deg);
    }
    30% {
      transform: rotateZ(6deg);
    }
    35% {
      transform: rotateZ(-4deg);
    }
    40%, 100% {
      transform: rotateZ(0);
    }
  `,
  
  rubberBand: keyframes`
    from {
      transform: scale3d(1, 1, 1);
    }
    30% {
      transform: scale3d(1.25, 0.75, 1);
    }
    40% {
      transform: scale3d(0.75, 1.25, 1);
    }
    50% {
      transform: scale3d(1.15, 0.85, 1);
    }
    65% {
      transform: scale3d(0.95, 1.05, 1);
    }
    75% {
      transform: scale3d(1.05, 0.95, 1);
    }
    to {
      transform: scale3d(1, 1, 1);
    }
  `,
  
  tada: keyframes`
    from {
      transform: scale3d(1, 1, 1);
    }
    10%, 20% {
      transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
    }
    30%, 50%, 70%, 90% {
      transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
    }
    40%, 60%, 80% {
      transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
    }
    to {
      transform: scale3d(1, 1, 1);
    }
  `
};

// Success animations
export const successAnimations = {
  checkmark: keyframes`
    0% {
      stroke-dasharray: 44;
      stroke-dashoffset: 44;
    }
    100% {
      stroke-dasharray: 44;
      stroke-dashoffset: 0;
    }
  `,
  
  fadeInSuccess: keyframes`
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `,
  
  confetti: keyframes`
    0% {
      transform: rotateZ(15deg) rotateY(0deg) translate(0, 0);
      opacity: 1;
    }
    100% {
      transform: rotateZ(15deg) rotateY(180deg) translate(-20px, -120px);
      opacity: 0;
    }
  `
};

// Animation timing functions
export const easingFunctions = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  bounceOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
};

// Animation durations
export const durations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '700ms'
};

// Scroll animations
export const scrollAnimations = {
  parallax: (speed: number = 0.5) => ({
    transform: `translateY(${speed * 100}px)`
  }),
  
  revealUp: keyframes`
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  revealDown: keyframes`
    from {
      opacity: 0;
      transform: translateY(-40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  
  revealLeft: keyframes`
    from {
      opacity: 0;
      transform: translateX(-40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `,
  
  revealRight: keyframes`
    from {
      opacity: 0;
      transform: translateX(40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `
};