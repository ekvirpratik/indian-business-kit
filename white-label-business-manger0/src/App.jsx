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
          if (subData && subData.active) {
            setIsSubscribed(true);
          } else {
            setIsSubscribed(false);
          }
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to verify subscription: ' + err.message);
          setIsSubscribed(false);
        });
    } else if (isLoaded && !isSignedIn) {
      setIsSubscribed(null);
    }
  }, [user, isLoaded, isSignedIn]);

  const isSetupComplete = store.businessInfo.setupComplete;

  if (isSignedIn && isSubscribed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse tracking-wider">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn && isSubscribed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans antialiased p-6">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
          <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 text-3xl font-extrabold shadow-inner shadow-pink-500/20">
            🔒
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Access Restricted
            </h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              It looks like your account does not have an active subscription to our Business Kit yet.
            </p>
          </div>
          <div className="w-full flex flex-col gap-3">
            <a 
              href="https://wa.me/919054256493"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-linear-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              Contact Support
            </a>
            <button 
              onClick={() => signOut()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 px-6 rounded-2xl border border-slate-700 transition-colors"
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

