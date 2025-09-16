'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { Loading } from '@/components/ui/Loading';

// Lazy load heavy components
const LazyLogoAdjustmentInterface = lazy(() =>
  import('../logo-adjustment/LogoAdjustmentInterface').then((module) => ({
    default: module.LogoAdjustmentInterface,
  }))
);

const LazyPreviewEnhancements = lazy(() =>
  import('../preview/PreviewEnhancements').then((module) => ({
    default: module.PreviewEnhancements,
  }))
);

const LazyAdminDashboard = lazy(() =>
  import('../admin/DashboardStats').then((module) => ({
    default: module.DashboardStats,
  }))
);

const LazyConstraintEditor = lazy(() =>
  import('../constraint-config/VisualConstraintEditor').then((module) => ({
    default: module.VisualConstraintEditor,
  }))
);

const LazyProductDetailModal = lazy(() =>
  import('../catalog/ProductDetailModal').then((module) => ({
    default: module.ProductDetailModal,
  }))
);

const LazyRichTextEditor = lazy(() =>
  import('../ui/RichTextEditor').then((module) => ({
    default: module.RichTextEditor,
  }))
);

// Higher-order component to wrap lazy components with Suspense and loading
function withLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  fallback?: ComponentType
) {
  const WrappedComponent = (props: T) => (
    <Suspense fallback={fallback ? <fallback /> : <Loading />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `withLazyLoading(${LazyComponent.displayName || 'Component'})`;
  return WrappedComponent;
}

// Export wrapped components
export const LogoAdjustmentInterface = withLazyLoading(LazyLogoAdjustmentInterface);
export const PreviewEnhancements = withLazyLoading(LazyPreviewEnhancements);
export const AdminDashboard = withLazyLoading(LazyAdminDashboard);
export const ConstraintEditor = withLazyLoading(LazyConstraintEditor);
export const ProductDetailModal = withLazyLoading(LazyProductDetailModal);
export const RichTextEditor = withLazyLoading(LazyRichTextEditor);

// Export types
export type { LogoTransform } from '../logo-adjustment/LogoAdjustmentInterface';
export type { PreviewEnhancementsProps } from '../preview/PreviewEnhancements';
