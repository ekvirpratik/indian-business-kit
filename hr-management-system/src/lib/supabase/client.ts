import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Create a Supabase client that injects the active Clerk session token
 * into every request via the `accessToken` callback.
 *
 * This is the NATIVE Clerk ↔ Supabase Third-Party Auth integration.
 *
 * Rules:
 * - Do NOT use getToken({ template: 'supabase' }) — deprecated.
 * - Do NOT use service_role key in this file or anywhere in frontend code.
 * - The anon key is used here; RLS policies enforce all data access.
 *
 * @param getToken - Async function that returns the current Clerk session JWT.
 *                   Provided by useSession().session?.getToken() via SupabaseProvider.
 */
export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(url, { ...options, headers });
      },
    },
    auth: {
      // Disable Supabase's built-in auth — Clerk owns authentication.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
