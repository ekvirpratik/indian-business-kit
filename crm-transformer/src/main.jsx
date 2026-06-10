import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { Toaster } from 'sonner';
import { CRMProvider } from './context/CRMContext';
import './index.css';
import App from './App.jsx';

// Suppress known Supabase Gotrue / LockManager or DevTools warnings from console
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] && 
    typeof args[0] === 'string' &&
    (
      args[0].includes('LockManager') || 
      args[0].includes('React DevTools') || 
      args[0].includes('Multiple GoTrueClient instances') ||
      args[0].includes('deprecated parameters for the initialization function')
    )
  ) {
    return;
  }
  originalWarn(...args);
};

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file or environment variables.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <CRMProvider>
          <App />
          <Toaster richColors position="top-right" duration={3000} />
        </CRMProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
