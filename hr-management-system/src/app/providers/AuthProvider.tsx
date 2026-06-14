import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { env } from '@/lib/env';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}
