import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <Container className="py-20">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Page Not Found</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back
          to the homepage.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Go to Homepage</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline">Browse Catalog</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
