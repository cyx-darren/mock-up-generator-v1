'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

interface LogoTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

interface DistributionHelpersProps {
  logos: LogoTransform[];
  canvasWidth: number;
  canvasHeight: number;
  onLogosUpdate: (logos: LogoTransform[]) => void;
  className?: string;
}

export function DistributionHelpers({
  logos,
  canvasWidth,
  canvasHeight,
  onLogosUpdate,
  className = ''
}: DistributionHelpersProps) {
  
  // Distribute logos horizontally with equal spacing
  const distributeHorizontally = () => {
    if (logos.length < 2) return;
    
    const sortedLogos = [...logos].sort((a, b) => a.x - b.x);
    const leftMost = sortedLogos[0];
    const rightMost = sortedLogos[sortedLogos.length - 1];
    const totalWidth = rightMost.x - leftMost.x;
    const spacing = totalWidth / (sortedLogos.length - 1);
    
    const distributed = sortedLogos.map((logo, index) => ({
      ...logo,
      x: leftMost.x + (spacing * index)
    }));
    
    onLogosUpdate(distributed);
  };

  // Distribute logos vertically with equal spacing
  const distributeVertically = () => {
    if (logos.length < 2) return;
    
    const sortedLogos = [...logos].sort((a, b) => a.y - b.y);
    const topMost = sortedLogos[0];
    const bottomMost = sortedLogos[sortedLogos.length - 1];
    const totalHeight = bottomMost.y - topMost.y;
    const spacing = totalHeight / (sortedLogos.length - 1);
    
    const distributed = sortedLogos.map((logo, index) => ({
      ...logo,
      y: topMost.y + (spacing * index)
    }));
    
    onLogosUpdate(distributed);
  };

  // Align all logos horizontally
  const alignHorizontally = (position: 'top' | 'center' | 'bottom') => {
    let targetY: number;
    
    switch (position) {
      case 'top':
        targetY = Math.min(...logos.map(logo => logo.y - logo.height / 2)) + logos[0].height / 2;
        break;
      case 'center':
        targetY = canvasHeight / 2;
        break;
      case 'bottom':
        targetY = Math.max(...logos.map(logo => logo.y + logo.height / 2)) - logos[0].height / 2;
        break;
    }
    
    const aligned = logos.map(logo => ({
      ...logo,
      y: targetY
    }));
    
    onLogosUpdate(aligned);
  };

  // Align all logos vertically
  const alignVertically = (position: 'left' | 'center' | 'right') => {
    let targetX: number;
    
    switch (position) {
      case 'left':
        targetX = Math.min(...logos.map(logo => logo.x - logo.width / 2)) + logos[0].width / 2;
        break;
      case 'center':
        targetX = canvasWidth / 2;
        break;
      case 'right':
        targetX = Math.max(...logos.map(logo => logo.x + logo.width / 2)) - logos[0].width / 2;
        break;
    }
    
    const aligned = logos.map(logo => ({
      ...logo,
      x: targetX
    }));
    
    onLogosUpdate(aligned);
  };

  // Create grid layout
  const createGrid = (rows: number, cols: number) => {
    const totalLogos = Math.min(logos.length, rows * cols);
    const marginX = canvasWidth * 0.1;
    const marginY = canvasHeight * 0.1;
    const availableWidth = canvasWidth - (marginX * 2);
    const availableHeight = canvasHeight - (marginY * 2);
    
    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;
    
    const gridLogos = logos.slice(0, totalLogos).map((logo, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      return {
        ...logo,
        x: marginX + (col * cellWidth) + (cellWidth / 2),
        y: marginY + (row * cellHeight) + (cellHeight / 2)
      };
    });
    
    onLogosUpdate(gridLogos);
  };

  // Create circular arrangement
  const arrangeInCircle = () => {
    if (logos.length < 2) return;
    
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) * 0.3;
    const angleStep = (2 * Math.PI) / logos.length;
    
    const circular = logos.map((logo, index) => ({
      ...logo,
      x: centerX + Math.cos(angleStep * index) * radius,
      y: centerY + Math.sin(angleStep * index) * radius
    }));
    
    onLogosUpdate(circular);
  };

  // Create scattered random arrangement
  const scatterRandomly = () => {
    const margin = 50;
    
    const scattered = logos.map(logo => ({
      ...logo,
      x: margin + Math.random() * (canvasWidth - margin * 2),
      y: margin + Math.random() * (canvasHeight - margin * 2)
    }));
    
    onLogosUpdate(scattered);
  };

  // Match sizes of all logos
  const matchSizes = () => {
    if (logos.length === 0) return;
    
    const referenceWidth = logos[0].width;
    const referenceHeight = logos[0].height;
    
    const matched = logos.map(logo => ({
      ...logo,
      width: referenceWidth,
      height: referenceHeight
    }));
    
    onLogosUpdate(matched);
  };

  // Create pattern arrangements
  const createPattern = (pattern: 'diagonal' | 'wave' | 'zigzag') => {
    const margin = 50;
    const usableWidth = canvasWidth - margin * 2;
    const usableHeight = canvasHeight - margin * 2;
    
    const patterned = logos.map((logo, index) => {
      const progress = index / (logos.length - 1 || 1);
      let x = margin + progress * usableWidth;
      let y = margin + usableHeight / 2;
      
      switch (pattern) {
        case 'diagonal':
          y = margin + progress * usableHeight;
          break;
        case 'wave':
          y = margin + usableHeight / 2 + Math.sin(progress * Math.PI * 2) * (usableHeight / 4);
          break;
        case 'zigzag':
          y = margin + (index % 2 === 0 ? usableHeight * 0.25 : usableHeight * 0.75);
          break;
      }
      
      return {
        ...logo,
        x,
        y
      };
    });
    
    onLogosUpdate(patterned);
  };

  const isMultipleLogos = logos.length > 1;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Distribution Tools
        </h3>
        
        {!isMultipleLogos && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Multiple logos required for distribution tools
          </p>
        )}
        
        {/* Basic Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Equal Spacing
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={distributeHorizontally}
              disabled={!isMultipleLogos}
            >
              Distribute Horizontally
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={distributeVertically}
              disabled={!isMultipleLogos}
            >
              Distribute Vertically
            </Button>
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Bulk Alignment
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Horizontal</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignHorizontally('top')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Top
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignHorizontally('center')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignHorizontally('bottom')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Bottom
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Vertical</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignVertically('left')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignVertically('center')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alignVertically('right')}
                disabled={!isMultipleLogos}
                className="w-full text-xs"
              >
                Align Right
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Layouts */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Grid Layouts
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => createGrid(2, 2)}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              2×2 Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createGrid(3, 3)}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              3×3 Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createGrid(2, 4)}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              2×4 Grid
            </Button>
          </div>
        </div>

        {/* Pattern Arrangements */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pattern Arrangements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={arrangeInCircle}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              Circular
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createPattern('diagonal')}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              Diagonal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createPattern('wave')}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              Wave
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createPattern('zigzag')}
              disabled={!isMultipleLogos}
              className="text-xs"
            >
              Zigzag
            </Button>
          </div>
        </div>

        {/* Size Matching */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Size Control
          </h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={matchSizes}
              disabled={!isMultipleLogos}
            >
              Match All Sizes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scatterRandomly}
              disabled={!isMultipleLogos}
            >
              Scatter Randomly
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}