import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useSession } from '@clerk/clerk-react';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createClerkSupabaseClient } from './client';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SupabaseContext = createContext<SupabaseClient | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * Provides an authenticated Supabase client to the entire app tree.
 *
 * Must be placed INSIDE ClerkProvider so it has access to the Clerk session.
 *
 * The client is memoized on `session` identity — it is recreated only when
 * the Clerk session changes (sign-in / sign-out), not on every render.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const { session } = useSession();

  const supabase = useMemo(() => {
    // getToken() — standard Clerk session token.
    // NOT getToken({ template: 'supabase' }) which is deprecated.
    const getToken = async (): Promise<string | null> => {
      if (!session) return null;
      return session.getToken();
    };

    return createClerkSupabaseClient(getToken);

    // Re-create the client when the session identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated Supabase client.
 * All Supabase calls in the app must go through this hook (via services).
 *
 * @throws If used outside of SupabaseProvider.
 */
export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>.');
  }
  return client;
}
