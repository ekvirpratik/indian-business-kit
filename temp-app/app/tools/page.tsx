"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Navbar } from "@/components/shared/navbar"
import { useSubscription } from "@/components/shared/subscription-provider"
import { LightRays } from "@/components/ui/light-rays"
import { DotPattern } from "@/components/ui/dot-pattern"
import { MagicCard } from "@/components/ui/magic-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Users,
  Megaphone,
  BarChart3,
  MessageSquare,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  Package,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react"

// ─── Tool data ────────────────────────────────────────────────────────────────
const ACTIVE_TOOLS = [
  {
    id: "inventory-billing",
    icon: Package,
    name: "Inventory & Billing Manager",
    tagline: "Manage stock and invoices effortlessly.",
    description:
      "Keep track of your stock levels in real-time, generate professional GST-compliant invoices in seconds, and manage your customers and suppliers from a single dashboard.",
    features: ["Stock Tracking", "GST Invoice Generator", "Supplier Management", "Financial Reports"],
    link: "https://inventory-management.indianbusinesskit.in",
  },
  {
    id: "crm",
    icon: Users,
    name: "CRM & Lead Manager",
    tagline: "Never lose a lead again.",
    description: "Capture, track and nurture every potential customer through a visual pipeline without lead scoring.",
    features: ["Visual Pipeline", "Lead Tracking", "Automated Follow-ups", "WhatsApp Integration"],
    link: "https://crm.indianbusinesskit.in",
  }
]

const COMING_SOON_TOOLS = [
  {
    id: "HR Management system",
    icon: Megaphone,
    name: "HR Management system",
    tagline: "Manage employee records and attendance in one place.",
    description: "Manage employee records, track attendance, and generate reports with ease.",
  },
  {
    id: "Marketing Content Genrator",
    icon: BarChart3,
    name: "Marketing Content Genrator",
    tagline: "Grow on autopilot.",
    description: "Generate scroll-stopping social posts, WhatsApp campaigns, and SEO content using AI.",
  },
  {
    id: "Learning Digital Marketing",
    icon: Globe,
    name: "Learning Digital Marketing",
    tagline: "Your path to digital success.",
    description: "Learn how to take your business online with step-by-step courses and expert guidance.",
  }
]

// ─── Subscription state ───────────────────────────────────────────────────────
// Now using the global useSubscription context!

// ─── Expiry Popup ─────────────────────────────────────────────────────────────
function ExpiryPopup({ expiryDate, onClose }: { expiryDate: string | null; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="relative w-full max-w-md bg-white rounded-3xl border border-black/5 overflow-hidden shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black/30 hover:text-black/60 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-200 mb-5">
            <AlertTriangle className="size-8 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-[#0d0d0d] mb-2">
            Your Plan Has Expired
          </h3>
          <p className="text-[#666] text-sm mb-1">
            Your subscription expired on{" "}
            <span className="font-semibold text-[#0d0d0d]">{expiryDate}</span>.
          </p>
          <p className="text-[#666] text-sm mb-8">
            Renew now to continue using all tools without interruption.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/checkout">
              <Button className="w-full h-12 rounded-2xl bg-[#18E299] text-[#0d0d0d] font-black hover:bg-[#15c586] transition-all shadow-[0_0_20px_rgba(24,226,153,0.25)]">
                <RefreshCw className="size-4 mr-2" />
                Renew Now
              </Button>
            </Link>
            <button
              onClick={onClose}
              className="text-[#666] text-sm hover:text-[#0d0d0d] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Featured Tool Card ───────────────────────────────────────────────────────
function FeaturedToolCard({ tool, subStatus }: { tool: typeof ACTIVE_TOOLS[0]; subStatus: "loading" | "active" | "expired" | "none" }) {
  const isActive = subStatus === "active"
  const isLoading = subStatus === "loading"

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative w-full h-full group"
    >
      <div className="rounded-[28px] border-2 border-[#18E299]/60 p-1.5 shadow-[0_8px_32px_rgba(24,226,153,0.15)] bg-white/50 backdrop-blur-md h-full flex flex-col">
        <MagicCard
          mode="orb"
          glowFrom="rgba(24,226,153,0.3)"
          glowTo="rgba(24,226,153,0.1)"
          glowOpacity={0.8}
          glowSize={400}
          className="rounded-[22px] flex-1 bg-white overflow-hidden border border-black/5 shadow-sm flex flex-col"
        >
          <div className="p-8 md:p-10 flex flex-col gap-8 h-full">
            {/* Top Col */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#18E299]/10 border border-[#18E299]/20">
                  <motion.div whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ duration: 0.5 }}>
                    <tool.icon className="size-6 text-[#0fa76e]" />
                  </motion.div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18E299]/10 border border-[#18E299]/20">
                  <span className="size-1.5 rounded-full bg-[#18E299] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0fa76e]">Live</span>
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-[#0d0d0d] mb-2">{tool.name}</h2>
                <p className="text-[#0fa76e] font-mono text-sm tracking-wide mb-4">{tool.tagline}</p>
                <p className="text-[#666666] text-base leading-relaxed">{tool.description}</p>
              </div>

              {/* CTA — dynamic based on sub status */}
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block mt-4">
                {isLoading ? (
                  <Button disabled className="rounded-full bg-[#18E299]/50 text-[#0d0d0d] px-8 h-12 text-[15px] font-bold">
                    Checking…
                  </Button>
                ) : isActive ? (
                  <Link href={tool.link} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-full bg-[#18E299] text-[#0d0d0d] px-8 h-12 text-[15px] font-bold hover:bg-[#15c586] shadow-[0_2px_10px_rgba(24,226,153,0.3)] transition-all">
                      Launch App
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/checkout">
                    <Button className="rounded-full bg-[#0d0d0d] text-white px-8 h-12 text-[15px] font-bold hover:bg-[#0d0d0d]/85 shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-all">
                      Purchase Now
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Bottom Col - Features */}
            <div className="w-full grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-black/5">
              {tool.features.map((feature) => (
                <div key={feature} className="flex flex-col justify-center p-4 rounded-xl bg-black/2 border border-black/5">
                  <CheckCircle2 className="size-4 text-[#18E299] mb-2" />
                  <span className="text-xs font-medium text-[#0d0d0d]">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </MagicCard>
      </div>
    </motion.div>
  )
}

// ─── Coming Soon Card ─────────────────────────────────────────────────────────
function ComingSoonCard({ tool, index }: { tool: typeof COMING_SOON_TOOLS[0]; index: number }) {
  const Icon = tool.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative group h-full cursor-not-allowed overflow-hidden rounded-[20px]"
    >
      <div className="relative h-full overflow-hidden rounded-[20px] bg-white border border-black/5 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-[#18E299]/30 shadow-sm">
        <div className="p-8 h-full flex flex-col transition-all duration-300 blur-[2px] opacity-70 group-hover:blur-md group-hover:opacity-30">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex size-12 items-center justify-center rounded-xl bg-black/5 border border-black/10">
              <Icon className="size-6 text-[#666666]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0d0d0d]">{tool.name}</h3>
              <p className="text-[#666666] text-xs font-mono">{tool.tagline}</p>
            </div>
          </div>
          <p className="text-[#666666] text-sm leading-relaxed flex-1">{tool.description}</p>
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#18E299]/10 border border-[#18E299]/20">
              <Lock className="size-5 text-[#0fa76e]" />
            </div>
            <span className="text-lg font-bold text-[#0d0d0d]">Coming Soon</span>
            <span className="text-sm font-medium text-[#0fa76e] flex items-center gap-1 hover:underline cursor-pointer pointer-events-auto">
              Notify Me <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ToolsPage() {
  const { status, expiryDate } = useSubscription()
  const [showExpiryPopup, setShowExpiryPopup] = useState(false)

  // Show expiry popup once when status is determined to be expired
  const [prevStatus, setPrevStatus] = useState<string | null>(null)
  if (status !== prevStatus) {
    setPrevStatus(status)
    if (status === "expired") {
      setShowExpiryPopup(true)
    }
  }

  return (
    <div className="relative min-h-screen bg-white text-[#0d0d0d] font-sans overflow-x-hidden">
      <Navbar />

      {/* Expiry popup */}
      <AnimatePresence>
        {showExpiryPopup && (
          <ExpiryPopup
            expiryDate={expiryDate}
            onClose={() => setShowExpiryPopup(false)}
          />
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LightRays color="rgba(24, 226, 153, 0.4)" count={12} className="opacity-80" />
        <DotPattern className="absolute inset-0 opacity-50 mask-[radial-gradient(500px_circle_at_center,white,transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#18E299]/10 to-transparent blur-3xl" />
      </div>

      <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 lg:px-20">
        {/* Hero */}
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#18E299]/25 bg-[#18E299]/10 mb-8 backdrop-blur-sm"
          >
            <span className="size-1.5 rounded-full bg-[#18E299]" />
            <span className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#0d0d0d]">
              2 Tools Live <span className="text-[#0d0d0d]/40 px-1">•</span> 4 More Coming Soon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-1.28px] leading-[1.1] text-[#0d0d0d] mb-6"
          >
            Your Business Tools,
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#18E299] to-[#0fa76e]">
              All in One Place
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#666666] text-lg max-w-2xl leading-relaxed"
          >
            Manage leads, automate your marketing, and organize your inventory.
            Everything works together seamlessly.
          </motion.p>
        </div>

        {/* Featured Tool Cards */}
        <div className="mb-20 grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {ACTIVE_TOOLS.map((tool) => (
            <FeaturedToolCard key={tool.id} tool={tool} subStatus={status} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-black/5" />
            <span className="text-sm font-mono uppercase tracking-[3px] text-[#666666]">Coming Soon</span>
            <div className="h-px flex-1 bg-black/5" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMING_SOON_TOOLS.map((tool, i) => (
              <ComingSoonCard key={tool.id} tool={tool} index={i} />
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-32 rounded-[28px] overflow-hidden border border-[#18E299]/30 bg-[#18E299]/10 p-10 md:p-14 text-center relative shadow-sm"
        >
          <div className="absolute inset-0 bg-linear-to-br from-[#18E299]/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#0d0d0d] mb-4">
              {status === "active" ? "You're all set! 🎉" : "Ready to get started?"}
            </h2>
            <p className="text-[#666666] text-base max-w-xl mx-auto mb-8">
              {status === "active"
                ? "Your Indian Business Kit subscription is active. Explore all your tools below."
                : "Join thousands of Indian businesses using our tools to grow their operations."}
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
              {status === "active" ? (
                <Link href="https://inventory-management.indianbusinesskit.in" target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full bg-[#0d0d0d] text-white px-8 h-12 text-[15px] font-bold hover:bg-[#0d0d0d]/90 shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                    Launch App <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/pricing">
                  <Button className="rounded-full bg-[#0d0d0d] text-white px-8 h-12 text-[15px] font-bold hover:bg-[#0d0d0d]/90 shadow-[0_4px_14px_rgba(0,0,0,0.1)]">
                    Get Started
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
