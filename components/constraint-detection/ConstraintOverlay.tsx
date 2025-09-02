'use client';

import React, { useRef, useEffect } from 'react';
import { DetectedArea } from '@/lib/constraint-detection/greenColorDetector';
import { ValidationResult } from '@/lib/constraint-detection/constraintCalculator';

interface ConstraintOverlayProps {
  imageUrl: string;
  detectedArea: DetectedArea | null;
  validation?: ValidationResult | null;
  showBounds?: boolean;
  showCentroid?: boolean;
  showContours?: boolean;
  showGrid?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export function ConstraintOverlay({
  imageUrl,
  detectedArea,
  validation,
  showBounds = true,
  showCentroid = true,
  showContours = false,
  showGrid = false,
  overlayOpacity = 0.7,
  className = '',
}: ConstraintOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageUrl && canvasRef.current && imageRef.current) {
      drawOverlay();
    }
  }, [
    imageUrl,
    detectedArea,
    validation,
    showBounds,
    showCentroid,
    showContours,
    showGrid,
    overlayOpacity,
  ]);

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detectedArea || detectedArea.pixels === 0) {
      // Draw "no detection" overlay
      drawNoDetectionOverlay(ctx, canvas.width, canvas.height);
      return;
    }

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw detected area bounds
    if (showBounds) {
      drawBounds(ctx, detectedArea.bounds, validation?.isValid);
    }

    // Draw usable area bounds
    if (validation?.usableArea) {
      drawUsableArea(ctx, validation.usableArea.bounds);
    }

    // Draw contours if enabled and available
    if (showContours && detectedArea.contours.length > 0) {
      drawContours(ctx, detectedArea.contours);
    }

    // Draw centroid if enabled
    if (showCentroid) {
      drawCentroid(ctx, detectedArea.centroid);
    }

    // Draw measurements
    drawMeasurements(ctx, detectedArea.bounds);

    // Draw quality indicator
    drawQualityIndicator(ctx, detectedArea.quality, canvas.width, canvas.height);
  };

  const drawNoDetectionOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Semi-transparent red overlay
    ctx.fillStyle = `rgba(255, 0, 0, ${overlayOpacity * 0.3})`;
    ctx.fillRect(0, 0, width, height);

    // Warning message
    ctx.fillStyle = '#FF0000';
    ctx.font = `${Math.max(16, width / 30)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const message = 'No green areas detected';
    ctx.fillText(message, width / 2, height / 2);

    // Instructions
    ctx.font = `${Math.max(12, width / 40)}px Arial`;
    ctx.fillText('Mark constraint areas with green color', width / 2, height / 2 + 30);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = Math.max(20, Math.min(width, height) / 20);

    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawBounds = (
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number },
    isValid?: boolean
  ) => {
    const color = isValid === false ? '#FF4444' : '#00FF00';

    // Draw bounding rectangle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Draw corner markers
    const cornerSize = 15;
    ctx.fillStyle = color;

    // Top-left corner
    ctx.fillRect(bounds.x - 2, bounds.y - 2, cornerSize, 4);
    ctx.fillRect(bounds.x - 2, bounds.y - 2, 4, cornerSize);

    // Top-right corner
    ctx.fillRect(bounds.x + bounds.width - cornerSize + 2, bounds.y - 2, cornerSize, 4);
    ctx.fillRect(bounds.x + bounds.width - 2, bounds.y - 2, 4, cornerSize);

    // Bottom-left corner
    ctx.fillRect(bounds.x - 2, bounds.y + bounds.height - 2, cornerSize, 4);
    ctx.fillRect(bounds.x - 2, bounds.y + bounds.height - cornerSize + 2, 4, cornerSize);

    // Bottom-right corner
    ctx.fillRect(
      bounds.x + bounds.width - cornerSize + 2,
      bounds.y + bounds.height - 2,
      cornerSize,
      4
    );
    ctx.fillRect(
      bounds.x + bounds.width - 2,
      bounds.y + bounds.height - cornerSize + 2,
      4,
      cornerSize
    );
  };

  const drawUsableArea = (
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    // Draw usable area with dashed border
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Semi-transparent fill
    ctx.fillStyle = `rgba(0, 102, 255, ${overlayOpacity * 0.1})`;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

    ctx.setLineDash([]);
  };

  const drawContours = (
    ctx: CanvasRenderingContext2D,
    contours: Array<{ x: number; y: number }[]>
  ) => {
    ctx.strokeStyle = '#FF8800';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    contours.forEach((contour) => {
      if (contour.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(contour[0].x, contour[0].y);

      for (let i = 1; i < contour.length; i++) {
        ctx.lineTo(contour[i].x, contour[i].y);
      }

      ctx.closePath();
      ctx.stroke();
    });
  };

  const drawCentroid = (ctx: CanvasRenderingContext2D, centroid: { x: number; y: number }) => {
    const size = 8;

    // Draw crosshair
    ctx.strokeStyle = '#FF0088';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(centroid.x - size, centroid.y);
    ctx.lineTo(centroid.x + size, centroid.y);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centroid.x, centroid.y - size);
    ctx.lineTo(centroid.x, centroid.y + size);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#FF0088';
    ctx.beginPath();
    ctx.arc(centroid.x, centroid.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawMeasurements = (
    ctx: CanvasRenderingContext2D,
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Background for text
    const padding = 4;
    const textHeight = 16;

    // Width measurement (top)
    const widthText = `${bounds.width}px`;
    const widthTextWidth = ctx.measureText(widthText).width;
    const widthX = bounds.x + bounds.width / 2;
    const widthY = bounds.y - 15;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      widthX - widthTextWidth / 2 - padding,
      widthY - textHeight / 2,
      widthTextWidth + padding * 2,
      textHeight
    );

    ctx.fillStyle = '#333333';
    ctx.fillText(widthText, widthX, widthY);

    // Height measurement (right)
    const heightText = `${bounds.height}px`;
    const heightTextWidth = ctx.measureText(heightText).width;
    const heightX = bounds.x + bounds.width + 15;
    const heightY = bounds.y + bounds.height / 2;

    ctx.save();
    ctx.translate(heightX, heightY);
    ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      -heightTextWidth / 2 - padding,
      -textHeight / 2,
      heightTextWidth + padding * 2,
      textHeight
    );

    ctx.fillStyle = '#333333';
    ctx.fillText(heightText, 0, 0);
    ctx.restore();
  };

  const drawQualityIndicator = (
    ctx: CanvasRenderingContext2D,
    quality: number,
    width: number,
    height: number
  ) => {
    const indicatorSize = 80;
    const x = width - indicatorSize - 10;
    const y = 10;

    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(x + indicatorSize / 2, y + indicatorSize / 2, indicatorSize / 2 - 5, 0, 2 * Math.PI);
    ctx.fill();

    // Quality arc
    const centerX = x + indicatorSize / 2;
    const centerY = y + indicatorSize / 2;
    const radius = indicatorSize / 2 - 15;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + quality * 2 * Math.PI;

    // Determine color based on quality
    let color = '#FF4444'; // Poor
    if (quality > 0.7)
      color = '#44FF44'; // Good
    else if (quality > 0.4) color = '#FFAA44'; // Fair

    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.stroke();

    // Quality text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Quality', centerX, centerY - 5);
    ctx.fillText(`${Math.round(quality * 100)}%`, centerX, centerY + 8);
  };

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Constraint image"
        className="w-full h-auto"
        onLoad={drawOverlay}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-auto pointer-events-none"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  );
}
