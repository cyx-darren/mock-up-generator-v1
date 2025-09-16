'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConstraintRegion extends Rectangle {
  id: string;
  type: 'allowed' | 'forbidden';
  color: string;
}

interface VisualConstraintEditorProps {
  imageUrl: string;
  existingConstraints?: ConstraintRegion[];
  onConstraintsChange: (constraints: ConstraintRegion[]) => void;
  dimensions: { width: number; height: number };
  showGrid: boolean;
  showMeasurement: boolean;
  gridSize: number;
  snapToGrid: boolean;
}

export function VisualConstraintEditor({
  imageUrl,
  existingConstraints = [],
  onConstraintsChange,
  dimensions,
  showGrid = false,
  showMeasurement = false,
  gridSize = 20,
  snapToGrid = false,
}: VisualConstraintEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [constraints, setConstraints] = useState<ConstraintRegion[]>(existingConstraints);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedConstraint, setSelectedConstraint] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState<Point>({ x: 0, y: 0 });

  // Initialize canvas and load image
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (canvas && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Calculate scale to fit canvas while maintaining aspect ratio
        const canvasRect = canvas.getBoundingClientRect();
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = canvasRect.width / canvasRect.height;

        let drawWidth, drawHeight;
        if (imageAspect > canvasAspect) {
          drawWidth = canvasRect.width;
          drawHeight = canvasRect.width / imageAspect;
        } else {
          drawWidth = canvasRect.height * imageAspect;
          drawHeight = canvasRect.height;
        }

        const scale = drawWidth / img.naturalWidth;
        setScaleFactor(scale);

        const offsetX = (canvasRect.width - drawWidth) / 2;
        const offsetY = (canvasRect.height - drawHeight) / 2;
        setCanvasOffset({ x: offsetX, y: offsetY });

        canvas.width = canvasRect.width;
        canvas.height = canvasRect.height;

        redrawCanvas();
      };
      img.src = imageUrl;
      imageRef.current = img;
    }
  }, [imageUrl]);

  // Redraw canvas with all elements
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    const drawWidth = image.naturalWidth * scaleFactor;
    const drawHeight = image.naturalHeight * scaleFactor;
    ctx.drawImage(image, canvasOffset.x, canvasOffset.y, drawWidth, drawHeight);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx);
    }

    // Draw constraints
    constraints.forEach((constraint) => {
      drawConstraint(ctx, constraint);
    });

    // Draw selection handles for selected constraint
    if (selectedConstraint) {
      const constraint = constraints.find((c) => c.id === selectedConstraint);
      if (constraint) {
        drawSelectionHandles(ctx, constraint);
      }
    }

    // Draw measurement if enabled
    if (showMeasurement && mousePos) {
      drawMeasurement(ctx);
    }
  }, [
    constraints,
    selectedConstraint,
    showGrid,
    showMeasurement,
    mousePos,
    scaleFactor,
    canvasOffset,
    gridSize,
  ]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    const scaledGridSize = gridSize * scaleFactor;

    // Vertical lines
    for (let x = canvasOffset.x; x < canvas.width; x += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, canvasOffset.y);
      ctx.lineTo(x, canvasOffset.y + dimensions.height * scaleFactor);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = canvasOffset.y; y < canvas.height; y += scaledGridSize) {
      ctx.beginPath();
      ctx.moveTo(canvasOffset.x, y);
      ctx.lineTo(canvasOffset.x + dimensions.width * scaleFactor, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  // Draw constraint region
  const drawConstraint = (ctx: CanvasRenderingContext2D, constraint: ConstraintRegion) => {
    const x = canvasOffset.x + constraint.x * scaleFactor;
    const y = canvasOffset.y + constraint.y * scaleFactor;
    const width = constraint.width * scaleFactor;
    const height = constraint.height * scaleFactor;

    // Fill
    ctx.fillStyle =
      constraint.type === 'allowed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = constraint.type === 'allowed' ? '#22c55e' : '#ef4444';
    ctx.lineWidth = selectedConstraint === constraint.id ? 3 : 2;
    ctx.setLineDash(selectedConstraint === constraint.id ? [] : [5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  };

  // Draw selection handles
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, constraint: ConstraintRegion) => {
    const x = canvasOffset.x + constraint.x * scaleFactor;
    const y = canvasOffset.y + constraint.y * scaleFactor;
    const width = constraint.width * scaleFactor;
    const height = constraint.height * scaleFactor;

    const handleSize = 8;
    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2, cursor: 'nw-resize', handle: 'nw' },
      { x: x + width / 2 - handleSize / 2, y: y - handleSize / 2, cursor: 'n-resize', handle: 'n' },
      { x: x + width - handleSize / 2, y: y - handleSize / 2, cursor: 'ne-resize', handle: 'ne' },
      {
        x: x + width - handleSize / 2,
        y: y + height / 2 - handleSize / 2,
        cursor: 'e-resize',
        handle: 'e',
      },
      {
        x: x + width - handleSize / 2,
        y: y + height - handleSize / 2,
        cursor: 'se-resize',
        handle: 'se',
      },
      {
        x: x + width / 2 - handleSize / 2,
        y: y + height - handleSize / 2,
        cursor: 's-resize',
        handle: 's',
      },
      { x: x - handleSize / 2, y: y + height - handleSize / 2, cursor: 'sw-resize', handle: 'sw' },
      {
        x: x - handleSize / 2,
        y: y + height / 2 - handleSize / 2,
        cursor: 'w-resize',
        handle: 'w',
      },
    ];

    handles.forEach((handle) => {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  };

  // Draw measurement
  const drawMeasurement = (ctx: CanvasRenderingContext2D) => {
    if (!selectedConstraint) return;

    const constraint = constraints.find((c) => c.id === selectedConstraint);
    if (!constraint) return;

    const x = canvasOffset.x + constraint.x * scaleFactor;
    const y = canvasOffset.y + constraint.y * scaleFactor;
    const width = constraint.width * scaleFactor;
    const height = constraint.height * scaleFactor;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = '12px monospace';

    // Width measurement
    const widthText = `${constraint.width}px`;
    const widthMetrics = ctx.measureText(widthText);
    ctx.fillRect(x + width / 2 - widthMetrics.width / 2 - 4, y - 25, widthMetrics.width + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(widthText, x + width / 2 - widthMetrics.width / 2, y - 12);

    // Height measurement
    ctx.save();
    ctx.translate(x - 15, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    const heightText = `${constraint.height}px`;
    const heightMetrics = ctx.measureText(heightText);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(-heightMetrics.width / 2 - 4, -8, heightMetrics.width + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(heightText, -heightMetrics.width / 2, 4);
    ctx.restore();
  };

  // Convert canvas coordinates to image coordinates
  const canvasToImage = useCallback(
    (canvasX: number, canvasY: number): Point => {
      return {
        x: Math.round((canvasX - canvasOffset.x) / scaleFactor),
        y: Math.round((canvasY - canvasOffset.y) / scaleFactor),
      };
    },
    [canvasOffset, scaleFactor]
  );

  // Snap to grid if enabled
  const snapPoint = useCallback(
    (point: Point): Point => {
      if (!snapToGrid) return point;
      return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
      };
    },
    [snapToGrid, gridSize]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const imageCoords = canvasToImage(canvasX, canvasY);

      // Check if clicking on resize handle
      if (selectedConstraint) {
        const constraint = constraints.find((c) => c.id === selectedConstraint);
        if (constraint) {
          const handle = getResizeHandle(canvasX, canvasY, constraint);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            setDragStart({ x: canvasX, y: canvasY });
            return;
          }
        }
      }

      // Check if clicking on existing constraint
      const clickedConstraint = constraints.find((constraint) => {
        return (
          imageCoords.x >= constraint.x &&
          imageCoords.x <= constraint.x + constraint.width &&
          imageCoords.y >= constraint.y &&
          imageCoords.y <= constraint.y + constraint.height
        );
      });

      if (clickedConstraint) {
        setSelectedConstraint(clickedConstraint.id);
        setIsDragging(true);
        setDragStart({ x: canvasX, y: canvasY });
      } else {
        // Create new constraint
        const newConstraint: ConstraintRegion = {
          id: `constraint_${Date.now()}`,
          x: snapPoint(imageCoords).x,
          y: snapPoint(imageCoords).y,
          width: 100,
          height: 100,
          type: 'allowed',
          color: '#22c55e',
        };

        setConstraints((prev) => [...prev, newConstraint]);
        setSelectedConstraint(newConstraint.id);
        setIsResizing(true);
        setResizeHandle('se');
        setDragStart({ x: canvasX, y: canvasY });
      }
    },
    [constraints, selectedConstraint, canvasToImage, snapPoint]
  );

  // Get resize handle at coordinates
  const getResizeHandle = (
    canvasX: number,
    canvasY: number,
    constraint: ConstraintRegion
  ): string => {
    const x = canvasOffset.x + constraint.x * scaleFactor;
    const y = canvasOffset.y + constraint.y * scaleFactor;
    const width = constraint.width * scaleFactor;
    const height = constraint.height * scaleFactor;
    const handleSize = 8;
    const tolerance = handleSize / 2;

    const handles = [
      { x: x, y: y, handle: 'nw' },
      { x: x + width / 2, y: y, handle: 'n' },
      { x: x + width, y: y, handle: 'ne' },
      { x: x + width, y: y + height / 2, handle: 'e' },
      { x: x + width, y: y + height, handle: 'se' },
      { x: x + width / 2, y: y + height, handle: 's' },
      { x: x, y: y + height, handle: 'sw' },
      { x: x, y: y + height / 2, handle: 'w' },
    ];

    for (const handle of handles) {
      if (Math.abs(canvasX - handle.x) <= tolerance && Math.abs(canvasY - handle.y) <= tolerance) {
        return handle.handle;
      }
    }

    return '';
  };

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      setMousePos({ x: canvasX, y: canvasY });

      if (isDragging && selectedConstraint) {
        const constraint = constraints.find((c) => c.id === selectedConstraint);
        if (!constraint) return;

        const deltaX = (canvasX - dragStart.x) / scaleFactor;
        const deltaY = (canvasY - dragStart.y) / scaleFactor;

        const newPos = snapPoint({
          x: constraint.x + deltaX,
          y: constraint.y + deltaY,
        });

        setConstraints((prev) =>
          prev.map((c) =>
            c.id === selectedConstraint
              ? { ...c, x: Math.max(0, newPos.x), y: Math.max(0, newPos.y) }
              : c
          )
        );

        setDragStart({ x: canvasX, y: canvasY });
      } else if (isResizing && selectedConstraint) {
        const constraint = constraints.find((c) => c.id === selectedConstraint);
        if (!constraint) return;

        const deltaX = (canvasX - dragStart.x) / scaleFactor;
        const deltaY = (canvasY - dragStart.y) / scaleFactor;

        const newConstraint = { ...constraint };

        switch (resizeHandle) {
          case 'se':
            newConstraint.width = Math.max(20, constraint.width + deltaX);
            newConstraint.height = Math.max(20, constraint.height + deltaY);
            break;
          case 'sw':
            newConstraint.x = constraint.x + deltaX;
            newConstraint.width = Math.max(20, constraint.width - deltaX);
            newConstraint.height = Math.max(20, constraint.height + deltaY);
            break;
          case 'ne':
            newConstraint.width = Math.max(20, constraint.width + deltaX);
            newConstraint.y = constraint.y + deltaY;
            newConstraint.height = Math.max(20, constraint.height - deltaY);
            break;
          case 'nw':
            newConstraint.x = constraint.x + deltaX;
            newConstraint.y = constraint.y + deltaY;
            newConstraint.width = Math.max(20, constraint.width - deltaX);
            newConstraint.height = Math.max(20, constraint.height - deltaY);
            break;
          case 'n':
            newConstraint.y = constraint.y + deltaY;
            newConstraint.height = Math.max(20, constraint.height - deltaY);
            break;
          case 's':
            newConstraint.height = Math.max(20, constraint.height + deltaY);
            break;
          case 'e':
            newConstraint.width = Math.max(20, constraint.width + deltaX);
            break;
          case 'w':
            newConstraint.x = constraint.x + deltaX;
            newConstraint.width = Math.max(20, constraint.width - deltaX);
            break;
        }

        if (snapToGrid) {
          newConstraint.x = Math.round(newConstraint.x / gridSize) * gridSize;
          newConstraint.y = Math.round(newConstraint.y / gridSize) * gridSize;
          newConstraint.width = Math.round(newConstraint.width / gridSize) * gridSize;
          newConstraint.height = Math.round(newConstraint.height / gridSize) * gridSize;
        }

        setConstraints((prev) =>
          prev.map((c) => (c.id === selectedConstraint ? newConstraint : c))
        );

        setDragStart({ x: canvasX, y: canvasY });
      }

      redrawCanvas();
    },
    [
      isDragging,
      isResizing,
      selectedConstraint,
      constraints,
      dragStart,
      resizeHandle,
      scaleFactor,
      snapPoint,
      gridSize,
      snapToGrid,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
    onConstraintsChange(constraints);
  }, [constraints, onConstraintsChange]);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' && selectedConstraint) {
        setConstraints((prev) => prev.filter((c) => c.id !== selectedConstraint));
        setSelectedConstraint(null);
        onConstraintsChange(constraints.filter((c) => c.id !== selectedConstraint));
      } else if (e.key === 'Escape') {
        setSelectedConstraint(null);
      }
    },
    [selectedConstraint, constraints, onConstraintsChange]
  );

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Visual Constraint Editor</h3>
        <p className="text-sm text-gray-600">
          Click and drag to create constraint regions. Select regions to resize or move them.
        </p>
      </CardHeader>
      <CardBody>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-300 cursor-crosshair max-w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            style={{ width: '100%', height: 'auto', maxHeight: '600px' }}
          />
          <img ref={imageRef} className="hidden" alt="" />
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>
            <kbd>Click</kbd> to create constraint • <kbd>Drag</kbd> to move •{' '}
            <kbd>Resize handles</kbd> to scale • <kbd>Delete</kbd> to remove
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
