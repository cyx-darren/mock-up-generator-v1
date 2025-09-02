'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
