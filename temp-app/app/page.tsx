import dynamic from "next/dynamic";
import { DotPattern } from "@/components/ui/dot-pattern";
import { LightRays } from "@/components/ui/light-rays";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedBySection } from "@/components/landing/TrustedBySection";

// Below-the-fold sections
const FeaturesSection = dynamic(() => import("@/components/landing/FeaturesSection").then(m => m.FeaturesSection), { ssr: true });
const PricingSection = dynamic(() => import("@/components/landing/PricingSection").then(m => m.PricingSection), { ssr: true });
const FooterSection = dynamic(() => import("@/components/landing/FooterSection").then(m => m.FooterSection), { ssr: true });

import { HashScrollHandler } from "@/components/shared/hash-scroll-handler";
import { PaymentSuccessHandler } from "@/components/shared/payment-success-handler";


export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white text-[#0d0d0d] font-sans overflow-hidden">
      {/* Background Patterns — contained so animations don't trigger full-page repaints */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ contain: "layout paint style" }}>
        <LightRays
          className="opacity-80"
          color="rgba(24, 226, 153, 0.4)"
          count={5}
        />
        <DotPattern
          className={cn(
            "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
            "absolute inset-0 opacity-50"
          )}
        />
      </div>

      {/* Hash-scroll: scrolls to #section when arriving from another page */}
      <HashScrollHandler />

      {/* Payment success popup + confetti — shows when ?payment=success is in URL */}
      <PaymentSuccessHandler />

      {/* Navbar — shared component */}
      <Navbar />

      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
}

