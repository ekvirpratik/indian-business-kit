"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { LightRays } from "@/components/ui/light-rays";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { FooterSection } from "@/components/landing/FooterSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Sparkles, ArrowRight, ShieldCheck, Loader2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlareHover } from "@/components/ui/glare-hover";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { useSubscription } from "@/components/shared/subscription-provider";

import { useUser, useClerk } from "@clerk/nextjs";

const ScratchCard = dynamic(
  () => import("next-scratchcard").then((m) => m.ScratchCard ?? m.default),
  { ssr: false }
);

const COUPON_CODE = "GET500";
const BASE_PRICE = 2868;

const faqs = [
  { question: "Is there a free trial available?", answer: "Currently, we offer a highly discounted launch price instead of a free trial. You get full access to all features immediately upon subscription." },
  { question: "Do I have to pay annually?", answer: "Yes, our Launch Offer of ₹239/month is billed annually at ₹2,868. This helps us provide the best uninterrupted service at the lowest possible cost." },
  { question: "What is your refund policy?", answer: "All sales are final. Since you get immediate access to all features, we do not offer refunds. If you have any issues, our support team will help resolve them." },
  { question: "What happens after the launch offer ends?", answer: "Lock in the launch offer now and your renewal price stays the same. Future customers will pay standard pricing of ₹299/month." },
  { question: "How does the scratch card work?", answer: "Scratch the card below to reveal your exclusive coupon code. Enter it at checkout to get ₹500 off your annual plan instantly!" },
];

const features = [
  "Unlimited GST Billing & Invoicing",
  "Complete CRM & Lead Management",
  "Automated Payment Reminders",
  "AI Marketing Content Generator",
  "Priority WhatsApp Support",
  "Detailed Financial Analytics",
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [scratched, setScratched] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  // Subscription state
  const { status, expiryDate } = useSubscription();
  const checkingPlan = status === "loading";
  const planActive = status === "active";
  const planExpiry = expiryDate;

  const fireConfetti = useCallback(() => {
    const colors = ["#18E299", "#0fa76e", "#ffffff", "#ffd700"];
    const fire = (r: number, opts: object) =>
      confettiRef.current?.fire({ origin: { y: 0.6 }, colors, particleCount: Math.floor(200 * r), ...opts });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const handleScratchComplete = useCallback(() => {
    if (scratched) return;
    setScratched(true);
    fireConfetti();
  }, [scratched, fireConfetti]);

  const handleBuyNow = (withCoupon = false) => {
    const checkoutUrl = withCoupon ? `/checkout?coupon=${COUPON_CODE}` : "/checkout";
    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: checkoutUrl });
      return;
    }
    router.push(checkoutUrl);
  };

  return (

    <div className="relative min-h-screen bg-white text-[#0d0d0d] font-sans overflow-x-hidden">
      <Navbar />

      {scratched && (
        <Confetti ref={confettiRef} manualstart className="fixed inset-0 z-100 pointer-events-none w-full h-full" />
      )}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LightRays color="rgba(24, 226, 153, 0.3)" count={6} className="opacity-70" />
        <DotPattern className={cn("mask-[radial-gradient(600px_circle_at_center,white,transparent)]", "absolute inset-0 opacity-40")} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-125 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#18E299]/10 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 pt-40 pb-24">
        {/* Hero */}
        <section className="px-6 mb-20 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#18E299]/25 bg-[#18E299]/10 mb-8 backdrop-blur-sm">
            <Sparkles className="size-4 text-[#18E299]" />
            <span className="text-xs font-bold uppercase tracking-[1.5px] text-[#0d0d0d]">Special Launch Pricing</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-[#0d0d0d] mb-6 leading-[1.1]">
            One simple plan.<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">Infinite possibilities.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#666666] text-xl max-w-2xl mx-auto">
            Get full access to all our tools to grow your dhanda, for less than the cost of your daily cutting chai.
          </motion.p>
        </section>

        {/* Pricing Card */}
        <section className="px-6 mb-24 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="relative">
            <div className="absolute -inset-1 rounded-[2.5rem] bg-linear-to-b from-[#18E299]/30 to-transparent opacity-50 blur-xl" />
            <div className="relative rounded-[2.5rem] bg-[#0d0d0d] overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-[#18E299]/10 blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/10 relative z-10">

                  {/* Plan Active Banner */}
                  {!checkingPlan && planActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl bg-[#18E299]/15 border border-[#18E299]/30"
                    >
                      <BadgeCheck className="size-5 text-[#18E299] shrink-0" />
                      <div>
                        <p className="text-[#18E299] font-bold text-sm">Plan is Active ✓</p>
                        {planExpiry && (
                          <p className="text-[#18E299]/70 text-xs">Renews on {planExpiry}</p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <div className="mb-6 flex items-center gap-3">
                    <span className="text-2xl text-white/40 line-through font-medium">₹299</span>
                    <span className="rounded-full bg-[#18E299]/20 text-[#18E299] px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#18E299]/30">20% OFF FOREVER</span>
                  </div>
                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="text-7xl lg:text-8xl font-black text-white tracking-tight">₹239</span>
                    <span className="text-white/50 text-xl font-medium">/mo</span>
                  </div>
                  <p className="text-[#18E299] font-medium text-lg mb-10 bg-[#18E299]/10 inline-block px-4 py-2 rounded-lg border border-[#18E299]/20">
                    Billed annually at ₹{BASE_PRICE.toLocaleString("en-IN")}
                  </p>

                  {checkingPlan ? (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm">Checking plan status…</span>
                    </div>
                  ) : planActive ? (
                    <Button
                      onClick={() => router.push("/tools")}
                      className="w-full lg:w-auto px-10 rounded-full bg-[#18E299] text-[#0d0d0d] h-16 text-lg font-bold hover:bg-[#15c586] hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(24,226,153,0.3)]"
                    >
                      Go to Tools <ArrowRight className="ml-2 size-5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuyNow(false)}
                      className="w-full lg:w-auto px-10 rounded-full bg-[#18E299] text-[#0d0d0d] h-16 text-lg font-bold hover:bg-[#15c586] hover:scale-[1.02] transition-all shadow-[0_0_40px_rgba(24,226,153,0.3)]"
                    >
                      Buy Now <ArrowRight className="ml-2 size-5" />
                    </Button>
                  )}

                  <p className="text-white/40 text-sm mt-4">
                    <ShieldCheck className="inline size-3.5 mr-1" />
                    Secure checkout · Powered by Razorpay
                  </p>
                </div>
                <div className="flex-1 p-10 lg:p-14 bg-white/5 relative z-10">
                  <h3 className="text-xl font-bold text-white mb-8">Everything you need included:</h3>
                  <ul className="space-y-5">
                    {features.map((feature, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                        className="flex items-start gap-4 text-white/90 text-lg">
                        <CheckCircle2 className="size-6 text-[#18E299] shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(24,226,153,0.5)]" />
                        <span className="font-medium">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Scratch Card — only show if plan NOT active */}
        {!checkingPlan && !planActive && (
          <section className="px-6 mb-32 max-w-2xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#18E299]/25 bg-[#18E299]/10">
                <Sparkles className="size-4 text-[#18E299]" />
                <span className="text-xs font-bold uppercase tracking-[1.5px] text-[#0d0d0d]">Exclusive Offer</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#0d0d0d] mb-3 tracking-tight">
                🎁 Scratch for a <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">Surprise</span>
              </h2>
              <p className="text-[#666666] text-lg mb-10">Scratch the card below to unlock your secret discount coupon!</p>

              <div className="flex justify-center">
                <GlareHover width="360px" height="220px" background="#0d0d0d" color="#18E299" opacity={0.4}
                  className="rounded-3xl shadow-[0_0_60px_rgba(24,226,153,0.15)] border border-white/10">
                  <div className="w-90 h-55 rounded-3xl overflow-hidden">
                    {scratched ? (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-[#0d1a14] to-[#0d0d0d]">
                        <p className="text-white/50 text-sm mb-3 uppercase tracking-widest">Your Coupon</p>
                        <div className="text-5xl font-black text-[#18E299] tracking-[0.2em] mb-3">{COUPON_CODE}</div>
                        <p className="text-white/60 text-sm">₹500 off your annual plan 🎉</p>
                      </motion.div>
                    ) : (
                      <ScratchCard width={360} height={220} image="" finishPercent={50} onComplete={handleScratchComplete} brushSize={32}>
                        <div className="w-90 h-55 flex flex-col items-center justify-center bg-linear-to-br from-[#0d1a14] to-[#0d0d0d] gap-2">
                          <p className="text-white/50 text-sm uppercase tracking-widest">Your Coupon</p>
                          <div className="text-5xl font-black text-[#18E299] tracking-[0.2em]">{COUPON_CODE}</div>
                          <p className="text-white/60 text-sm">₹500 off your annual plan 🎉</p>
                        </div>
                      </ScratchCard>
                    )}
                  </div>
                </GlareHover>
              </div>

              <AnimatePresence>
                {scratched && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-10 space-y-4">
                    <p className="text-[#0d0d0d] font-semibold text-lg">🎉 You unlocked <span className="text-[#18E299] font-black">₹500 off</span>!</p>
                    <button
                      onClick={() => handleBuyNow(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#18E299] text-[#0d0d0d] font-black text-base hover:bg-[#15c586] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(24,226,153,0.3)]"
                    >
                      Claim My ₹500 Discount <ArrowRight className="size-5" />
                    </button>
                    <p className="text-[#888] text-sm">Coupon <strong className="text-[#0d0d0d]">GET500</strong> auto-applied at checkout</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </section>
        )}

        {/* FAQ */}
        <section className="px-6 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-[#0d0d0d] mb-6 tracking-tight">Pricing FAQs</h2>
            <p className="text-[#666666] text-lg">Everything you need to know about our pricing and billing.</p>
          </motion.div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}
                className="bg-white border border-black/5 rounded-2xl px-6 data-[state=open]:shadow-md data-[state=open]:border-[#18E299]/50 transition-all duration-300">
                <AccordionTrigger className="text-left font-bold text-lg text-[#0d0d0d] hover:no-underline py-6">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-[#666666] text-base leading-relaxed pb-6">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
