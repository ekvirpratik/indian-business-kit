import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUser, useClerk, SignInButton } from '@clerk/react';
import { useCRM } from './context/CRMContext';
import { getSupabaseClient } from './lib/supabaseClient';

// Layout & Components (always loaded — tiny)
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages — lazy loaded per route so each page's JS is only downloaded when visited
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Leads       = lazy(() => import('./pages/Leads'));
const LeadDetail  = lazy(() => import('./pages/LeadDetail'));
const Pipeline    = lazy(() => import('./pages/Pipeline'));
const Clients     = lazy(() => import('./pages/Clients'));
const Tasks       = lazy(() => import('./pages/Tasks'));
const FollowUps   = lazy(() => import('./pages/FollowUps'));
const WhatsApp    = lazy(() => import('./pages/WhatsApp'));
const Quotations  = lazy(() => import('./pages/Quotations'));
const Reports     = lazy(() => import('./pages/Reports'));
const Team        = lazy(() => import('./pages/Team'));
const Settings    = lazy(() => import('./pages/Settings'));

// Page titles for each route — keeps browser tab descriptive
const PAGE_TITLES = {
  '/': 'Dashboard — CRM',
  '/leads': 'All Leads — CRM',
  '/pipeline': 'Sales Pipeline — CRM',
  '/clients': 'Clients — CRM',
  '/tasks': 'Task Manager — CRM',
  '/follow-ups': 'Follow-ups — CRM',
  '/whatsapp': 'WhatsApp Queue — CRM',
  '/quotations': 'Quotations — CRM',
  '/reports': 'Reports — CRM',
  '/team': 'Team — CRM',
  '/settings': 'Settings — CRM',
};

// Lightweight skeleton shown while a lazy page chunk is being fetched
function PageSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center p-8" aria-label="Loading page…" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

// Hook to update document.title on route changes
function usePageTitle() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    // Lead detail page has a dynamic path
    const title = path.startsWith('/leads/')
      ? 'Lead Details — CRM'
      : (PAGE_TITLES[path] || 'CRM — Indian Business Kit');
    document.title = title;
  }, [location.pathname]);
}

function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { loading: crmLoading } = useCRM();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(null);

  // Update page title on every navigation
  usePageTitle();

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // Check Subscription (Shared with Billing App)
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const client = getSupabaseClient(user.id);
      const email = user.primaryEmailAddress?.emailAddress;

      client
        .from('subscriptions')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${email}`)
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching subscription:', error);
          }
          const subData = Array.isArray(data) ? data[0] : data;
          setIsSubscribed(!!(subData && subData.active));
        })
        .catch(err => {
          console.error(err);
          setIsSubscribed(false);
        });
    } else if (isLoaded && !isSignedIn) {
      setTimeout(() => setIsSubscribed(null), 0);
    }
  }, [user, isLoaded, isSignedIn]);

  // Loading States
  if (!isLoaded || (isSignedIn && isSubscribed === null) || (isSignedIn && crmLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased" role="status" aria-label="Loading application">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm animate-pulse tracking-wider">
            {!isLoaded ? 'Initializing…' : crmLoading ? 'Loading CRM Data…' : 'Verifying account status…'}
          </p>
        </div>
      </div>
    );
  }

  // Signed Out View
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased relative overflow-hidden p-6 select-none">
        {/* Gradients */}
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" aria-hidden="true" />
          
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl font-extrabold shadow-inner shadow-indigo-500/5" aria-hidden="true">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Indian Business CRM
            </h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Supercharge your sales with lead tracking, automated follow-ups, quotes, and WhatsApp marketing.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <SignInButton mode="modal">
              <button
                id="sign-in-btn"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                Sign In to CRM
              </button>
            </SignInButton>
            <a 
              href="https://indianbusinesskit.in" 
              className="text-xs text-slate-500 hover:text-slate-400 font-semibold transition-colors mt-2"
              rel="noreferrer"
            >
              Back to Indian Business Kit
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Restricted Access View (No active subscription)
  if (isSubscribed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased p-6 relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl flex flex-col items-center text-center gap-6 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" aria-hidden="true" />
          
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center justify-center text-red-400 text-3xl font-extrabold" aria-hidden="true">
            🔒
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Your account does not have an active subscription to Indian Business Kit.
            </p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <a 
              href="https://wa.me/917020431433?text=Hi%2C%20I%20need%20assistance%20activating%20my%20Indian%20Business%20Kit%20CRM%20subscription."
              target="_blank"
              rel="noreferrer noopener"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              Contact Support
            </a>
            <button 
              onClick={() => signOut()}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-300 font-bold py-3.5 px-6 rounded-2xl border border-slate-800 transition-all duration-200 cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App Dashboard Layout (Authenticated & Subscribed)
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        
        {/* Scrollable Content — each page chunk loads on demand */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/leads"        element={<Leads />} />
              <Route path="/leads/:id"    element={<LeadDetail />} />
              <Route path="/pipeline"     element={<Pipeline />} />
              <Route path="/clients"      element={<Clients />} />
              <Route path="/tasks"        element={<Tasks />} />
              <Route path="/follow-ups"   element={<FollowUps />} />
              <Route path="/whatsapp"     element={<WhatsApp />} />
              <Route path="/quotations"   element={<Quotations />} />
              <Route path="/reports"      element={<Reports />} />
              <Route path="/team"         element={<Team />} />
              <Route path="/settings"     element={<Settings />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
