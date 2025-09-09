'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { Loading } from '@/components/ui/Loading';

// Lazy load admin-specific components
const LazyBulkImageProcessor = lazy(() =>
  import('../admin/BulkImageProcessor').then(module => ({
    default: module.BulkImageProcessor
  }))
);

const LazyCommandPalette = lazy(() =>
  import('../admin/CommandPalette').then(module => ({
    default: module.CommandPalette
  }))
);

const LazyProductTemplates = lazy(() =>
  import('../admin/ProductTemplates').then(module => ({
    default: module.ProductTemplates
  }))
);

const LazyUsageCharts = lazy(() =>
  import('../admin/UsageCharts').then(module => ({
    default: module.UsageCharts
  }))
);

const LazyAuditLogViewer = lazy(() =>
  import('../admin/AuditLogViewer').then(module => ({
    default: module.AuditLogViewer
  }))
);

// Higher-order component for admin components
function withAdminLazyLoading<T extends object>(
  LazyComponent: ComponentType<T>,
  fallback?: ComponentType
) {
  const WrappedComponent = (props: T) => (
    <Suspense fallback={fallback ? <fallback /> : <Loading />}>
      <LazyComponent {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withAdminLazyLoading(${LazyComponent.displayName || 'AdminComponent'})`;
  return WrappedComponent;
}

// Export wrapped admin components
export const BulkImageProcessor = withAdminLazyLoading(LazyBulkImageProcessor);
export const CommandPalette = withAdminLazyLoading(LazyCommandPalette);
export const ProductTemplates = withAdminLazyLoading(LazyProductTemplates);
export const UsageCharts = withAdminLazyLoading(LazyUsageCharts);
export const AuditLogViewer = withAdminLazyLoading(LazyAuditLogViewer);