"use client"

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Navbar } from "@/components/shared/navbar"
import { LightRays } from "@/components/ui/light-rays"
import { DotPattern } from "@/components/ui/dot-pattern"
import Link from "next/link"
import {
  ChevronLeft,
  Map,
  Play,
  CheckSquare,
  TrendingUp,
  Wrench,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  ChevronDown,
  Rocket,
  Factory,
  ShoppingBag,
  Briefcase,
  Lightbulb,
  User,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type BusinessKey = "manufacturer" | "retail" | "service" | "startup" | "freelancer"

interface RoadmapItem { level: string; items: string[] }
interface VideoItem   { id: string; title: string; url: string; duration: string; level: string; thumb: string }
interface TaskWeek    { week: string; items: string[] }
interface KpiItem     { name: string; desc: string }
interface ToolItem    { name: string; desc: string }
interface BusinessPlan {
  title: string
  roadmap: RoadmapItem[]
  videos:  VideoItem[]
  tasks:   TaskWeek[]
  kpis:    KpiItem[]
  tools:   ToolItem[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const BUSINESS_OPTIONS: { value: BusinessKey; label: string; icon: React.ElementType }[] = [
  { value: "manufacturer", label: "Manufacturer (B2B)",            icon: Factory    },
  { value: "retail",       label: "Retail Shop (Local Customers)", icon: ShoppingBag },
  { value: "service",      label: "Service Business (Leads)",      icon: Briefcase  },
  { value: "startup",      label: "Startup (Brand Awareness)",     icon: Lightbulb  },
  { value: "freelancer",   label: "Freelancer (Personal Branding)", icon: User      },
]

const businessData: Record<BusinessKey, BusinessPlan> = {
  manufacturer: {
    title: "Manufacturer Marketing Plan (B2B)",
    roadmap: [
      { level: "Beginner",     items: ["Introduction to B2B Marketing", "LinkedIn Profile Setup", "Basic Website Optimization"] },
      { level: "Intermediate", items: ["B2B SEO Strategy", "Content Marketing for Manufacturers", "Google Ads (Search)"] },
      { level: "Advanced",     items: ["Marketing Automation", "CRM Integration", "Advanced Analytics"] },
    ],
    videos: [
      { id: "v1", title: "Learn LinkedIn Marketing (Hindi)", url: "https://www.youtube.com/watch?v=YS2EeeJOhaA", duration: "25 Mins", level: "Beginner",     thumb: "https://img.youtube.com/vi/YS2EeeJOhaA/mqdefault.jpg" },
      { id: "v2", title: "Learn SEO (Hindi)",                url: "https://www.youtube.com/watch?v=83RXYrqRLeM", duration: "30 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/83RXYrqRLeM/mqdefault.jpg" },
      { id: "v3", title: "Learn Google Ads (Hindi)",         url: "https://www.youtube.com/watch?v=6hDNbGIZ8UI", duration: "40 Mins", level: "Advanced",     thumb: "https://img.youtube.com/vi/6hDNbGIZ8UI/mqdefault.jpg" },
    ],
    tasks: [
      { week: "Week 1", items: ["Optimize LinkedIn Company Page", "Create 3 B2B Posts", "Watch LinkedIn Video"] },
      { week: "Week 2", items: ["Keyword Research for Products", "Update Website Meta Tags", "Watch SEO Video"] },
      { week: "Week 3", items: ["Setup Google Ads Account", "Create First B2B Search Campaign", "Watch Google Ads Video"] },
    ],
    kpis:  [{ name: "B2B Leads", desc: "Qualified leads per month" }, { name: "LinkedIn Connections", desc: "Relevant industry contacts" }, { name: "Website Enquiries", desc: "Form submissions" }],
    tools: [{ name: "LinkedIn Sales Navigator", desc: "B2B Lead Generation" }, { name: "Google Keyword Planner", desc: "SEO Keyword Research" }, { name: "HubSpot CRM", desc: "Manage B2B Leads" }],
  },
  retail: {
    title: "Retail Shop Marketing Plan",
    roadmap: [
      { level: "Beginner",     items: ["Google Business Profile Setup", "Local SEO Basics", "WhatsApp Business Setup"] },
      { level: "Intermediate", items: ["Instagram Local Marketing", "Facebook Offers", "Customer Reviews Strategy"] },
      { level: "Advanced",     items: ["Local Inventory Ads", "Loyalty Programs", "POS Integration"] },
    ],
    videos: [
      { id: "v4", title: "Google Business Profile (Hindi)", url: "https://youtu.be/fMe9nRfEhig",                 duration: "20 Mins", level: "Beginner",     thumb: "https://img.youtube.com/vi/fMe9nRfEhig/mqdefault.jpg" },
      { id: "v5", title: "Instagram Marketing (Hindi)",     url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
      { id: "v6", title: "WhatsApp Marketing (Hindi)",      url: "https://www.youtube.com/watch?v=W2HkjKnATXw", duration: "15 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/W2HkjKnATXw/mqdefault.jpg" },
    ],
    tasks: [
      { week: "Week 1", items: ["Create/Verify Google Business Profile", "Upload Store Photos", "Get 5 Initial Reviews"] },
      { week: "Week 2", items: ["Set up Instagram Professional Account", "Post 5 Product Images", "Watch Insta Video"] },
      { week: "Week 3", items: ["Set up WhatsApp Business", "Create Broadcast List", "Send First Offer"] },
    ],
    kpis:  [{ name: "Store Visits", desc: "Footfall from online" }, { name: "Google Reviews", desc: "Rating and count" }, { name: "WhatsApp Enquiries", desc: "Direct messages" }],
    tools: [{ name: "Google My Business", desc: "Local Search Visibility" }, { name: "Canva", desc: "Create Offer Graphics" }, { name: "WhatsApp Business App", desc: "Customer Communication" }],
  },
  service: {
    title: "Service Business Marketing Plan",
    roadmap: [
      { level: "Beginner",     items: ["Website Basics", "Service Pages SEO", "Google My Business"] },
      { level: "Intermediate", items: ["Local Service Ads", "Content Marketing (Blogs)", "Lead Generation Forms"] },
      { level: "Advanced",     items: ["Automated Email Follow-ups", "Retargeting Ads", "Conversion Rate Optimization"] },
    ],
    videos: [
      { id: "v7", title: "SEO Tutorial (Hindi)",  url: "https://www.youtube.com/watch?v=49PWJcjvYKk", duration: "45 Mins", level: "Beginner",     thumb: "https://img.youtube.com/vi/49PWJcjvYKk/mqdefault.jpg" },
      { id: "v8", title: "Google Ads (Hindi)",    url: "https://www.youtube.com/watch?v=6hDNbGIZ8UI", duration: "40 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/6hDNbGIZ8UI/mqdefault.jpg" },
      { id: "v9", title: "Landing Page (Hindi)",  url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Advanced",     thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" },
    ],
    tasks: [
      { week: "Week 1", items: ["Audit Service Website", "Optimize Titles & Descriptions", "Watch SEO Video"] },
      { week: "Week 2", items: ["Create a High-Converting Landing Page", "Add Lead Forms", "Watch Landing Page Video"] },
      { week: "Week 3", items: ["Set up Google Ads Campaign", "Define Negative Keywords", "Launch First Campaign"] },
    ],
    kpis:  [{ name: "Leads Generated", desc: "Form fills & calls" }, { name: "Conversion Rate", desc: "Traffic to lead %" }, { name: "Website Traffic", desc: "Monthly visitors" }],
    tools: [{ name: "WordPress / Wix", desc: "Website CMS" }, { name: "Google Analytics", desc: "Track Website Traffic" }, { name: "Mailchimp", desc: "Email Marketing" }],
  },
  startup: {
    title: "Startup Marketing Plan",
    roadmap: [
      { level: "Beginner",     items: ["Brand Positioning", "Social Media Foundations", "Basic Content Creation"] },
      { level: "Intermediate", items: ["Content Marketing", "Growth Hacking Basics", "Community Building"] },
      { level: "Advanced",     items: ["Influencer Marketing", "PR & Outreach", "Product-Led Growth"] },
    ],
    videos: [
      { id: "v10", title: "Social Media Marketing (Hindi)", url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Beginner",     thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
      { id: "v11", title: "Content Marketing (Hindi)",      url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" },
      { id: "v12", title: "SEO Basics (Hindi)",             url: "https://www.youtube.com/watch?v=83RXYrqRLeM", duration: "30 Mins", level: "Advanced",     thumb: "https://img.youtube.com/vi/83RXYrqRLeM/mqdefault.jpg" },
    ],
    tasks: [
      { week: "Week 1", items: ["Define Target Audience Persona", "Setup Brand Guidelines", "Watch Social Media Video"] },
      { week: "Week 2", items: ["Create 1 Month Content Calendar", "Write First Blog Post", "Watch Content Video"] },
      { week: "Week 3", items: ["Optimize Website for Core Keywords", "Submit to Directories", "Watch SEO Video"] },
    ],
    kpis:  [{ name: "User Acquisition", desc: "New signups" }, { name: "Brand Mentions", desc: "Social listening" }, { name: "CAC", desc: "Customer Acquisition Cost" }],
    tools: [{ name: "Notion", desc: "Planning & Workspace" }, { name: "Buffer / Hootsuite", desc: "Social Media Scheduling" }, { name: "Google Trends", desc: "Market Interest Tracking" }],
  },
  freelancer: {
    title: "Freelancer Marketing Plan",
    roadmap: [
      { level: "Beginner",     items: ["Portfolio Setup", "Personal Branding Basics", "Niche Selection"] },
      { level: "Intermediate", items: ["LinkedIn Networking", "Cold Emailing", "Fiverr/Upwork Optimization"] },
      { level: "Advanced",     items: ["Thought Leadership", "Webinar/Course Creation", "Agency Transition"] },
    ],
    videos: [
      { id: "v13", title: "LinkedIn Profile Optimization", url: "https://www.youtube.com/watch?v=I3exinRuSUE", duration: "25 Mins", level: "Beginner",     thumb: "https://img.youtube.com/vi/I3exinRuSUE/mqdefault.jpg" },
      { id: "v14", title: "Instagram Personal Branding",   url: "https://www.youtube.com/watch?v=tBwjPtzIXxE", duration: "35 Mins", level: "Intermediate", thumb: "https://img.youtube.com/vi/tBwjPtzIXxE/mqdefault.jpg" },
      { id: "v15", title: "Portfolio Website Guide",       url: "https://www.youtube.com/watch?v=T1I4VIv2duU", duration: "30 Mins", level: "Advanced",     thumb: "https://img.youtube.com/vi/T1I4VIv2duU/mqdefault.jpg" },
    ],
    tasks: [
      { week: "Week 1", items: ["Build/Update Portfolio Website", "Gather 3 Client Testimonials", "Watch Portfolio Video"] },
      { week: "Week 2", items: ["Optimize LinkedIn Profile", "Connect with 50 Prospects", "Watch LinkedIn Video"] },
      { week: "Week 3", items: ["Define IG Visual Theme", "Post 3 Value-Driven Reels", "Watch IG Video"] },
    ],
    kpis:  [{ name: "Inbound Leads", desc: "Direct inquiries" }, { name: "Profile Views", desc: "LinkedIn/Portfolio traffic" }, { name: "Closing Rate", desc: "Proposals won" }],
    tools: [{ name: "Webflow / Framer", desc: "Portfolio Builder" }, { name: "Calendly", desc: "Meeting Scheduling" }, { name: "Hunter.io", desc: "Find Email Addresses" }],
  },
}

const PROGRESS_KEY       = "ibk_marketing_guide_progress"
const BUSINESS_KEY_STORE = "ibk_marketing_guide_business"

// ─── Level badge ──────────────────────────────────────────────────────────────
const LEVEL_STYLES: Record<string, string> = {
  beginner:     "bg-emerald-100 text-emerald-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced:     "bg-red-100 text-red-700",
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${LEVEL_STYLES[level.toLowerCase()] ?? "bg-black/5 text-[#666]"}`}>
      {level}
    </span>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-[#18E299]/10 border border-[#18E299]/20">
        <Icon className="size-5 text-[#0fa76e]" />
      </div>
      <h2 className="text-xl font-bold text-[#0d0d0d]">{title}</h2>
    </div>
  )
}

function WelcomePlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-24 items-center justify-center rounded-3xl bg-[#18E299]/10 border border-[#18E299]/20 mb-8"
      >
        <Rocket className="size-12 text-[#0fa76e]" />
      </motion.div>
      <h2 className="text-2xl font-bold text-[#0d0d0d] mb-3">Select Your Business Type</h2>
      <p className="text-[#666666] text-base max-w-xs leading-relaxed">
        Pick your business type from the left panel to generate your free, personalised marketing roadmap.
      </p>
    </motion.div>
  )
}

const subscribe = () => () => {}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MarketingGuidePage() {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )

  const [selectedBusiness, setSelectedBusiness] = useState<BusinessKey | null>(null)
  const [progress, setProgress]                 = useState<Record<string, boolean>>({})
  const [sidebarOpen, setSidebarOpen]           = useState(false)

  useEffect(() => {
    try {
      const saved    = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}") as Record<string, boolean>
      const savedBiz = localStorage.getItem(BUSINESS_KEY_STORE) as BusinessKey | null
      if (saved && Object.keys(saved).length > 0) setProgress(saved)
      if (savedBiz && businessData[savedBiz]) setSelectedBusiness(savedBiz)
    } catch { /* ignore */ }
  }, [])

  const handleSelect = (key: BusinessKey) => {
    setSelectedBusiness(key)
    setSidebarOpen(false)
    try { localStorage.setItem(BUSINESS_KEY_STORE, key) } catch { /* ignore */ }
  }

  const toggleTask = useCallback((taskId: string) => {
    setProgress(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] }
      if (!next[taskId]) delete next[taskId]
      try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const plan = selectedBusiness ? businessData[selectedBusiness] : null

  const totalTasks     = plan ? plan.tasks.reduce((a, w) => a + w.items.length, 0) : 0
  const completedTasks = plan
    ? plan.tasks.reduce((a, w, wi) =>
        a + w.items.filter((_, ti) => progress[`${selectedBusiness}-w${wi}-t${ti}`]).length, 0)
    : 0
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (!isMounted) return null

  return (
    <div className="relative min-h-screen bg-white text-[#0d0d0d] overflow-x-hidden">
      <Navbar />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <LightRays color="rgba(24, 226, 153, 0.3)" count={10} className="opacity-60" />
        <DotPattern className="absolute inset-0 opacity-40 mask-[radial-gradient(600px_circle_at_center,white,transparent)]" />
      </div>

      <div className="relative z-10 flex min-h-screen pt-16">

        {/* ── Mobile overlay ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-white border-r border-black/5 shadow-xl flex flex-col
          transition-transform duration-300
          lg:sticky lg:top-16 lg:translate-x-0 lg:shadow-none lg:flex lg:shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          {/* Header */}
          <div className="p-6 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#18E299]/10 border border-[#18E299]/20">
                <Rocket className="size-5 text-[#0fa76e]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#0fa76e]">Growth Academy</p>
                <h1 className="text-base font-black text-[#0d0d0d] leading-tight">Marketing Guide</h1>
              </div>
            </div>
          </div>

          {/* Business selector */}
          <div className="p-5 border-b border-black/5 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#999] mb-3">Select Business Type</p>
            <div className="space-y-1">
              {BUSINESS_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                    ${selectedBusiness === value
                      ? "bg-[#18E299]/10 border border-[#18E299]/30 text-[#0d0d0d]"
                      : "hover:bg-black/3 text-[#666] border border-transparent"}`}
                >
                  <Icon className={`size-4 shrink-0 ${selectedBusiness === value ? "text-[#0fa76e]" : "text-[#bbb]"}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <AnimatePresence>
            {plan && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-5 border-b border-black/5"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#999]">Weekly Progress</p>
                  <span className="text-sm font-black text-[#0d0d0d]">{progressPct}%</span>
                </div>
                <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#18E299] to-[#0fa76e] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-[#bbb] mt-1.5">{completedTasks} of {totalTasks} tasks done</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back */}
          <div className="p-5 mt-auto">
            <Link href="/tools" className="flex items-center gap-2 text-sm text-[#999] hover:text-[#0d0d0d] transition-colors">
              <ChevronLeft className="size-4" />
              Back to All Tools
            </Link>
          </div>
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-5 md:px-10 py-10">

          {/* Mobile toggle */}
          <div className="lg:hidden mb-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 bg-white shadow-sm text-sm font-semibold text-[#0d0d0d]"
            >
              <ChevronDown className="size-4 text-[#0fa76e]" />
              {selectedBusiness
                ? BUSINESS_OPTIONS.find(o => o.value === selectedBusiness)?.label
                : "Choose Business Type"}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!plan ? (
              <WelcomePlaceholder key="welcome" />
            ) : (
              <motion.div
                key={selectedBusiness}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-10 max-w-4xl"
              >
                {/* Title */}
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18E299]/10 border border-[#18E299]/20 text-[10px] font-bold uppercase tracking-widest text-[#0fa76e] mb-3">
                    <span className="size-1.5 rounded-full bg-[#18E299] animate-pulse" />
                    Free · No Login Required
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0d0d0d] tracking-tight">{plan.title}</h1>
                </div>

                {/* 1. Roadmap */}
                <section>
                  <SectionHeader icon={Map} title="Learning Roadmap" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    {plan.roadmap.map((rm, i) => (
                      <motion.div
                        key={rm.level}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <LevelBadge level={rm.level} />
                        <h3 className="text-sm font-bold text-[#0d0d0d] mt-3 mb-3">{rm.level} Milestones</h3>
                        <ul className="space-y-2">
                          {rm.items.map(item => (
                            <li key={item} className="flex items-start gap-2 text-sm text-[#666]">
                              <span className="mt-1.5 size-1.5 rounded-full bg-[#18E299] shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* 2. Videos */}
                <section>
                  <SectionHeader icon={Play} title="Learning Center" />
                  <div className="grid sm:grid-cols-3 gap-5">
                    {plan.videos.map((v, i) => (
                      <motion.a
                        key={v.id}
                        href={v.url} target="_blank" rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="group rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                      >
                        <div className="relative w-full aspect-video overflow-hidden bg-black/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.thumb} alt={v.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                            <div className="flex size-12 items-center justify-center rounded-full bg-white/90 shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="size-5 text-red-600 fill-red-600" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <LevelBadge level={v.level} />
                            <span className="flex items-center gap-1 text-[11px] text-[#bbb]">
                              <Clock className="size-3" /> {v.duration}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#0d0d0d] leading-snug mb-2">{v.title}</p>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0fa76e] group-hover:underline">
                            Watch on YouTube <ExternalLink className="size-3" />
                          </span>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </section>

                {/* 3. Weekly Tasks */}
                <section>
                  <SectionHeader icon={CheckSquare} title="Weekly Action Plan" />
                  <div className="space-y-4">
                    {plan.tasks.map((week, wIdx) => (
                      <motion.div
                        key={week.week}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: wIdx * 0.1 }}
                        className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
                      >
                        <h3 className="text-sm font-black text-[#0d0d0d] mb-4 pb-3 border-b border-black/5">
                          {week.week} Implementation
                        </h3>
                        <div className="space-y-3">
                          {week.items.map((item, tIdx) => {
                            const taskId  = `${selectedBusiness}-w${wIdx}-t${tIdx}`
                            const checked = !!progress[taskId]
                            return (
                              <button
                                key={taskId}
                                type="button"
                                onClick={() => toggleTask(taskId)}
                                className="w-full flex items-center gap-3 text-left group"
                              >
                                <div className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all
                                  ${checked ? "bg-[#18E299] border-[#18E299]" : "border-black/20 group-hover:border-[#18E299]/60"}`}>
                                  {checked && <CheckCircle2 className="size-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className={`text-sm transition-colors ${checked ? "line-through text-[#ccc]" : "text-[#333] group-hover:text-[#0d0d0d]"}`}>
                                  {item}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* 4. KPIs */}
                <section>
                  <SectionHeader icon={TrendingUp} title="Marketing Success Metrics (KPIs)" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    {plan.kpis.map((kpi, i) => (
                      <motion.div
                        key={kpi.name}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#18E299]/10 border border-[#18E299]/20">
                          <TrendingUp className="size-5 text-[#0fa76e]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d0d0d]">{kpi.name}</p>
                          <p className="text-xs text-[#999] mt-0.5">{kpi.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* 5. Tools */}
                <section>
                  <SectionHeader icon={Wrench} title="Recommended Tools" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    {plan.tools.map((tool, i) => (
                      <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#18E299]/10 border border-[#18E299]/20">
                          <Wrench className="size-5 text-[#0fa76e]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0d0d0d]">{tool.name}</p>
                          <p className="text-xs text-[#999] mt-0.5">{tool.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* PDF hint */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#18E299]/20 bg-[#18E299]/5 px-5 py-4 text-sm text-[#666]">
                  <Download className="size-4 text-[#0fa76e] shrink-0" />
                  <span>
                    Want a PDF copy? Use <strong className="text-[#0d0d0d]">Print → Save as PDF</strong> in your browser.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
