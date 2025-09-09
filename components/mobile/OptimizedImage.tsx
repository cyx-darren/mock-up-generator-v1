'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Optimized image component with progressive loading
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  fallback = '/images/placeholder.jpg',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    }
    onError?.();
  };

  const generateBlurDataURL = (w: number = 10, h: number = 10) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs><linearGradient id="g"><stop stop-color="#f3f4f6" offset="20%"/><stop stop-color="#e5e7eb" offset="50%"/><stop stop-color="#f3f4f6" offset="70%"/></linearGradient></defs>
        <rect width="${w}" height="${h}" fill="url(#g)"/>
      </svg>`
    ).toString('base64')}`;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {/* Loading skeleton */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
        </div>
      )}

      {/* Error state */}
      {hasError && imageSrc === fallback && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Progressive image loader with intersection observer
export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  rootMargin = '200px',
  threshold = 0.1,
  fallback,
  placeholder
}: OptimizedImageProps & {
  rootMargin?: string;
  threshold?: number;
}) {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={imgRef} className={className} style={{ width, height }}>
      {isInView ? (
        <OptimizedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          fallback={fallback}
          placeholder={placeholder}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

// Responsive image component that adapts to screen size
export function ResponsiveImage({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className = '',
  aspectRatio = 'aspect-square',
  priority = false,
  quality = 85
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  quality?: number;
}) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`relative ${aspectRatio} ${className}`}>
      {dimensions ? (
        <Image
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          sizes={sizes}
          priority={priority}
          quality={quality}
          className="object-cover w-full h-full"
          placeholder="blur"
          blurDataURL={`data:image/svg+xml;base64,${Buffer.from(
            `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#f3f4f6"/>
            </svg>`
          ).toString('base64')}`}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}

// Image gallery with lazy loading and progressive enhancement
export function MobileImageGallery({
  images,
  onImageClick,
  className = ''
}: {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  onImageClick?: (image: any, index: number) => void;
  className?: string;
}) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (imageId: string) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  };

  return (
    <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative aspect-square cursor-pointer group"
          onClick={() => onImageClick?.(image, index)}
        >
          <LazyImage
            src={image.thumbnail || image.src}
            alt={image.alt}
            className="w-full h-full rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-200"
            onLoad={() => handleImageLoad(image.id)}
          />
          
          {/* Loading overlay */}
          {!loadedImages.has(image.id) && (
            <div className="absolute inset-0 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Tap indicator */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-10 transition-all duration-150 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Adaptive image quality based on connection speed
export function AdaptiveImage({
  src,
  alt,
  width,
  height,
  className = ''
}: OptimizedImageProps) {
  const [quality, setQuality] = useState(85);

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Adjust quality based on connection speed
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setQuality(50);
        } else if (connection.effectiveType === '3g') {
          setQuality(70);
        } else {
          setQuality(85);
        }
      }
    }
  }, []);

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      className={className}
    />
  );
}

// WebP support detection and fallback
export function WebPImage({
  src,
  webpSrc,
  alt,
  width,
  height,
  className = ''
}: {
  src: string;
  webpSrc: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [supportsWebP, setSupportsWebP] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dataURL = canvas.toDataURL('image/webp');
        setSupportsWebP(dataURL.startsWith('data:image/webp'));
      }
      setIsChecked(true);
    };

    checkWebPSupport();
  }, []);

  if (!isChecked) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }} />
    );
  }

  return (
    <OptimizedImage
      src={supportsWebP ? webpSrc : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

// Custom CSS for shimmer animation
export const ImageLoadingStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;