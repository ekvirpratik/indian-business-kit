import type { ReactNode } from 'react';
import { AuthProvider } from './AuthProvider';
import { SupabaseProvider } from '@/lib/supabase';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root provider hierarchy for PeakHR:
 * ErrorBoundary -> OfflineBanner -> ClerkProvider (AuthProvider) -> SupabaseProvider -> QueryProvider -> ThemeProvider -> TooltipProvider -> UI
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <AuthProvider>
        <SupabaseProvider>
          <QueryProvider>
            <ThemeProvider defaultTheme="system" storageKey="hrms-theme">
              <TooltipProvider>
                {children}
                <Toaster position="top-right" richColors />
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </SupabaseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
