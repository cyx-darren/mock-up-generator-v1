import { Container } from '@/components/layout/Container';
import { Spinner } from '@/components/ui/Loading';

export default function Loading() {
  return (
    <Container className="py-20">
      <div className="flex flex-col items-center justify-center">
        <Spinner size="xl" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </Container>
  );
}