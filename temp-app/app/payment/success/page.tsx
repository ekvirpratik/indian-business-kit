"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { Navbar } from "@/components/shared/navbar";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const confettiRef = useRef<ConfettiRef>(null);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (fired) return;
    const timer = setTimeout(() => {
      const colors = ["#18E299", "#0fa76e", "#ffffff", "#ffd700"];
      const fire = (ratio: number, opts: object) => {
        confettiRef.current?.fire({
          origin: { y: 0.5 },
          colors,
          particleCount: Math.floor(250 * ratio),
          ...opts,
        });
      };
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
      setFired(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [fired]);

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white font-sans overflow-hidden flex flex-col">
      <Navbar />

      {/* Confetti canvas */}
      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed inset-0 z-100 pointer-events-none w-full h-full"
      />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full bg-[#18E299]/10 blur-[120px]" />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-lg w-full text-center">
          {/* Animated check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-[#18E299]/15 border-2 border-[#18E299]/30 mb-8"
          >
            <CheckCircle2 className="size-14 text-[#18E299] drop-shadow-[0_0_20px_rgba(24,226,153,0.6)]" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black mb-4"
          >
            Payment{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">
              Successful!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/60 text-lg mb-8"
          >
            Welcome to Indian Business Kit. Your annual subscription is now active.
          </motion.p>

          {/* Order details box */}
          {orderId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left"
            >
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
                Order Details
              </p>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Order ID</span>
                <span className="text-white font-mono text-sm font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60 text-sm">Status</span>
                <span className="text-[#18E299] font-semibold text-sm">✓ Paid</span>
              </div>
            </motion.div>
          )}

          {/* What's next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left"
          >
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">
              What&apos;s Next
            </p>
            <ul className="space-y-3">
              {[
                "Check your email for a receipt and login instructions",
                "Access your dashboard to start managing your business",
                "Our team will reach out on WhatsApp within 24 hours",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/70 text-sm">
                  <span className="size-5 rounded-full bg-[#18E299]/20 text-[#18E299] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15 transition-all"
            >
              <Home className="size-4" />
              Go Home
            </Link>
            <Link
              href="https://inventory-management.indianbusinesskit.in"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#18E299] text-[#0d0d0d] font-black hover:bg-[#15c586] hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(24,226,153,0.25)]"
            >
              Go to Dashboard
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d]" />}>
      <SuccessContent />
    </Suspense>
  );
}
