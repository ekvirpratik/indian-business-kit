import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="hrms-theme">
            <TooltipProvider>
              {children}
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
