"use client";

import { CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export function PricingSection() {
  return (
    <section id="pricing" className="relative z-10 w-full bg-white py-24 px-6 content-visibility-auto">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#0d0d0d] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-[#666666] text-lg max-w-2xl mx-auto">
            Everything you need to grow your dhanda, for less than the cost of your daily cutting chai.
          </p>
        </div>

        <div className="flex justify-center">
          {/* Main Pricing Card */}
          <div className="w-full max-w-lg rounded-[24px] bg-[#0d0d0d] text-white p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-[#18E299] opacity-10 blur-3xl pointer-events-none"></div>
            
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 mb-6">
                <span className="text-xs font-medium uppercase tracking-[0.65px] text-[#18E299]">
                  Launch Offer
                </span>
              </div>
              
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl text-white/50 line-through font-medium">₹299</span>
                <span className="rounded-full bg-[#18E299]/20 text-[#18E299] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide">20% OFF</span>
              </div>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-bold tracking-tight">₹239</span>
                <span className="text-white/60 font-medium">/month</span>
              </div>
              <div className="mb-8 text-sm text-white/40 font-medium">
                Billed yearly at ₹2,868
              </div>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited GST Billing & Invoicing",
                  "Complete CRM & Lead Management",
                  "Automated Payment Reminders",
                  "AI Marketing Content Generator",
                  "Priority WhatsApp Support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="size-5 text-[#18E299] shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Link href="/pricing" className="w-full mt-4">
              <Button className="w-full rounded-full bg-[#18E299] text-[#0d0d0d] h-14 text-[16px] font-semibold hover:bg-[#15c586]">
                Buy Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
