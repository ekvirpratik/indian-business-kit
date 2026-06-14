import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="hrms-theme">
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
