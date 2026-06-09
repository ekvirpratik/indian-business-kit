import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { Toaster } from 'sonner';
import { CRMProvider } from './context/CRMContext';
import './index.css';
import App from './App.jsx';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Clerk publishable key missing in environment variables.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <BrowserRouter>
        <CRMProvider>
          <App />
          <Toaster richColors position="top-right" duration={3000} />
        </CRMProvider>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
