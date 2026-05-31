"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { useSubscription } from "@/components/shared/subscription-provider";
import {
  CheckCircle2,
  ArrowRight,
  Package,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  "Unlimited GST Billing & Invoicing",
  "Complete CRM & Lead Management",
  "Automated Payment Reminders",
  "AI Marketing Content Generator",
  "Priority WhatsApp Support",
  "Detailed Financial Analytics",
];

function SuccessHandlerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [firedConfetti, setFiredConfetti] = useState(false);
  const { refreshSubscription } = useSubscription();

  const paymentStatus = searchParams.get("payment");
  const orderId = searchParams.get("order_id");

  const [prevPaymentStatus, setPrevPaymentStatus] = useState<string | null>(null);
  if (paymentStatus !== prevPaymentStatus) {
    setPrevPaymentStatus(paymentStatus);
    if (paymentStatus === "success") {
      setShowPopup(true);
    }
  }

  useEffect(() => {
    if (paymentStatus !== "success") return;

    // Set the local state flag immediately to prevent visual flash
    if (typeof window !== "undefined") {
      localStorage.setItem("planActive", "true");
      localStorage.setItem("paymentTime", Date.now().toString());
    }

    // Refresh context state so user doesn't have to reload
    refreshSubscription();

    // Fire confetti after a short delay
    const timer = setTimeout(() => {
      if (firedConfetti) return;
      const colors = ["#18E299", "#0fa76e", "#ffffff", "#ffd700", "#ff6b6b"];
      const fire = (r: number, opts: object) =>
        confettiRef.current?.fire({
          origin: { y: 0.5 },
          colors,
          particleCount: Math.floor(300 * r),
          ...opts,
        });

      const fireAll = () => {
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
        setFiredConfetti(true);
      };

      if (!confettiRef.current) {
        setTimeout(() => {
          if (confettiRef.current) fireAll();
        }, 200);
      } else {
        fireAll();
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus]);

  const handleClose = () => {
    setShowPopup(false);
    // Clean query params from URL
    router.replace("/", { scroll: false });
  };

  if (paymentStatus !== "success") return null;

  return (
    <>
      {/* Confetti canvas */}
      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed inset-0 pointer-events-none w-full h-full"
        style={{ zIndex: 200 }}
      />

      {/* Thank You Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            style={{ zIndex: 150 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] rounded-3xl border border-white/10 overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.7)]"
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
              >
                <X className="size-5" />
              </button>

              {/* Green header band */}
              <div className="bg-[#18E299]/15 border-b border-[#18E299]/20 px-8 pt-10 pb-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#18E299]/20 border-2 border-[#18E299]/40 mb-5"
                >
                  <CheckCircle2 className="size-10 text-[#18E299] drop-shadow-[0_0_20px_rgba(24,226,153,0.7)]" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black text-white mb-2"
                >
                  Welcome to{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">
                    Indian Business Kit!
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/60 text-base"
                >
                  Your annual subscription is now <span className="text-[#18E299] font-semibold">active</span>.
                  {orderId && (
                    <span className="block text-white/30 text-xs mt-1">Order: {orderId}</span>
                  )}
                </motion.p>
              </div>

              {/* Body */}
              <div className="px-8 py-7">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles className="size-3.5 text-[#18E299]" />
                    You now have access to
                  </p>
                  <ul className="space-y-2.5 mb-7">
                    {BENEFITS.map((b, i) => (
                      <motion.li
                        key={b}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.06 }}
                        className="flex items-center gap-3 text-white/80 text-sm"
                      >
                        <CheckCircle2 className="size-4 text-[#18E299] shrink-0" />
                        {b}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Link
                    href="/tools"
                    onClick={handleClose}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#18E299] text-[#0d0d0d] font-black hover:bg-[#15c586] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(24,226,153,0.3)]"
                  >
                    <Package className="size-4" />
                    Go To Tools
                    <ArrowRight className="size-4" />
                  </Link>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-medium text-sm"
                  >
                    Explore later
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Wrapped in Suspense because useSearchParams requires it in Next.js App Router
export function PaymentSuccessHandler() {
  return (
    <Suspense fallback={null}>
      <SuccessHandlerContent />
    </Suspense>
  );
}
