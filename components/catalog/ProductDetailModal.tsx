'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  thumbnail_url?: string;
  primary_image_url?: string;
  additional_images?: string[];
  tags: string[];
  horizontal_enabled: boolean;
  vertical_enabled: boolean;
  all_over_enabled: boolean;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSelectProduct: (product: Product) => void;
}

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onSelectProduct,
}: ProductDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!product) return null;

  // Collect all images (primary, thumbnail, additional)
  const allImages = [
    product.primary_image_url,
    product.thumbnail_url,
    ...(product.additional_images || []),
  ].filter(Boolean) as string[];

  // Remove duplicates
  const uniqueImages = Array.from(new Set(allImages));
  const hasMultipleImages = uniqueImages.length > 1;

  const currentImage = uniqueImages[selectedImageIndex] || uniqueImages[0] || '';

  // Check if the image URL is valid for Next.js Image component
  const isValidImageUrl =
    currentImage &&
    (currentImage.startsWith('https://images.unsplash.com/') ||
      currentImage.includes('supabase.co') ||
      currentImage.startsWith('/') ||
      currentImage.startsWith('http://localhost') ||
      currentImage.startsWith('https://localhost'));

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getPlacementOptions = () => {
    const options = [];
    if (product.horizontal_enabled) {
      options.push({
        name: 'Horizontal Placement',
        description: 'Place your logo horizontally across the product',
        icon: '↔️',
        enabled: true,
      });
    }
    if (product.vertical_enabled) {
      options.push({
        name: 'Vertical Placement',
        description: 'Place your logo vertically on the product',
        icon: '↕️',
        enabled: true,
      });
    }
    if (product.all_over_enabled) {
      options.push({
        name: 'All-Over Print',
        description: 'Repeat your logo as a pattern across the entire product',
        icon: '🔄',
        enabled: true,
      });
    }
    return options;
  };

  const placementOptions = getPlacementOptions();

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleSelect = () => {
    onSelectProduct(product);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="animate-modal-enter"
      closeOnOutsideClick={true}
      showCloseButton={true}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            )}

            {!imageError && currentImage ? (
              isValidImageUrl ? (
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  } hover:scale-105`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <img
                  src={currentImage}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  } hover:scale-105`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-lg">No Image Available</p>
                </div>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full capitalize font-medium">
                {product.category}
              </span>
            </div>

            {/* Price Badge */}
            {product.price > 0 && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {formatPrice(product.price)}
                </span>
              </div>
            )}
          </div>

          {/* Image Gallery Thumbnails */}
          {hasMultipleImages && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {uniqueImages.map((image, index) => {
                const isThumbnailValid =
                  image &&
                  (image.startsWith('https://images.unsplash.com/') ||
                    image.includes('supabase.co') ||
                    image.startsWith('/') ||
                    image.startsWith('http://localhost') ||
                    image.startsWith('https://localhost'));

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setImageError(false);
                      setImageLoading(true);
                    }}
                    className={cn(
                      'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0',
                      selectedImageIndex === index
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    {isThumbnailValid ? (
                      <Image
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <img
                        src={image}
                        alt={`${product.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side - Product Information */}
        <div className="space-y-6">
          {/* Product Title and Basic Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {product.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Product Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">SKU</span>
                <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                  {product.sku}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</span>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrice(product.price)}
                </p>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {product.category}
              </p>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Placement Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Available Placement Options
            </h3>
            {placementOptions.length > 0 ? (
              <div className="space-y-3">
                {placementOptions.map((option) => (
                  <div
                    key={option.name}
                    className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        {option.name}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {option.description}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">
                        Available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <p>No placement options configured for this product.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleSelect}
              className="flex-1"
              size="lg"
              disabled={placementOptions.length === 0}
            >
              {placementOptions.length > 0 ? 'Select This Product' : 'Not Available'}
            </Button>
            <Button variant="outline" onClick={onClose} size="lg" className="px-8">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
