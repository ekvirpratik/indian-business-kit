import React, { useEffect, useState } from 'react';
import { Show, useUser, useClerk } from "@clerk/react";
import { useData } from './context/DataContext';
import { toast } from 'sonner';
import LandingPage from './components/LandingPage';
import DashboardLayout from './components/DashboardLayout';
import SetupWizard from './components/SetupWizard';
import { getSupabaseClient } from './lib/supabaseClient';

function App() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { store, updateBusinessInfo } = useData();
  const [isSubscribed, setIsSubscribed] = useState(null);

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
            toast.error('Error fetching subscription: ' + error.message);
          }
          const subData = Array.isArray(data) ? data[0] : data;
          setIsSubscribed(!!(subData && subData.active));
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to verify subscription: ' + err.message);
          setIsSubscribed(false);
        });
    }
  }, [user, isLoaded, isSignedIn]);

  // Derive effective subscription: treat as null when signed out
  const subscription = isSignedIn ? isSubscribed : null;
  const isSetupComplete = store.businessInfo.setupComplete;

  if (isSignedIn && subscription === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse tracking-wider">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && subscription === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050d08] text-white font-sans antialiased p-6">
        {/* Glow Background */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#18E299]/5 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-slate-950/40 backdrop-blur-xl border border-emerald-500/10 p-8 rounded-3xl flex flex-col items-center text-center gap-6 shadow-[0_20px_50px_rgba(24,226,153,0.03)] overflow-hidden">
          {/* Top subtle green accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#18E299] to-transparent"></div>
          
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-[#18E299] text-3xl font-extrabold shadow-inner shadow-emerald-500/5">
            🔒
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Access Restricted
            </h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              Your account does not have an active subscription to Indian Business Kit.
            </p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <a 
              href="https://wa.me/917020431433?text=Hi%2C%20I%20need%20assistance%20activating%20my%20Indian%20Business%20Kit%20subscription%20for%20this%20account."
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#18E299] hover:bg-[#15c586] text-[#050d08] font-black py-3.5 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              Contact Support
            </a>
            <button 
              onClick={() => signOut()}
              className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-300 font-bold py-3.5 px-6 rounded-2xl border border-slate-900 hover:border-slate-800 transition-all duration-200"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-background antialiased">
      <Show when="signed-out">
        <LandingPage />
      </Show>
      <Show when="signed-in">
        {isSetupComplete ? (
          <DashboardLayout />
        ) : (
          <SetupWizard onComplete={(data) => updateBusinessInfo(data)} />
        )}
      </Show>
    </div>
  );
}

export default App;

