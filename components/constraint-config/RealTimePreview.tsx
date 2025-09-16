'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

interface LogoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

interface ConstraintRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'allowed' | 'forbidden';
  color: string;
}

interface RealTimePreviewProps {
  productImageUrl: string;
  logoUrl?: string;
  constraints: ConstraintRegion[];
  placement: LogoPlacement;
  onPlacementChange: (placement: LogoPlacement) => void;
  showConstraints: boolean;
  previewMode: 'normal' | 'constraint' | 'final';
}

export function RealTimePreview({
  productImageUrl,
  logoUrl,
  constraints,
  placement,
  onPlacementChange,
  showConstraints,
  previewMode = 'normal',
}: RealTimePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productImageRef = useRef<HTMLImageElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    violations: string[];
  }>({ isValid: true, violations: [] });

  // Load images and initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loadImages = async () => {
      // Load product image
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        productImg.onload = resolve;
        productImg.onerror = reject;
        productImg.src = productImageUrl;
      });
      productImageRef.current = productImg;

      // Load logo image if provided
      if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = logoUrl;
        });
        logoImageRef.current = logoImg;
      }

      // Calculate canvas dimensions and scale
      const canvasRect = canvas.getBoundingClientRect();
      const imageAspect = productImg.naturalWidth / productImg.naturalHeight;
      const canvasAspect = canvasRect.width / canvasRect.height;

      let drawWidth, drawHeight;
      if (imageAspect > canvasAspect) {
        drawWidth = canvasRect.width;
        drawHeight = canvasRect.width / imageAspect;
      } else {
        drawWidth = canvasRect.height * imageAspect;
        drawHeight = canvasRect.height;
      }

      const scale = drawWidth / productImg.naturalWidth;
      setScaleFactor(scale);

      const offsetX = (canvasRect.width - drawWidth) / 2;
      const offsetY = (canvasRect.height - drawHeight) / 2;
      setCanvasOffset({ x: offsetX, y: offsetY });

      canvas.width = canvasRect.width;
      canvas.height = canvasRect.height;

      redrawCanvas();
    };

    loadImages().catch(console.error);
  }, [productImageUrl, logoUrl]);

  // Validate logo placement against constraints
  const validatePlacement = useCallback(() => {
    const violations: string[] = [];
    let isValid = true;

    for (const constraint of constraints) {
      const logoRight = placement.x + placement.width;
      const logoBottom = placement.y + placement.height;
      const constraintRight = constraint.x + constraint.width;
      const constraintBottom = constraint.y + constraint.height;

      // Check for overlap
      const hasOverlap = !(
        logoRight <= constraint.x ||
        placement.x >= constraintRight ||
        logoBottom <= constraint.y ||
        placement.y >= constraintBottom
      );

      if (constraint.type === 'forbidden' && hasOverlap) {
        violations.push(`Logo overlaps with forbidden area (${constraint.id})`);
        isValid = false;
      } else if (constraint.type === 'allowed') {
        // Check if logo is completely within allowed area
        const isCompletelyInside =
          placement.x >= constraint.x &&
          placement.y >= constraint.y &&
          logoRight <= constraintRight &&
          logoBottom <= constraintBottom;

        if (!isCompletelyInside) {
          violations.push(`Logo must be completely within allowed area (${constraint.id})`);
          isValid = false;
        }
      }
    }

    setValidationResult({ isValid, violations });
  }, [placement, constraints]);

  useEffect(() => {
    validatePlacement();
    redrawCanvas();
  }, [placement, constraints, showConstraints, previewMode, validatePlacement]);

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const productImg = productImageRef.current;
    const logoImg = logoImageRef.current;

    if (!canvas || !productImg) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw product image
    const drawWidth = productImg.naturalWidth * scaleFactor;
    const drawHeight = productImg.naturalHeight * scaleFactor;
    ctx.drawImage(productImg, canvasOffset.x, canvasOffset.y, drawWidth, drawHeight);

    // Draw constraints if enabled and in constraint mode
    if (showConstraints && (previewMode === 'constraint' || previewMode === 'normal')) {
      constraints.forEach((constraint) => {
        drawConstraint(ctx, constraint);
      });
    }

    // Draw logo if available and not in constraint-only mode
    if (logoImg && previewMode !== 'constraint') {
      drawLogo(ctx, logoImg);
    }

    // Draw validation feedback
    if (previewMode !== 'final') {
      drawValidationFeedback(ctx);
    }
  }, [
    scaleFactor,
    canvasOffset,
    constraints,
    showConstraints,
    previewMode,
    placement,
    validationResult,
  ]);

  // Draw constraint region
  const drawConstraint = (ctx: CanvasRenderingContext2D, constraint: ConstraintRegion) => {
    const x = canvasOffset.x + constraint.x * scaleFactor;
    const y = canvasOffset.y + constraint.y * scaleFactor;
    const width = constraint.width * scaleFactor;
    const height = constraint.height * scaleFactor;

    // Fill with semi-transparent color
    if (constraint.type === 'allowed') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    } else {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    }
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = constraint.type === 'allowed' ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = constraint.type === 'allowed' ? '#15803d' : '#dc2626';
    ctx.font = '12px sans-serif';
    ctx.fillText(constraint.type === 'allowed' ? 'ALLOWED' : 'FORBIDDEN', x + 5, y + 15);
  };

  // Draw logo
  const drawLogo = (ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement) => {
    ctx.save();

    const x = canvasOffset.x + placement.x * scaleFactor;
    const y = canvasOffset.y + placement.y * scaleFactor;
    const width = placement.width * scaleFactor;
    const height = placement.height * scaleFactor;

    // Apply transformations
    ctx.globalAlpha = placement.opacity;
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((placement.rotation * Math.PI) / 180);

    // Draw logo
    ctx.drawImage(logoImg, -width / 2, -height / 2, width, height);

    // Draw selection outline if not in final mode
    if (previewMode !== 'final') {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = validationResult.isValid ? '#3b82f6' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(-width / 2, -height / 2, width, height);

      // Draw resize handles
      const handleSize = 6;
      ctx.fillStyle = validationResult.isValid ? '#3b82f6' : '#ef4444';
      const handles = [
        { x: -width / 2 - handleSize / 2, y: -height / 2 - handleSize / 2 },
        { x: width / 2 - handleSize / 2, y: -height / 2 - handleSize / 2 },
        { x: width / 2 - handleSize / 2, y: height / 2 - handleSize / 2 },
        { x: -width / 2 - handleSize / 2, y: height / 2 - handleSize / 2 },
      ];
      handles.forEach((handle) => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      });
    }

    ctx.restore();
  };

  // Draw validation feedback
  const drawValidationFeedback = (ctx: CanvasRenderingContext2D) => {
    if (validationResult.violations.length === 0) return;

    // Draw validation status in top-right corner
    const padding = 10;
    const lineHeight = 20;
    const maxWidth = 300;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    const rectHeight = (validationResult.violations.length + 1) * lineHeight + padding * 2;
    ctx.fillRect(canvasRef.current!.width - maxWidth - padding, padding, maxWidth, rectHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Validation Errors:', canvasRef.current!.width - maxWidth, padding + lineHeight);

    ctx.font = '12px sans-serif';
    validationResult.violations.forEach((violation, index) => {
      ctx.fillText(
        `• ${violation}`,
        canvasRef.current!.width - maxWidth + 10,
        padding + (index + 2) * lineHeight
      );
    });
  };

  // Convert canvas coordinates to image coordinates
  const canvasToImage = useCallback(
    (canvasX: number, canvasY: number) => {
      return {
        x: Math.round((canvasX - canvasOffset.x) / scaleFactor),
        y: Math.round((canvasY - canvasOffset.y) / scaleFactor),
      };
    },
    [canvasOffset, scaleFactor]
  );

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (previewMode === 'final') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      const imageCoords = canvasToImage(canvasX, canvasY);

      // Check if clicking on logo
      const logoRight = placement.x + placement.width;
      const logoBottom = placement.y + placement.height;

      if (
        imageCoords.x >= placement.x &&
        imageCoords.x <= logoRight &&
        imageCoords.y >= placement.y &&
        imageCoords.y <= logoBottom
      ) {
        setIsDragging(true);
        setDragStart({ x: canvasX, y: canvasY });
      }
    },
    [placement, canvasToImage, previewMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || previewMode === 'final') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const deltaX = (canvasX - dragStart.x) / scaleFactor;
      const deltaY = (canvasY - dragStart.y) / scaleFactor;

      const newPlacement = {
        ...placement,
        x: Math.max(0, placement.x + deltaX),
        y: Math.max(0, placement.y + deltaY),
      };

      onPlacementChange(newPlacement);
      setDragStart({ x: canvasX, y: canvasY });
    },
    [isDragging, dragStart, placement, scaleFactor, onPlacementChange, previewMode]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Real-Time Preview</h3>
            <p className="text-sm text-gray-600">
              Preview logo placement with constraint validation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={previewMode}
              onChange={(e) => onPlacementChange({ ...placement })}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="normal">Normal</option>
              <option value="constraint">Constraints Only</option>
              <option value="final">Final Preview</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="border border-gray-300 cursor-move max-w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ width: '100%', height: 'auto' }}
          />

          {/* Validation Status */}
          <div className="mt-4">
            {validationResult.isValid ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">Placement is valid</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">Placement violations detected</span>
                </div>
                <ul className="text-sm text-red-600 space-y-1 ml-7">
                  {validationResult.violations.map((violation, index) => (
                    <li key={index}>• {violation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Logo Controls */}
          {logoUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Logo Adjustments</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={Math.round(placement.width)}
                    onChange={(e) =>
                      onPlacementChange({ ...placement, width: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="10"
                    max="500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={Math.round(placement.height)}
                    onChange={(e) =>
                      onPlacementChange({ ...placement, height: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    min="10"
                    max="500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rotation (°)</label>
                  <input
                    type="range"
                    value={placement.rotation}
                    onChange={(e) =>
                      onPlacementChange({ ...placement, rotation: Number(e.target.value) })
                    }
                    className="w-full"
                    min="-180"
                    max="180"
                    step="1"
                  />
                  <span className="text-xs text-gray-500">{placement.rotation}°</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                  <input
                    type="range"
                    value={placement.opacity}
                    onChange={(e) =>
                      onPlacementChange({ ...placement, opacity: Number(e.target.value) })
                    }
                    className="w-full"
                    min="0.1"
                    max="1"
                    step="0.1"
                  />
                  <span className="text-xs text-gray-500">
                    {Math.round(placement.opacity * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
