import { Container } from '@/components/layout/Container';
import { Card, CardBody } from '@/components/ui/Card';

export default function CatalogPage() {
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

      {/* Placeholder for product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} variant="shadow" hoverable>
            <CardBody>
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Product {i}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Corporate gift item
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </Container>
  );
}