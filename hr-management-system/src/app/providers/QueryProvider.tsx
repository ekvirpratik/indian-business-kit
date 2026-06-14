import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { isDev } from '@/lib/env';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { handleError } from '@/utils/error-handler';

// eslint-disable-next-line react-refresh/only-export-components
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Don't retry forever, 1-2 times is sensible
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Prevent aggressive refetching when switching tabs
    },
    mutations: {
      retry: 0, // Typically we don't retry mutations
    },
  },
  queryCache: new QueryCache({
    // Optional: global handling for query errors, but usually components handle this
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Centralized mutation error handling
      handleError(error);
    },
  }),
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
