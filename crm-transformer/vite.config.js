import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Raise warning threshold slightly — we are explicitly splitting
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — smallest, loads first
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Auth — Clerk is large; isolate so it doesn't delay app JS
          'vendor-clerk': ['@clerk/react'],
          // Database client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Charts — only needed on Dashboard & Reports pages
          'vendor-recharts': ['recharts'],
          // PDF generation — only needed on Quotations page (heavy!)
          'vendor-pdf': ['jspdf', 'html2canvas'],
          // UI utilities
          'vendor-ui': ['sonner', 'lucide-react', 'zod'],
        },
      },
    },
  },
});
