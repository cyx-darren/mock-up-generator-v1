import { Card, CardBody } from '@/components/ui/Card';

export function ProductCardSkeleton() {
  return (
    <Card variant="shadow">
      <CardBody className="p-4">
        {/* Image Skeleton */}
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 animate-pulse" />

        {/* Content Skeleton */}
        <div className="space-y-2">
          {/* Title */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          
          {/* Description */}
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
          </div>

          {/* SKU */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />

          {/* Constraint Badges */}
          <div className="flex gap-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-14 animate-pulse" />
          </div>

          {/* Tags */}
          <div className="flex gap-1 mt-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-14 animate-pulse" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </CardBody>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}