'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { ProductCardSkeleton } from '@/components/catalog/ProductCardSkeleton';

// Lazy load catalog components
const LazyProductGrid = lazy(() =>
  import('../catalog/ProductGrid').then(module => ({
    default: module.ProductGrid
  }))
);

const LazyProductCard = lazy(() =>
  import('../catalog/ProductCard').then(module => ({
    default: module.ProductCard
  }))
);

const LazyProductDetailModal = lazy(() =>
  import('../catalog/ProductDetailModal').then(module => ({
    default: module.ProductDetailModal
  }))
);

// Higher-order component for catalog components
function withCatalogLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  fallback?: ComponentType
) {
  const WrappedComponent = (props: T) => (
    <Suspense fallback={fallback ? <fallback /> : <ProductCardSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withCatalogLazyLoading(${LazyComponent.displayName || 'CatalogComponent'})`;
  return WrappedComponent;
}

// Export wrapped catalog components
export const ProductGrid = withCatalogLazyLoading(LazyProductGrid);
export const ProductCard = withCatalogLazyLoading(LazyProductCard);
export const ProductDetailModal = withCatalogLazyLoading(LazyProductDetailModal);