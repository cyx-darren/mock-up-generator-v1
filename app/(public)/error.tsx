'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container className="py-20">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-8 max-w-md mx-auto">
          We encountered an unexpected error. Please try again or contact support if the problem
          persists.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go home
          </Button>
        </div>
      </div>
    </Container>
  );
}
