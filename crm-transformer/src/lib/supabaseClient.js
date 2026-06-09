import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[CRM] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in your .env file. ' +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const clientCache = new Map();

export const getSupabaseClient = (userId) => {
  if (!userId) return supabase;
  if (!clientCache.has(userId)) {
    clientCache.set(userId, createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          'x-client-user-id': userId
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }));
  }
  return clientCache.get(userId);
};
