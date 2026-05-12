import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://agedvffyanqguwlgtugr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WIoVapOh58oTbIggUMO1lQ_eqCVejgp';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not provided in .env, using default development fallback.');
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


