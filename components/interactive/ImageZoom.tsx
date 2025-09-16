'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageZoomProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  maxZoom?: number;
  minZoom?: number;
  className?: string;
  enablePan?: boolean;
  onZoomChange?: (zoom: number) => void;
}

export function ImageZoom({
  src,
  alt,
  width = 600,
  height = 400,
  maxZoom = 3,
  minZoom = 1,
  className = '',
  enablePan = true,
  onZoomChange,
}: ImageZoomProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY * -0.01;
      const newZoom = Math.min(Math.max(zoom + delta, minZoom), maxZoom);

      if (newZoom !== zoom) {
        // Calculate zoom center based on mouse position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = (e.clientX - rect.left) / rect.width - 0.5;
          const centerY = (e.clientY - rect.top) / rect.height - 0.5;

          // Adjust pan to keep the zoom centered on mouse position
          const zoomDiff = newZoom - zoom;
          setPan((prev) => ({
            x: prev.x - centerX * zoomDiff * width,
            y: prev.y - centerY * zoomDiff * height,
          }));
        }

        setZoom(newZoom);
        onZoomChange?.(newZoom);
      }
    },
    [zoom, minZoom, maxZoom, width, height, onZoomChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enablePan || zoom <= minZoom) return;

      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    },
    [enablePan, zoom, minZoom, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !enablePan) return;

      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };

      // Constrain pan to image boundaries
      const maxPanX = (width * (zoom - 1)) / 2;
      const maxPanY = (height * (zoom - 1)) / 2;

      setPan({
        x: Math.min(Math.max(newPan.x, -maxPanX), maxPanX),
        y: Math.min(Math.max(newPan.y, -maxPanY), maxPanY),
      });
    },
    [isDragging, enablePan, dragStart, zoom, width, height]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (zoom > minZoom) {
        // Reset zoom and pan
        setZoom(minZoom);
        setPan({ x: 0, y: 0 });
        onZoomChange?.(minZoom);
      } else {
        // Zoom to 2x at click position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const newZoom = Math.min(2, maxZoom);
          const centerX = (e.clientX - rect.left) / rect.width - 0.5;
          const centerY = (e.clientY - rect.top) / rect.height - 0.5;

          setZoom(newZoom);
          setPan({
            x: -centerX * newZoom * width * 0.5,
            y: -centerY * newZoom * height * 0.5,
          });
          onZoomChange?.(newZoom);
        }
      }
    },
    [zoom, minZoom, maxZoom, width, height, onZoomChange]
  );

  const resetZoom = useCallback(() => {
    setZoom(minZoom);
    setPan({ x: 0, y: 0 });
    onZoomChange?.(minZoom);
  }, [minZoom, onZoomChange]);

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * 1.2, maxZoom);
    setZoom(newZoom);
    onZoomChange?.(newZoom);
  }, [zoom, maxZoom, onZoomChange]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / 1.2, minZoom);
    setZoom(newZoom);

    // Reset pan if zooming out to minimum
    if (newZoom === minZoom) {
      setPan({ x: 0, y: 0 });
    }

    onZoomChange?.(newZoom);
  }, [zoom, minZoom, onZoomChange]);

  // Touch support for mobile
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance?: number } | null>(
    null
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - start pan
        if (enablePan && zoom > minZoom) {
          const touch = e.touches[0];
          setTouchStart({
            x: touch.clientX - pan.x,
            y: touch.clientY - pan.y,
          });
        }
      } else if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        setTouchStart({
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
          distance,
        });
      }
    },
    [enablePan, zoom, minZoom, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (!touchStart) return;

      if (e.touches.length === 1 && enablePan && zoom > minZoom) {
        // Single touch pan
        const touch = e.touches[0];
        const newPan = {
          x: touch.clientX - touchStart.x,
          y: touch.clientY - touchStart.y,
        };

        const maxPanX = (width * (zoom - 1)) / 2;
        const maxPanY = (height * (zoom - 1)) / 2;

        setPan({
          x: Math.min(Math.max(newPan.x, -maxPanX), maxPanX),
          y: Math.min(Math.max(newPan.y, -maxPanY), maxPanY),
        });
      } else if (e.touches.length === 2 && touchStart.distance) {
        // Pinch zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const scale = currentDistance / touchStart.distance;
        const newZoom = Math.min(Math.max(zoom * scale, minZoom), maxZoom);

        if (newZoom !== zoom) {
          setZoom(newZoom);
          onZoomChange?.(newZoom);
        }
      }
    },
    [touchStart, enablePan, zoom, minZoom, maxZoom, width, height, onZoomChange]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
    >
      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative cursor-zoom-in select-none"
        style={{ width, height }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={imageRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: isDragging ? 'grabbing' : zoom > minZoom ? 'grab' : 'zoom-in',
          }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={zoomIn}
          disabled={zoom >= maxZoom}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom In (+)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={zoomOut}
          disabled={zoom <= minZoom}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Zoom Out (-)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={resetZoom}
          disabled={zoom === minZoom && pan.x === 0 && pan.y === 0}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Reset Zoom (0)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Zoom Indicator */}
      {zoom > minZoom && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium">
          {Math.round(zoom * 100)}%
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-xs opacity-0 hover:opacity-100 transition-opacity">
        Scroll to zoom • Double-click to toggle • Drag to pan
      </div>
    </div>
  );
}

// Lightbox component with zoom
export function ImageLightbox({
  src,
  alt,
  isOpen,
  onClose,
  className = '',
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className={`relative max-w-full max-h-full ${className}`}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          title="Close (Escape)"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <ImageZoom
          src={src}
          alt={alt}
          width={Math.min(window.innerWidth - 100, 1200)}
          height={Math.min(window.innerHeight - 150, 800)}
          maxZoom={5}
          className="bg-transparent"
        />
      </div>

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
