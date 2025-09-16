'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ImageZoom } from './ImageZoom';

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  thumbnail?: string;
  title?: string;
  description?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  initialIndex?: number;
  showThumbnails?: boolean;
  showFullscreen?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  className?: string;
  onImageChange?: (index: number, image: GalleryImage) => void;
}

export function ImageGallery({
  images,
  initialIndex = 0,
  showThumbnails = true,
  showFullscreen = true,
  autoplay = false,
  autoplayDelay = 3000,
  className = '',
  onImageChange,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const goToImage = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(index, images.length - 1));
      setCurrentIndex(newIndex);
      onImageChange?.(newIndex, images[newIndex]);
    },
    [images, onImageChange]
  );

  const goToNext = useCallback(() => {
    goToImage(currentIndex + 1);
  }, [currentIndex, goToImage]);

  const goToPrevious = useCallback(() => {
    goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  const goToFirst = useCallback(() => {
    goToImage(0);
  }, [goToImage]);

  const goToLast = useCallback(() => {
    goToImage(images.length - 1);
  }, [images.length, goToImage]);

  // Autoplay functionality
  useEffect(() => {
    if (!isPlaying || images.length <= 1) {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
      return;
    }

    autoplayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoplayDelay);

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [isPlaying, images.length, autoplayDelay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body && !isFullscreen) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Home':
          e.preventDefault();
          goToFirst();
          break;
        case 'End':
          e.preventDefault();
          goToLast();
          break;
        case 'f':
        case 'F11':
          if (showFullscreen) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, goToFirst, goToLast, showFullscreen, isFullscreen, isPlaying]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    if (!isVerticalSwipe) {
      if (isLeftSwipe && currentIndex < images.length - 1) {
        goToNext();
      }
      if (isRightSwipe && currentIndex > 0) {
        goToPrevious();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, currentIndex, images.length, goToNext, goToPrevious]);

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  const GalleryContent = () => (
    <div className={`relative ${isFullscreen ? 'w-full h-full' : ''}`}>
      {/* Main Image */}
      <div
        ref={mainImageRef}
        className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isFullscreen ? (
          <ImageZoom
            src={currentImage.src}
            alt={currentImage.alt}
            width={window.innerWidth}
            height={window.innerHeight - 100}
            maxZoom={5}
            className="bg-black"
          />
        ) : (
          <div className="relative">
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              width={800}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />

            {/* Image Info Overlay */}
            {(currentImage.title || currentImage.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                {currentImage.title && (
                  <h3 className="text-white text-lg font-semibold mb-1">{currentImage.title}</h3>
                )}
                {currentImage.description && (
                  <p className="text-gray-200 text-sm">{currentImage.description}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous image (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next image (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Controls */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {/* Autoplay Toggle */}
          {images.length > 1 && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}

          {/* Fullscreen Toggle */}
          {showFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all"
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && !isFullscreen && (
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2 overflow-x-auto py-2 max-w-full">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 scale-110'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <Image
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Dots */}
      {images.length > 1 && !showThumbnails && !isFullscreen && (
        <div className="mt-4 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="w-full h-full p-4">
          <GalleryContent />
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10"
          title="Exit fullscreen (Esc)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <GalleryContent />
    </div>
  );
}

// Lightbox Gallery
export function LightboxGallery({
  images,
  triggerImage,
  triggerAlt = 'Open gallery',
  initialIndex = 0,
  className = '',
}: {
  images: GalleryImage[];
  triggerImage: string;
  triggerAlt?: string;
  initialIndex?: number;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openGallery = () => setIsOpen(true);
  const closeGallery = () => setIsOpen(false);

  return (
    <>
      {/* Trigger */}
      <button onClick={openGallery} className={`relative group ${className}`}>
        <Image
          src={triggerImage}
          alt={triggerAlt}
          width={300}
          height={200}
          className="w-full h-auto object-cover rounded-lg transition-opacity group-hover:opacity-80"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
            <svg
              className="w-6 h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </div>
        </div>

        {/* Image count badge */}
        {images.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
            {images.length} photos
          </div>
        )}
      </button>

      {/* Lightbox */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <div className="w-full h-full p-4">
            <ImageGallery
              images={images}
              initialIndex={initialIndex}
              showFullscreen={false}
              showThumbnails={images.length > 1}
              className="h-full"
            />
          </div>

          {/* Close button */}
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
