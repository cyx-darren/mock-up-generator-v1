'use client';

import { Container } from '@/components/layout/Container';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();

  const handleProductSelect = (product: any) => {
    // Navigate to mockup creation page with selected product
    router.push(`/create?product=${product.id}`);
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Product Catalog
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Choose from our selection of corporate gift items to create your custom mockup
        </p>
      </div>

      <ProductGrid onProductSelect={handleProductSelect} />
    </Container>
  );
}
