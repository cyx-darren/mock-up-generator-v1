'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';

export interface LogoTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

interface LogoAdjustmentProps {
  logoSrc: string;
  canvasWidth: number;
  canvasHeight: number;
  onTransformChange: (transform: LogoTransform) => void;
  className?: string;
}

export function LogoAdjustmentInterface({
  logoSrc,
  canvasWidth = 400,
  canvasHeight = 400,
  onTransformChange,
  className = '',
}: LogoAdjustmentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<LogoTransform>({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 10;

  // Update transform and notify parent
  const updateTransform = useCallback(
    (newTransform: Partial<LogoTransform>) => {
      const updated = { ...transform, ...newTransform };
      setTransform(updated);
      onTransformChange(updated);
    },
    [transform, onTransformChange]
  );

  // Snap to grid helper
  const snapValue = useCallback(
    (value: number) => {
      if (!snapToGrid) return value;
      return Math.round(value / gridSize) * gridSize;
    },
    [snapToGrid]
  );

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
    }

    // Draw logo (placeholder for now - in real implementation would draw actual logo)
    ctx.save();
    ctx.globalAlpha = transform.opacity;
    ctx.translate(transform.x, transform.y);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scaleX, transform.scaleY);

    // Draw logo rectangle (placeholder)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-transform.width / 2, -transform.height / 2, transform.width, transform.height);

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    // Corner handles
    const handles = [
      {
        x: -transform.width / 2 - handleSize / 2,
        y: -transform.height / 2 - handleSize / 2,
        cursor: 'nw-resize',
      },
      {
        x: transform.width / 2 - handleSize / 2,
        y: -transform.height / 2 - handleSize / 2,
        cursor: 'ne-resize',
      },
      {
        x: transform.width / 2 - handleSize / 2,
        y: transform.height / 2 - handleSize / 2,
        cursor: 'se-resize',
      },
      {
        x: -transform.width / 2 - handleSize / 2,
        y: transform.height / 2 - handleSize / 2,
        cursor: 'sw-resize',
      },
    ];

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });

    ctx.restore();
  }, [transform, canvasWidth, canvasHeight, showGrid]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragStart({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;

    updateTransform({
      x: snapValue(transform.x + deltaX),
      y: snapValue(transform.y + deltaY),
    });

    setDragStart({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  // Preset positions
  const presetPositions = [
    { name: 'Top Left', x: canvasWidth * 0.25, y: canvasHeight * 0.25 },
    { name: 'Top Center', x: canvasWidth * 0.5, y: canvasHeight * 0.25 },
    { name: 'Top Right', x: canvasWidth * 0.75, y: canvasHeight * 0.25 },
    { name: 'Center Left', x: canvasWidth * 0.25, y: canvasHeight * 0.5 },
    { name: 'Center', x: canvasWidth * 0.5, y: canvasHeight * 0.5 },
    { name: 'Center Right', x: canvasWidth * 0.75, y: canvasHeight * 0.5 },
    { name: 'Bottom Left', x: canvasWidth * 0.25, y: canvasHeight * 0.75 },
    { name: 'Bottom Center', x: canvasWidth * 0.5, y: canvasHeight * 0.75 },
    { name: 'Bottom Right', x: canvasWidth * 0.75, y: canvasHeight * 0.75 },
  ];

  const applyPreset = (preset: { x: number; y: number }) => {
    updateTransform({ x: preset.x, y: preset.y });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Canvas Area */}
      <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Canvas Controls */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant={showGrid ? 'default' : 'outline'}
            onClick={() => setShowGrid(!showGrid)}
          >
            Grid
          </Button>
          <Button
            size="sm"
            variant={snapToGrid ? 'default' : 'outline'}
            onClick={() => setSnapToGrid(!snapToGrid)}
          >
            Snap
          </Button>
        </div>
      </div>

      {/* Advanced Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resize Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Size Controls</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Width
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.width]}
                  onValueChange={([width]) => updateTransform({ width })}
                  max={canvasWidth}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={transform.width}
                  onChange={(e) => updateTransform({ width: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={10}
                  max={canvasWidth}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.height]}
                  onValueChange={([height]) => updateTransform({ height })}
                  max={canvasHeight}
                  min={10}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={transform.height}
                  onChange={(e) => updateTransform({ height: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={10}
                  max={canvasHeight}
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                const aspectRatio = transform.width / transform.height;
                updateTransform({
                  scaleX: 1,
                  scaleY: 1,
                  width: Math.min(transform.width, transform.height) * aspectRatio,
                  height: Math.min(transform.width, transform.height),
                });
              }}
              className="w-full"
            >
              Lock Aspect Ratio
            </Button>
          </div>
        </div>

        {/* Position Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Position Controls
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                X Position
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.x]}
                  onValueChange={([x]) => updateTransform({ x: snapValue(x) })}
                  max={canvasWidth}
                  min={0}
                  step={snapToGrid ? gridSize : 1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Math.round(transform.x)}
                  onChange={(e) => updateTransform({ x: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={0}
                  max={canvasWidth}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Y Position
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.y]}
                  onValueChange={([y]) => updateTransform({ y: snapValue(y) })}
                  max={canvasHeight}
                  min={0}
                  step={snapToGrid ? gridSize : 1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Math.round(transform.y)}
                  onChange={(e) => updateTransform({ y: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={0}
                  max={canvasHeight}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transform Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Transform Controls
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rotation (degrees)
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.rotation]}
                  onValueChange={([rotation]) => updateTransform({ rotation })}
                  max={360}
                  min={-360}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={transform.rotation}
                  onChange={(e) => updateTransform({ rotation: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  min={-360}
                  max={360}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opacity
              </label>
              <div className="flex items-center space-x-3">
                <Slider
                  value={[transform.opacity * 100]}
                  onValueChange={([opacity]) => updateTransform({ opacity: opacity / 100 })}
                  max={100}
                  min={0}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Math.round(transform.opacity * 100)}
                  onChange={(e) =>
                    updateTransform({ opacity: (parseInt(e.target.value) || 0) / 100 })
                  }
                  className="w-20"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alignment Tools */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Alignment Tools
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => updateTransform({ x: transform.width / 2 })}
              className="text-xs"
            >
              Align Left
            </Button>
            <Button
              variant="outline"
              onClick={() => updateTransform({ x: canvasWidth / 2 })}
              className="text-xs"
            >
              Center H
            </Button>
            <Button
              variant="outline"
              onClick={() => updateTransform({ x: canvasWidth - transform.width / 2 })}
              className="text-xs"
            >
              Align Right
            </Button>

            <Button
              variant="outline"
              onClick={() => updateTransform({ y: transform.height / 2 })}
              className="text-xs"
            >
              Align Top
            </Button>
            <Button
              variant="outline"
              onClick={() => updateTransform({ y: canvasHeight / 2 })}
              className="text-xs"
            >
              Center V
            </Button>
            <Button
              variant="outline"
              onClick={() => updateTransform({ y: canvasHeight - transform.height / 2 })}
              className="text-xs"
            >
              Align Bottom
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Positions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preset Positions</h3>

        <div className="grid grid-cols-3 gap-2">
          {presetPositions.map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => applyPreset(preset)}
              className="text-xs"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Reset Controls */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            updateTransform({
              x: canvasWidth / 2,
              y: canvasHeight / 2,
              width: 100,
              height: 100,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
            })
          }
        >
          Reset All
        </Button>
        <Button variant="outline" onClick={() => updateTransform({ rotation: 0 })}>
          Reset Rotation
        </Button>
        <Button variant="outline" onClick={() => updateTransform({ scaleX: 1, scaleY: 1 })}>
          Reset Scale
        </Button>
      </div>
    </div>
  );
}
