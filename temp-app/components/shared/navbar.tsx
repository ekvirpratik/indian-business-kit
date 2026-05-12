"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Text3DFlip from "@/components/ui/text-3d-flip"
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs"

/* ───────────────────────────────────────────────────────────────
   Nav link config — Tools is LAST, anchor links for landing page
──────────────────────────────────────────────────────────────── */
const navLinks = [
  { label: "Features", href: "#features",  isAnchor: true  },
  { label: "Pricing",  href: "/pricing",   isAnchor: false },
  { label: "Contact",  href: "#contact",   isAnchor: true  },
  { label: "Tools",    href: "/tools",     isAnchor: false },
]

/* ───────────────────────────────────────────────────────────────
   Smooth-scroll helper — scrolls to a section on the landing page.
   If we are NOT on the home page we navigate to /#hash first.
──────────────────────────────────────────────────────────────── */
function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const isHome   = pathname === "/"

  function handleAnchorClick(e: React.MouseEvent, href: string) {
    e.preventDefault()
    const id = href.replace("#", "")

    if (isHome) {
      // Already on home — just smooth scroll without changing URL
      smoothScrollTo(id)
    } else {
      // Navigate home then scroll after the page loads
      router.push(`/${href}`)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-4 md:px-12 lg:px-24 bg-white/70 backdrop-blur-md border-b border-black/5">
      {/* Logo + Brand */}
      <Link href="/" className="flex items-center gap-2">
        <div className="relative flex size-12 md:size-14 items-center justify-center shrink-0">
          <Image
            src="/logo.png"
            alt="Indian Business Kit Logo"
            fill
            className="object-contain scale-125 md:scale-150"
            priority
            loading="eager"
            sizes="(max-width: 768px) 48px, 56px"
          />
        </div>
        <Text3DFlip
          className="text-xl md:text-2xl font-semibold tracking-tight"
          textClassName="text-[#0d0d0d]"
          flipTextClassName="text-[#0d0d0d]"
          rotateDirection="top"
          staggerDuration={0.03}
          staggerFrom="first"
          transition={{ type: "spring", damping: 25, stiffness: 160 }}
        >
          Indian Business Kit
        </Text3DFlip>
      </Link>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map(({ label, href, isAnchor }) => {
          const isActive = label === "Tools" ? pathname === "/tools" : false

          if (isAnchor) {
            return (
              // Anchor link — CSS-only hover, no Framer Motion overhead in fixed navbar
              <a
                key={label}
                href={href}
                onClick={(e) => handleAnchorClick(e, href)}
                className="group relative text-xl font-medium overflow-hidden cursor-pointer"
              >
                <span className="block text-[#0d0d0d] transition-transform duration-200 ease-out group-hover:-translate-y-full">
                  {label}
                </span>
                <span className="absolute inset-0 flex items-center text-[#18E299] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0">
                  {label}
                </span>
              </a>
            )
          }

          // Route link (Pricing, Tools) — CSS-only hover
          return (
            <Link key={label} href={href} className="group relative text-xl font-medium overflow-hidden">
              <span className={`block transition-transform duration-200 ease-out group-hover:-translate-y-full ${isActive ? "text-[#18E299]" : "text-[#0d0d0d]"}`}>
                {label}
              </span>
              <span className="absolute inset-0 flex items-center text-[#18E299] translate-y-full transition-transform duration-200 ease-out group-hover:translate-y-0">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Auth Buttons */}
      <div className="flex items-center gap-4">
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              className="hidden md:flex text-base font-medium hover:bg-transparent hover:text-[#18E299]"
            >
              Log in
            </Button>
          </SignInButton>
          <Link href="/pricing">
            <Button className="rounded-full bg-[#0d0d0d] px-6 text-base font-medium text-white hover:opacity-90">
              Get Started
            </Button>
          </Link>
        </Show>
        <Show when="signed-in">
          <UserButton appearance={{ elements: { userButtonAvatarBox: "size-10" } }} />
        </Show>
      </div>
    </header>
  )
}
