'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardBody } from '@/components/ui/Card';

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

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const imageUrl = product.thumbnail_url || product.primary_image_url || '';

  // Check if the image URL is valid for Next.js Image component
  const isValidImageUrl =
    imageUrl &&
    (imageUrl.startsWith('https://images.unsplash.com/') ||
      imageUrl.includes('supabase.co') ||
      imageUrl.startsWith('/') ||
      imageUrl.startsWith('http://localhost') ||
      imageUrl.startsWith('https://localhost'));

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getConstraintBadges = () => {
    const constraints = [];
    if (product.horizontal_enabled) constraints.push('Horizontal');
    if (product.vertical_enabled) constraints.push('Vertical');
    if (product.all_over_enabled) constraints.push('All-Over');
    return constraints;
  };

  return (
    <Card
      variant="shadow"
      hoverable
      className="group transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      onClick={() => onSelect?.(product)}
    >
      <CardBody className="p-4">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
          )}

          {!imageError && imageUrl ? (
            isValidImageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                } group-hover:scale-105 transition-transform duration-300`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <img
                src={imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                } group-hover:scale-105 transition-transform duration-300`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full capitalize">
              {product.category}
            </span>
          </div>

          {/* Price Badge */}
          {product.price > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {formatPrice(product.price)}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {product.description}
          </p>

          {/* SKU */}
          <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">SKU: {product.sku}</p>

          {/* Constraint Badges */}
          <div className="flex flex-wrap gap-1">
            {getConstraintBadges().map((constraint) => (
              <span
                key={constraint}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 rounded-full"
              >
                {constraint}
              </span>
            ))}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md"
                >
                  #{tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{product.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Select Button */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(product);
            }}
          >
            Select Product
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
