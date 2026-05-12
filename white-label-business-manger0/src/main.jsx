import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { DataProvider } from './context/DataContext'
import App from './App.jsx'
import { Toaster } from './components/ui/sonner'
import './index.css'

// Suppress known Supabase Gotrue / LockManager or DevTools warnings from console
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('LockManager') || args[0].includes('React DevTools'))) {
    return;
  }
  originalWarn(...args);
};


// IMPORTANT: The user must provide their own Clerk Publishable Key in the .env file
// You can get this from the Clerk Dashboard
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file or environment variables.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <DataProvider>
        <App />
        <Toaster />
      </DataProvider>
    </ClerkProvider>
  </React.StrictMode>,
)
