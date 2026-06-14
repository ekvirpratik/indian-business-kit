import { z } from 'zod';

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1, 'VITE_APP_NAME is required'),
  VITE_APP_URL: z.string().url('VITE_APP_URL must be a valid URL'),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'VITE_CLERK_PUBLISHABLE_KEY is required'),
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsedEnv.error.format(), null, 2)
  );
  throw new Error('Invalid environment variables. Check your .env file.');
}

export const env = parsedEnv.data;
export const isDev = import.meta.env.DEV;
