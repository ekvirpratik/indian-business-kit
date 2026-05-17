"use client";

import { Suspense, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/shared/navbar";
import { FooterSection } from "@/components/landing/FooterSection";
import Aurora from "@/components/ui/aurora";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import {
  ArrowLeft,
  ArrowRight,
  Tag,
  ShieldCheck,
  Mail,
  Sparkles,
  CheckCircle2,
  Loader2,
  User,
  Phone,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUPON_CODE = "GET500";
const BASE_PRICE = 2868;
const DISCOUNT = 500;
const FINAL_PRICE = BASE_PRICE - DISCOUNT;

const features = [
  "Unlimited GST Billing & Invoicing",
  "Complete CRM & Lead Management",
  "Automated Payment Reminders",
  "AI Marketing Content Generator",
  "Priority WhatsApp Support",
  "Detailed Financial Analytics",
];

// ─── Validation helpers ────────────────────────────────────────────────────────
function validatePhone(p: string) {
  return /^\d{10}$/.test(p.trim());
}
function validateEmail(e: string) {
  return e === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

import { useUser, SignIn } from "@clerk/nextjs";
import { useEffect } from "react";

// ─── Main checkout form ────────────────────────────────────────────────────────
function CheckoutContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const preApplied =
    searchParams.get("coupon")?.toUpperCase() === COUPON_CODE;

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [couponInput, setCouponInput] = useState(preApplied ? COUPON_CODE : "");
  const [applied, setApplied] = useState(preApplied);
  const [couponError, setCouponError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const confettiRef = useRef<ConfettiRef>(null);
  const [confettiFired, setConfettiFired] = useState(preApplied);

  const total = applied ? FINAL_PRICE : BASE_PRICE;

  // Prefill user details from Clerk
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      if (!name) setName(user.fullName || user.firstName || "");
      if (!email) setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [isLoaded, isSignedIn, user, name, email]);

  // Restore scrolling when user is authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      document.body.style.overflow = "auto";
      document.body.style.pointerEvents = "auto";
    }
  }, [isLoaded, isSignedIn]);

  // Confetti burst
  const fireConfetti = useCallback(() => {
    if (confettiFired) return;
    const colors = ["#18E299", "#0fa76e", "#ffffff", "#ffd700"];
    const fire = (r: number, opts: object) =>
      confettiRef.current?.fire({
        origin: { y: 0.6 },
        colors,
        particleCount: Math.floor(200 * r),
        ...opts,
      });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
    setConfettiFired(true);
  }, [confettiFired]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050d08] flex items-center justify-center">
        <div className="size-10 rounded-full border-2 border-[#18E299]/30 border-t-[#18E299] animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="relative min-h-screen bg-[#050d08] text-white font-sans overflow-x-hidden">
        {/* Aurora background */}
        <div className="fixed inset-0 z-0" aria-hidden>
          <Aurora
            colorStops={["#18E299", "#0fa76e", "#1a3d26"]}
            blend={0.38}
            amplitude={1.1}
            speed={0.35}
          />
        </div>
        <div className="fixed inset-0 z-0 bg-[#050d08]/55" aria-hidden />

        <Navbar />

        <main className="relative z-10 pt-32 pb-24 px-6 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
          <div className="max-w-md w-full mx-auto text-center mb-6">
            <h1 className="text-3xl font-black text-white mb-2">Sign in to Continue</h1>
            <p className="text-white/50 text-sm">Please sign in or create an account to proceed with the checkout.</p>
          </div>
          <div className="relative z-10 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
            <SignIn routing="hash" forceRedirectUrl="/checkout" />
          </div>
        </main>

        <FooterSection />
      </div>
    );
  }

  const handleApplyCoupon = () => {
    if (couponInput.trim().toUpperCase() === COUPON_CODE) {
      setApplied(true);
      setCouponError("");
      setTimeout(() => fireConfetti(), 200);
    } else {
      setCouponError("Invalid code. Try GET500");
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your full name";
    if (!validatePhone(phone))
      e.phone = "Enter a valid 10-digit phone number";
    if (!validateEmail(email)) e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setGeneralError("");
    setLoading(true);

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          customerName: name.trim(),
          customerEmail: email.trim() || undefined,
          customerPhone: phone.trim(),
          coupon: applied ? COUPON_CODE : null,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // Initialize Cashfree and open checkout
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode:
          (process.env.NEXT_PUBLIC_CASHFREE_ENV as "sandbox" | "production") ||
          "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self", // full redirect so callback can save to DB
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setGeneralError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050d08] text-white font-sans overflow-x-hidden">
      {/* Confetti */}
      <Confetti
        ref={confettiRef}
        manualstart
        className="fixed inset-0 pointer-events-none w-full h-full"
        style={{ zIndex: 100 }}
      />

      {/* Aurora background */}
      <div className="fixed inset-0 z-0" aria-hidden>
        <Aurora
          colorStops={["#18E299", "#0fa76e", "#1a3d26"]}
          blend={0.38}
          amplitude={1.1}
          speed={0.35}
        />
      </div>
      <div className="fixed inset-0 z-0 bg-[#050d08]/55" aria-hidden />

      <Navbar />

      <main className="relative z-10 pt-32 pb-24 px-6">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-white/40 hover:text-[#18E299] transition-colors text-sm group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Pricing
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#18E299]/25 bg-[#18E299]/10 mb-5 backdrop-blur-sm">
            <Sparkles className="size-4 text-[#18E299]" />
            <span className="text-xs font-bold uppercase tracking-[1.5px] text-[#18E299]">
              Secure Checkout
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Indian Business Kit —{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">
              Annual Plan
            </span>
          </h1>
          <p className="text-white/50 mt-3 text-lg">
            You&apos;re one step away from transforming your business.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/4 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col lg:flex-row">

              {/* ── Left: Customer Details + Coupon + Features ── */}
              <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                  Your Details
                </p>

                {/* Product box */}
                <div className="flex gap-4 mb-7 p-4 rounded-2xl bg-white/3 border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-[#18E299]/10 border border-[#18E299]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="size-6 text-[#18E299]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base leading-tight">
                      Indian Business Kit
                    </p>
                    <p className="text-white/50 text-sm mt-0.5">Annual Plan</p>
                    <p className="text-[#18E299] font-black text-xl mt-1">
                      ₹{total.toLocaleString("en-IN")}
                      <span className="text-white/40 text-sm font-normal ml-1">
                        /year
                      </span>
                    </p>
                  </div>
                </div>

                {/* Customer form */}
                <div className="space-y-3 mb-6">
                  {/* Name */}
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setErrors((prev) => ({ ...prev, name: "" }));
                        }}
                        placeholder="Full Name *"
                        className={`w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors ${
                          errors.name
                            ? "border-red-500/60"
                            : "border-white/10 focus:border-[#18E299]/50"
                        }`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                          setErrors((prev) => ({ ...prev, phone: "" }));
                        }}
                        placeholder="Phone Number (10 digits) *"
                        className={`w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors ${
                          errors.phone
                            ? "border-red-500/60"
                            : "border-white/10 focus:border-[#18E299]/50"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        placeholder="Email Address *"
                        className={`w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 text-sm focus:outline-none transition-colors ${
                          errors.email
                            ? "border-red-500/60"
                            : "border-white/10 focus:border-[#18E299]/50"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1 ml-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
                    Coupon Code
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        disabled={applied}
                        className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#18E299]/50 disabled:opacity-60 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applied}
                      className="px-5 py-3 rounded-xl bg-[#18E299] text-[#050d08] font-bold text-sm hover:bg-[#15c586] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {applied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1">{couponError}</p>
                  )}
                  <AnimatePresence>
                    {applied && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[#18E299] text-xs mt-1.5 ml-1 font-semibold"
                      >
                        🎉 ₹500 discount applied!
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Features list */}
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-white/70 text-sm">
                        <CheckCircle2 className="size-4 text-[#18E299] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 mt-7 pt-5 border-t border-white/5">
                  {[
                    { icon: Mail, label: "support@indianbusinesskit.in" },
                    { icon: ShieldCheck, label: "Secure Checkout" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-white/35 text-xs">
                      <Icon className="size-3.5" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Order Summary + Pay ── */}
              <div className="w-full lg:w-72 p-8 lg:p-10 bg-white/2.5 flex flex-col">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-6">
                  Order Summary
                </p>

                <div className="space-y-3 text-sm flex-1">
                  <div className="flex justify-between text-white/60">
                    <span>Base Price</span>
                    <span>₹{BASE_PRICE.toLocaleString("en-IN")}</span>
                  </div>
                  <AnimatePresence>
                    {applied && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-[#18E299] overflow-hidden"
                      >
                        <span>Coupon (GET500)</span>
                        <span>−₹{DISCOUNT.toLocaleString("en-IN")}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between text-white/60">
                    <span>GST (18%)</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Billing cycle</span>
                    <span>Annual</span>
                  </div>
                  <div className="h-px bg-white/10 my-3" />
                  <div className="flex justify-between text-white font-black text-2xl">
                    <span>Total</span>
                    <motion.span key={total} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                      ₹{total.toLocaleString("en-IN")}
                    </motion.span>
                  </div>
                  <p className="text-white/30 text-xs">
                    Billed once per year · renews at same price
                  </p>
                </div>

                {generalError && (
                  <p className="text-red-400 text-xs mt-4 text-center">{generalError}</p>
                )}

                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="mt-8 w-full py-4 rounded-2xl bg-[#18E299] text-[#050d08] font-black text-base hover:bg-[#15c586] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_0_40px_rgba(24,226,153,0.3)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Pay ₹{total.toLocaleString("en-IN")}
                      <ArrowRight className="size-5" />
                    </>
                  )}
                </button>

                <p className="text-white/20 text-xs text-center mt-4 leading-relaxed">
                  Powered by Cashfree Payments.
                  <br />
                  Your data is encrypted &amp; secure.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="max-w-4xl mx-auto mt-8 flex flex-wrap justify-center gap-6 text-white/25 text-xs"
        >
          {[
            "256-bit SSL Encryption",
            "Cashfree Certified",
            "PCI-DSS Compliant",
            "Instant Access After Payment",
          ].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              {t}
            </span>
          ))}
        </motion.div>
      </main>

      <FooterSection />
    </div>
  );
}

// Suspense boundary required by Next.js for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050d08] flex items-center justify-center">
          <div className="size-10 rounded-full border-2 border-[#18E299]/30 border-t-[#18E299] animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
