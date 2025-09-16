'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { Loading } from '@/components/ui/Loading';

// Lazy load page components
const LazyCatalogPage = lazy(() => import('../app/(public)/catalog/page'));
const LazyCreateMockupPage = lazy(() => import('../app/(public)/create-mockup/page'));
const LazyAdminDashboard = lazy(() => import('../app/admin/dashboard/page'));
const LazyAdminProductsEdit = lazy(() => import('../app/admin/products/[id]/edit/page'));
const LazyAdminProductsConstraints = lazy(
  () => import('../app/admin/products/[id]/constraints/page')
);

// Higher-order component for page-level lazy loading
export function withPageLazyLoading<T extends object>(
  LazyPage: ComponentType<T>,
  fallback?: ComponentType
) {
  const WrappedPage = (props: T) => (
    <Suspense fallback={fallback ? <fallback /> : <Loading />}>
      <LazyPage {...props} />
    </Suspense>
  );

  WrappedPage.displayName = `withPageLazyLoading(${LazyPage.displayName || 'Page'})`;
  return WrappedPage;
}

// Export wrapped pages for dynamic imports
export const CatalogPage = withPageLazyLoading(LazyCatalogPage);
export const CreateMockupPage = withPageLazyLoading(LazyCreateMockupPage);
export const AdminDashboard = withPageLazyLoading(LazyAdminDashboard);
export const AdminProductsEdit = withPageLazyLoading(LazyAdminProductsEdit);
export const AdminProductsConstraints = withPageLazyLoading(LazyAdminProductsConstraints);

// Utility for preloading specific routes
export const preloadRoute = {
  catalog: () => import('../app/(public)/catalog/page'),
  createMockup: () => import('../app/(public)/create-mockup/page'),
  adminDashboard: () => import('../app/admin/dashboard/page'),
  adminProductsEdit: () => import('../app/admin/products/[id]/edit/page'),
  adminConstraints: () => import('../app/admin/products/[id]/constraints/page'),
} as const;

// Preload routes based on user interaction patterns
export function preloadCriticalRoutes() {
  // Preload catalog page on app start
  preloadRoute.catalog();

  // Preload create mockup page for logged in users
  if (typeof window !== 'undefined' && window.localStorage.getItem('auth-token')) {
    preloadRoute.createMockup();
  }
}

// Progressive loading based on viewport visibility
export function useProgressiveLoading(threshold = 0.1) {
  if (typeof window === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const route = entry.target.getAttribute('data-preload-route');
          if (route && route in preloadRoute) {
            (preloadRoute as any)[route]();
          }
        }
      });
    },
    { threshold }
  );

  return observer;
}
