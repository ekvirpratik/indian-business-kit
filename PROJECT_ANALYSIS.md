# PROJECT ANALYSIS — Indian Business Kit (IBK)

> **Purpose:** This document is a complete, self-contained reference for any AI model or developer to fully understand the project without exploring the codebase. Read this once and you know everything.

---

## 1. Repository Overview

```
e:/InterShip_projects/landing-page/
├── temp-app/                        ← Next.js 16 Marketing/Landing site (PRIMARY)
└── white-label-business-manger0/   ← React 19 + Vite SaaS Dashboard app
```

**Product:** "Indian Business Kit" — an all-in-one SaaS platform for Indian small businesses. Combines GST billing, CRM, AI marketing, WhatsApp automation, analytics, and digital guidance.

**Business model:** ₹239/month (launch offer; normally ₹299). Yearly billing at ₹2,868. Referral program: friends get ₹500 off.

**Target audience:** Indian SMBs — shop owners, freelancers, agencies, small manufacturers, education, retail.

---

## 2. `temp-app/` — Next.js Landing Page

### 2.1 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.4 |
| Styling | Tailwind CSS v4 + PostCSS | ^4 |
| Component Library | shadcn/ui (radix-nova style) + Radix UI | radix-ui ^1.4.3 |
| Animation | motion (Framer Motion v12) | ^12.38.0 |
| Smooth Scroll | Lenis | ^1.3.23 |
| Auth | Clerk for Next.js | ^7.2.7 |
| Icons | Lucide React | ^1.9.0 |
| Theming | next-themes | ^0.4.6 |
| Utilities | clsx, tailwind-merge, CVA | latest |
| Animations CSS | tw-animate-css | ^1.4.0 |
| Registry | Skiper-UI (custom components) | via components.json |

### 2.2 Project Structure

```
temp-app/
├── app/
│   ├── layout.tsx          ← Root layout: ClerkProvider + Geist fonts + SmoothScrolling
│   ├── page.tsx            ← Home/landing page (server component)
│   ├── globals.css         ← Tailwind v4 + shadcn tokens + custom CSS vars (OKLCH)
│   └── tools/
│       └── page.tsx        ← /tools route (client component) — tool showcase
├── components/
│   ├── shared/
│   │   ├── navbar.tsx              ← Sticky navbar (client) with Clerk auth + smooth scroll
│   │   └── hash-scroll-handler.tsx ← Hash-based scroll on landing from other pages
│   ├── smooth-scrolling.tsx        ← Lenis wrapper (ReactLenis root)
│   └── ui/
│       ├── button.tsx         ← shadcn Button with CVA variants
│       ├── dot-pattern.tsx    ← Animated SVG dot grid background
│       ├── hyper-text.tsx     ← Glitch/scramble text animation
│       ├── light-rays.tsx     ← Animated light ray background (SVG/motion)
│       ├── magic-card.tsx     ← Mouse-tracking gradient/orb card effect
│       ├── marquee.tsx        ← Infinite horizontal/vertical scrolling ticker
│       └── text-3d-flip.tsx   ← Per-character 3D flip hover animation
├── lib/
│   └── utils.ts            ← cn() helper (clsx + twMerge)
├── public/
│   ├── logo.png            ← Brand logo (used in navbar + footer)
│   ├── favicon.ico / favicon.png
│   └── *.svg               ← Next.js default SVGs
├── middleware.ts           ← Clerk auth middleware (protects all routes)
├── next.config.ts          ← Empty/minimal Next.js config
├── components.json         ← shadcn config: radix-nova style, Lucide icons, @skiper-ui registry
├── DESIGN.md               ← Full design system spec (Mintlify-inspired) — READ THIS
├── AGENTS.md               ← AI agent note: this is Next.js 16, may differ from training data
└── CLAUDE.md               ← AI agent hints
```

### 2.3 Routes

| Route | File | Type | Description |
|-------|------|------|-------------|
| `/` | `app/page.tsx` | Server Component | Landing page — hero, marquee, features, pricing, footer |
| `/tools` | `app/tools/page.tsx` | Client Component (`"use client"`) | Tools showcase with animated cards |

### 2.4 Key Configuration

**`app/layout.tsx`** (Root Layout):
- Wraps everything in `<ClerkProvider>` with dark theme + green brand (#18E299) primary color
- Loads `Geist` + `Geist_Mono` fonts from Google (exposed as `--font-geist-sans`, `--font-geist-mono`)
- Custom Clerk localization: "Sign in to IBM" / "Create your IBM account"
- Applies `<SmoothScrolling>` (Lenis) around children
- Body: `min-h-full flex flex-col`

**`middleware.ts`**:
- `clerkMiddleware()` — runs on all routes except static files
- Matcher skips: `_next`, images, css, js, fonts, etc.

**`components.json`** (shadcn config):
- Style: `radix-nova`
- Path aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`
- Icon library: lucide
- Custom registry: `@skiper-ui` → `https://skiper-ui.com/registry/{name}.json`

**`app/globals.css`**:
- `@import "tailwindcss"` (v4 syntax)
- `@import "tw-animate-css"` (animation utilities)
- `@import "shadcn/tailwind.css"` (shadcn tokens)
- OKLCH-based design tokens (light + dark)
- Custom marquee keyframes via `@theme inline`
- Scrollbar hidden globally (Chrome, Firefox, Edge)

### 2.5 Design System (Mintlify-Inspired) — Full Reference

**Color Palette:**

| Token | Value | Usage |
|-------|-------|-------|
| Brand Green | `#18E299` | CTAs, hover, focus rings, accents |
| Brand Green Light | `#d4fae8` | Badge backgrounds, tinted surfaces |
| Brand Green Deep | `#0fa76e` | Text on light-green badges |
| Near Black | `#0d0d0d` | Primary text, headings, dark CTA bg |
| Pure White | `#ffffff` | Page bg, cards, inputs |
| Gray 700 | `#333333` | Body text, descriptions |
| Gray 500 | `#666666` | Tertiary/muted text |
| Gray 400 | `#888888` | Placeholder, disabled |
| Gray 200 | `#e5e5e5` | Borders, dividers |
| Border Subtle | `rgba(0,0,0,0.05)` | Primary card borders |
| Border Medium | `rgba(0,0,0,0.08)` | Interactive borders |
| Card Shadow | `rgba(0,0,0,0.03) 0 2px 4px` | Subtle card lift |

**Dark Mode Inversions:**
- Background: `#0d0d0d` → Foreground: `#ededed`
- Card: `#141414` → Border: `rgba(255,255,255,0.08)`
- Brand green unchanged: `#18E299`

**Typography:**

| Role | Font | Size | Weight | Letter-spacing |
|------|------|------|--------|----------------|
| Display Hero | Inter | 64px | 600 | -1.28px |
| Section Heading | Inter | 40px | 600 | -0.8px |
| Sub-heading | Inter | 24px | 500 | -0.24px |
| Card Title | Inter | 20px | 600 | -0.2px |
| Body Large | Inter | 18px | 400 | normal |
| Body | Inter | 16px | 400 | normal |
| Button | Inter | 15px | 500 | normal |
| Label Uppercase | Inter | 13px | 500 | +0.65px |
| Mono Code | Geist Mono | 12px | 500 | +0.6px (uppercase) |

**Border Radius Scale:**
- 4px — tooltips, small tags
- 8px — nav buttons
- 16px — standard cards
- 24px — featured cards
- 9999px — buttons, inputs, badges (signature pill shape)

**CSS Variables (OKLCH in globals.css):**
- `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- `--radius: 0.625rem` (base)
- Radius scale: `--radius-sm` through `--radius-4xl`
- Marquee animations: `--animate-marquee`, `--animate-marquee-vertical`
- Charts: `--chart-1` through `--chart-5`
- Sidebar tokens: `--sidebar*` family

### 2.6 Component Inventory

#### `components/ui/button.tsx`
- Built with CVA (class-variance-authority) + `Slot.Root` from `radix-ui`
- **Variants:** `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`
- **Sizes:** `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`
- Usage: `<Button variant="outline" className="rounded-full ...">Label</Button>`
- Note: Default variant uses `--primary` token (near-black). Override via className for brand-green CTAs.

#### `components/ui/magic-card.tsx`
- Mouse-tracking card with two modes:
  - `mode="gradient"` — radial gradient follows cursor (default)
  - `mode="orb"` — spring-animated glowing orb follows cursor
- Key props: `glowFrom`, `glowTo`, `glowSize`, `glowOpacity`, `glowBlur`, `glowAngle`
- Uses `motion/react` spring values + `next-themes` for dark/light blend modes
- Usage in tools page: `<MagicCard mode="orb" glowFrom="#18E299" glowTo="#0d8a5b" glowOpacity={0.6} glowSize={350}>`

#### `components/ui/hyper-text.tsx`
- Scrambles text with random chars then reveals real text character by character
- Props: `text`, `duration` (ms), `delay`, `startOnView` (IntersectionObserver), `animateOnHover`, `as` (element tag)
- Scrambled chars render in `#18E299` color
- Usage: `<HyperText text="GST Billing" duration={600} startOnView animateOnHover />`

#### `components/ui/text-3d-flip.tsx`
- Per-character 3D flip animation on hover using `motion/react`'s `useAnimate`
- Two faces per character: front face (textClassName) + flip face (flipTextClassName)
- Props: `rotateDirection` (`top`|`right`|`bottom`|`left`), `staggerDuration`, `staggerFrom`, `transition`
- Usage: `<Text3DFlip textClassName="text-[#0d0d0d]" flipTextClassName="text-[#18E299]" rotateDirection="top">Indian Business Kit</Text3DFlip>`

#### `components/ui/marquee.tsx`
- Infinite CSS marquee using `--animate-marquee` keyframe (from globals.css)
- Props: `reverse`, `pauseOnHover`, `vertical`, `repeat` (default 4)
- CSS vars: `--duration`, `--gap`
- Usage: `<Marquee pauseOnHover className="[--duration:40s]">...items...</Marquee>`

#### `components/ui/dot-pattern.tsx`
- SVG grid of dots with optional `glow` animation via motion
- Props: `width`/`height` (spacing), `cr` (radius), `glow`, `className`
- Uses IntersectionObserver + ResizeObserver to auto-fill container
- Usage: `<DotPattern className="opacity-50 mask-[radial-gradient(...)]" />`

#### `components/ui/light-rays.tsx`
- Animated light rays from top-center using motion
- Props: `count`, `color` (rgba), `blur`, `speed`, `length`
- Usage: `<LightRays color="rgba(24, 226, 153, 0.4)" count={12} className="opacity-80" />`

#### `components/shared/navbar.tsx` (Client Component)
- Sticky header: `fixed top-0 z-50`, white/70 backdrop blur, bottom border
- Logo: `/logo.png` (Next Image) + Text3DFlip brand name
- Nav links: Features → `#features`, Pricing → `#pricing`, Contact → `#contact` (anchors), Tools → `/tools` (route)
- Anchor links use `smoothScrollTo()` — if not on home, does `router.push("/#hash")`
- Auth: `<Show when="signed-out">` → SignIn + SignUp buttons; `<Show when="signed-in">` → UserButton
- CTA: dark pill `rounded-full bg-[#0d0d0d]` "Get Started" → SignUpButton modal

#### `components/shared/hash-scroll-handler.tsx` (Client Component)
- Reads `window.location.hash` on mount, scrolls to matching element after 120ms delay
- Returns null (behaviour only, no UI)
- Used on home page to handle `router.push("/#features")` from other pages

#### `components/smooth-scrolling.tsx` (Client Component)
- Wraps app in `<ReactLenis root>` with options: `lerp: 0.1`, `duration: 1.5`, `smoothWheel: true`

#### `lib/utils.ts`
- `cn(...inputs: ClassValue[]): string` — merges clsx + tailwind-merge

### 2.7 Landing Page Sections (`app/page.tsx`)

1. **Background** (absolute): `<LightRays>` (green tinted) + `<DotPattern>` (radial gradient mask)
2. **HashScrollHandler** (invisible)
3. **Navbar** (shared)
4. **Hero** (`min-h-[85vh]`): Glass pill badge → H1 → subtitle → CTA buttons (brand green + outline pill)
5. **Trusted By** (`#trustedby`): Marquee with Lucide icons + business type labels
6. **Features/Problem-Solution** (`id="features"`): 2-col grid — "Jugaad Way" (red X) vs "Indian Business Kit" (green check)
7. **Pricing** (`id="pricing"`): 5-col grid — dark card (₹239 plan + feature list) + referral card
8. **Footer** (`id="contact"`): Dark bg (#0d0d0d), 4-col grid links (Product, Resources, Legal), social links

### 2.8 Tools Page (`app/tools/page.tsx`) — Client Component

**Data (`tools` array — 6 tools):**

| Tool | Color | Status |
|------|-------|--------|
| GST Billing | `#18E299` (green) | Live |
| CRM & Lead Manager | `#a78bfa` (purple) | Live |
| AI Marketing | `#f59e0b` (amber) | Beta |
| Business Analytics | `#38bdf8` (blue) | Live |
| WhatsApp Suite | `#4ade80` (light green) | Live |
| Digital Guidance | `#fb7185` (pink) | Coming Soon |

**Sub-components:**
- `FloatingParticle` — absolute positioned animated rising dots (18 total, 4 colors)
- `Counter` — animated number counter using `useMotionValue` + `useTransform`
- `MorphOrb` — two morphing radial gradient blobs (background hero decoration)
- `StatCard` — stat display: 5000+ Businesses, 6 Tools, 99% Uptime
- `ToolCard` — uses `MagicCard mode="orb"` + `HyperText` for tool name, hover wobble on icon, feature chips, status badge, "Get Started" button

**Page sections:**
1. Sticky dark header (`bg-[#060606]/80`) with logo + nav + CTA
2. Hero: animated label → gradient headline → subtitle → Stats row → scroll cue
3. Tools grid: `grid sm:grid-cols-2 lg:grid-cols-3 gap-5` → 6 ToolCards
4. CTA Banner: rounded-[28px] green-tinted panel with "Start Free — 14 Days"
5. Minimal dark footer

---

## 3. `white-label-business-manger0/` — React Dashboard App

### 3.1 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Vite 7 | ^7.1.5 |
| Language | TypeScript (types only) | via @types/* |
| Runtime | React | ^19.2.4 |
| Styling | Tailwind CSS v4 | ^4.2.1 |
| DB/Backend | Supabase | ^2.100.0 |
| Auth | Clerk (React, not Next.js) | ^6.1.3 |
| Charts | Chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 |
| PDF | jsPDF | ^4.2.0 |
| Icons | Lucide React | ^0.577.0 |
| Utilities | clsx, tailwind-merge | latest |

### 3.2 Project Structure

```
white-label-business-manger0/
├── src/
│   ├── main.jsx               ← Entry: ClerkProvider + DataProvider + App
│   ├── App.jsx                ← Routing: LandingPage | SetupWizard | DashboardLayout
│   ├── index.css              ← Global styles
│   ├── components/
│   │   ├── LandingPage.jsx    ← Shown to signed-out users
│   │   ├── DashboardLayout.jsx ← Main shell after setup
│   │   ├── SetupWizard.jsx    ← Onboarding flow (runs once)
│   │   ├── Customers.jsx      ← CRM/customers module
│   │   ├── Inventory.jsx      ← Inventory management
│   │   ├── InvoiceGenerator.jsx ← GST invoice creation + PDF
│   │   └── Reports.jsx        ← Analytics/charts
│   ├── context/
│   │   └── DataContext.jsx    ← Global React Context (all app state)
│   └── lib/
│       ├── supabaseClient.js  ← Supabase client init
│       └── pdfUtils.js        ← jsPDF helpers for invoice generation
├── legacy/                    ← Vanilla JS prototype (reference only, not used in prod)
│   ├── index.html             ← Full vanilla HTML/JS app
│   ├── app.js                 ← App logic
│   ├── components.js          ← UI component renders
│   ├── data.js                ← Mock data
│   └── utils.js               ← Utility functions
├── index.html                 ← Vite entry HTML
├── package.json
└── vite.config.js             ← @vitejs/plugin-react + @tailwindcss/vite
```

### 3.3 App Routing Logic (`App.jsx`)

```
User visits app
├── signed-out  → <LandingPage />
└── signed-in
    ├── setupComplete === false → <SetupWizard onComplete={updateBusinessInfo} />
    └── setupComplete === true  → <DashboardLayout />
```

No React Router — routing is purely conditional rendering via Clerk's `<Show>` component + `store.businessInfo.setupComplete`.

### 3.4 State Management (`DataContext.jsx`)

- Uses React Context + `useReducer` or `useState`
- Exposed via `useData()` hook
- `store.businessInfo` — business details (name, GST, etc.) + `setupComplete: boolean`
- `updateBusinessInfo(data)` — updates business info (called by SetupWizard on completion)
- Additional store slices likely include customers, inventory, invoices

### 3.5 Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...   ← REQUIRED — Clerk publishable key
```
App throws error on startup if missing.

### 3.6 Features

| Module | Description |
|--------|-------------|
| LandingPage | Marketing page for signed-out users |
| SetupWizard | One-time onboarding: business name, GST, etc. |
| DashboardLayout | Main shell with sidebar navigation |
| Customers | CRM — customer list, add/edit/view |
| Inventory | Product/stock management |
| InvoiceGenerator | GST-compliant invoice creation, PDF export via jsPDF |
| Reports | Charts via Chart.js/react-chartjs-2 |

---

## 4. Shared Conventions & Patterns

### 4.1 Styling Conventions

| Pattern | Implementation |
|---------|---------------|
| Class merging | `cn()` from `lib/utils.ts` — `clsx + twMerge` |
| Design tokens | CSS variables in `globals.css` (OKLCH) |
| Component variants | CVA (`class-variance-authority`) for Button |
| Dark mode | `dark:` Tailwind variant; `.dark` class on `<html>` |
| Tailwind v4 | `@import "tailwindcss"` (NOT `@tailwind` directives) |
| Custom utilities | `@utility` directive (NOT `@apply` with regular classes) |
| Theme tokens | `@theme inline { }` block in CSS |

### 4.2 Animation Conventions

| Library | Usage |
|---------|-------|
| `motion/react` | All animations — `motion.div`, `useMotionValue`, `useSpring`, `useTransform`, `useAnimate`, `animate()` |
| Lenis | Smooth scrolling wrapper (temp-app only) |
| Tailwind animations | `tw-animate-css` + custom marquee keyframes |

### 4.3 Auth Conventions (Clerk)

- **temp-app**: `@clerk/nextjs` — `ClerkProvider`, `SignInButton`, `SignUpButton`, `UserButton`, `Show`, `clerkMiddleware`
- **dashboard**: `@clerk/react` — `ClerkProvider`, `Show`, `UserButton`, `useClerk`
- Both use `mode="modal"` for sign-in/sign-up
- Clerk dark theme with `colorPrimary: "#18E299"` (temp-app)

### 4.4 Image Conventions (temp-app)

- `next/image` for `/public` folder images (logo.png, etc.)
- Standard `<img>` for external URLs
- Logo: `/logo.png` (used in navbar + footer + tools page)
- Sizes always specified for responsive images

### 4.5 TypeScript Path Aliases (temp-app)

```
@/components  → temp-app/components/
@/lib         → temp-app/lib/
@/components/ui → temp-app/components/ui/
@/hooks       → temp-app/hooks/
```

### 4.6 File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `magic-card.tsx`, `hash-scroll-handler.tsx`)
- Exports: named exports preferred (`export function Navbar`) except `text-3d-flip.tsx` (default export)
- Client components: `"use client"` directive at top

---

## 5. Environment & Dev Setup

### temp-app Commands
```bash
cd temp-app
npm install
npm run dev       # next dev (localhost:3000)
npm run build     # next build
npm run start     # next start
npm run lint      # eslint
```

**Required env vars (temp-app):**
```env
# temp-app/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### Dashboard Commands
```bash
cd white-label-business-manger0
npm install
npm run dev       # vite (localhost:5173)
npm run build     # vite build
npm run preview   # vite preview
```

**Required env vars (dashboard):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

---

## 6. Design System Quick-Reference for Code Generation

### Button Patterns Used in Codebase

```tsx
// Primary brand CTA (green pill)
<Button className="rounded-full bg-[#18E299] text-[#0d0d0d] px-8 h-12 text-[15px] font-medium hover:bg-[#15c586]">

// Dark pill CTA
<Button className="rounded-full bg-[#0d0d0d] text-white px-6 font-medium hover:opacity-90">

// Ghost outline pill
<Button variant="outline" className="rounded-full border-black/8 px-8 h-12 bg-white hover:bg-black/4 text-[#0d0d0d]">

// Ghost nav
<Button variant="ghost" className="hover:bg-transparent hover:text-[#18E299]">
```

### Card Patterns Used in Codebase

```tsx
// Standard light card
<div className="rounded-[24px] border border-black/5 bg-white p-8 shadow-sm">

// Dark card (tools page)
<div className="bg-[#0d0d0d] rounded-[20px] p-6 border border-white/5">

// Featured (green border) card
<div className="rounded-[24px] border-2 border-[#18E299] bg-white p-8 shadow-[0_8px_24px_rgba(24,226,153,0.12)]">
```

### Status Badge Pattern (tools page)

```tsx
<span style={{
  background: tool.status === "Live" ? "#18E29920" : tool.status === "Beta" ? "#f59e0b20" : "#ffffff10",
  color: tool.status === "Live" ? "#18E299" : tool.status === "Beta" ? "#f59e0b" : "#ffffff60",
  border: `1px solid ${tool.status === "Live" ? "#18E29940" : ...}`,
}} className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
```

### Navbar Pattern
- `fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 md:px-12 lg:px-24`
- `bg-white/70 backdrop-blur-md border-b border-black/5`

### Section Spacing Pattern
- Light sections: `py-24 px-6`
- Hero: `pt-48 md:pt-56 px-6 pb-32`
- Max content width: `max-w-5xl mx-auto` (landing), `max-w-7xl mx-auto` (tools)

---

## 7. Key Relationships & Data Flow

```
User opens temp-app (Next.js)
│
├── / (landing)
│   ├── Navbar [Clerk auth state → SignIn/SignUp or UserButton]
│   ├── Hero → CTA → SignUpButton (modal)
│   └── Pricing → SignUpButton (modal)
│
└── /tools
    └── Static tool showcase (no auth gate, but CTA links to sign up)

User signs up → Redirected to Dashboard app (white-label-business-manger0)
│
├── signed-out → LandingPage
└── signed-in
    ├── First time → SetupWizard → updateBusinessInfo({..., setupComplete: true})
    └── Returning → DashboardLayout
        ├── Customers (CRM)
        ├── Inventory
        ├── InvoiceGenerator (GST PDF via jsPDF)
        └── Reports (Chart.js)
```

---

## 8. Important Files for Each Common Task

| Task | Files to Read/Edit |
|------|--------------------|
| Change landing page content | `temp-app/app/page.tsx` |
| Change tools showcase | `temp-app/app/tools/page.tsx` |
| Update navbar | `temp-app/components/shared/navbar.tsx` |
| Update design tokens | `temp-app/app/globals.css` |
| Add new UI component | `temp-app/components/ui/` |
| Modify auth config | `temp-app/app/layout.tsx` (ClerkProvider) |
| Add new route | Create `temp-app/app/[route]/page.tsx` |
| Change smooth scroll config | `temp-app/components/smooth-scrolling.tsx` |
| Dashboard features | `white-label-business-manger0/src/components/` |
| Dashboard state | `white-label-business-manger0/src/context/DataContext.jsx` |
| Invoice PDF logic | `white-label-business-manger0/src/lib/pdfUtils.js` |
| DB queries | `white-label-business-manger0/src/lib/supabaseClient.js` |
| Design system reference | `temp-app/DESIGN.md` |

---

## 9. Known Issues / Notes

1. **`globals.css` minor bug:** A `}` is missing — `.element::-webkit-scrollbar { display: none; }` is accidentally nested inside the `body` rule. Functionally harmless but technically invalid CSS.
2. **`temp-app` and dashboard are separate apps** — they do NOT share code, state, or a backend. They're two separate npm projects in the same monorepo.
3. **No inter-app navigation** — the landing page CTAs (SignUpButton) open Clerk modal on the same domain. After sign-up, the user would need to manually navigate to the dashboard app (different localhost port or deployment URL).
4. **`legacy/`** folder in dashboard is a vanilla JS prototype — **not used in production**. Reference only.
5. **`white-label-business-manger0` is a typo** for "white-label-business-manager0" — do not rename.
6. **Clerk version difference:** temp-app uses `@clerk/nextjs ^7`, dashboard uses `@clerk/react ^6` — different package APIs.
7. **No TypeScript in dashboard** — `src/` files are `.jsx`, not `.tsx`. Types only via `@types/*` devDependencies.
8. **No shared component library** — each app has its own UI components. Button in temp-app is shadcn/CVA; dashboard uses raw Tailwind.

---

*Last updated: 2026-04-28 | Generated by Kombai AI*
