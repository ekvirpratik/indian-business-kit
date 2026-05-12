"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

type SubStatus = "loading" | "active" | "expired" | "none";

interface SubscriptionContextType {
  status: SubStatus;
  expiryDate: string | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  status: "none",
  expiryDate: null,
  refreshSubscription: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState<SubStatus>("loading");
  const [expiryDate, setExpiryDate] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!isLoaded) return;
    
    const localActive = typeof window !== "undefined" ? localStorage.getItem("planActive") === "true" : false;
    const paymentTime = typeof window !== "undefined" ? localStorage.getItem("paymentTime") : null;
    const isRecentPayment = paymentTime ? Date.now() - parseInt(paymentTime) < 300000 : false;

    if (localActive && isRecentPayment) {
      setStatus("active");
      setExpiryDate("Active (Syncing...)");
      return;
    }

    if (!isSignedIn) {
      if (localActive) {
        setStatus("active");
        setExpiryDate("Active (Please Login to manage)");
      } else {
        setStatus("none");
        setExpiryDate(null);
      }
      return;
    }

    try {
      setStatus("loading");
      
      const params = new URLSearchParams();
      if (user?.emailAddresses[0]?.emailAddress) {
        params.append("email", user.emailAddresses[0].emailAddress);
      }
      if (user?.phoneNumbers[0]?.phoneNumber) {
        params.append("phone", user.phoneNumbers[0].phoneNumber);
      }
      
      const queryString = params.toString();
      const url = `/api/check-subscription${queryString ? `?${queryString}` : ""}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to check subscription");
      
      const data = await res.json();
      if (data.active) {
        if (typeof window !== "undefined") {
          localStorage.setItem("planActive", "true");
          localStorage.removeItem("paymentTime");
        }
        setStatus("active");
        setExpiryDate(new Date(data.subscription.expires_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
      } else if (data.expired) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("planActive");
          localStorage.removeItem("paymentTime");
        }
        setStatus("expired");
        setExpiryDate(new Date(data.subscription.expires_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("planActive");
          localStorage.removeItem("paymentTime");
        }
        setStatus("none");
        setExpiryDate(null);
      }
    } catch (error) {
      console.error("Subscription fetch error:", error);
      if (localActive) {
        setStatus("active");
        setExpiryDate("Active (Offline)");
      } else {
        setStatus("none");
        setExpiryDate(null);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded) return;
    
    const checkSubscription = async () => {
      const localActive = typeof window !== "undefined" ? localStorage.getItem("planActive") === "true" : false;
      const paymentTime = typeof window !== "undefined" ? localStorage.getItem("paymentTime") : null;
      const isRecentPayment = paymentTime ? Date.now() - parseInt(paymentTime) < 300000 : false;

      if (localActive && isRecentPayment) {
        setStatus("active");
        setExpiryDate("Active (Syncing...)");
        return;
      }

      if (!isSignedIn) {
        if (localActive) {
          setStatus("active");
          setExpiryDate("Active (Please Login to manage)");
        } else {
          setStatus("none");
          setExpiryDate(null);
        }
        return;
      }

      try {
        setStatus("loading");
        
        const params = new URLSearchParams();
        if (user?.emailAddresses[0]?.emailAddress) {
          params.append("email", user.emailAddresses[0].emailAddress);
        }
        if (user?.phoneNumbers[0]?.phoneNumber) {
          params.append("phone", user.phoneNumbers[0].phoneNumber);
        }
        
        const queryString = params.toString();
        const url = `/api/check-subscription${queryString ? `?${queryString}` : ""}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to check subscription");
        
        const data = await res.json();
        if (data.active) {
          if (typeof window !== "undefined") {
            localStorage.setItem("planActive", "true");
            localStorage.removeItem("paymentTime");
          }
          setStatus("active");
          setExpiryDate(new Date(data.subscription.expires_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
        } else if (data.expired) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("planActive");
            localStorage.removeItem("paymentTime");
          }
          setStatus("expired");
          setExpiryDate(new Date(data.subscription.expires_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }));
        } else {
          if (typeof window !== "undefined") {
            localStorage.removeItem("planActive");
            localStorage.removeItem("paymentTime");
          }
          setStatus("none");
          setExpiryDate(null);
        }
      } catch (error) {
        console.error("Subscription fetch error:", error);
        if (localActive) {
          setStatus("active");
          setExpiryDate("Active (Offline)");
        } else {
          setStatus("none");
          setExpiryDate(null);
        }
      }
    };

    checkSubscription();
  }, [isLoaded, isSignedIn]);

  return (
    <SubscriptionContext.Provider value={{ status, expiryDate, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
