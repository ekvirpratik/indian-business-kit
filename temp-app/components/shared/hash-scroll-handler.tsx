"use client"

/**
 * HashScrollHandler
 *
 * When the user arrives at the home page via a link like /#features
 * (e.g. from the Tools page), Next.js router.push("/#features") lands
 * the user at "/" with "#features" in the URL hash.
 * This tiny component reads window.location.hash on mount and smooth-
 * scrolls to the matching section — exactly how SPAs should handle it.
 */
import { useEffect } from "react"

export function HashScrollHandler() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    // Small delay so the page has fully painted before scrolling
    const id = setTimeout(() => {
      // Extract the first actual ID if there are multiple hashes, e.g., #features#features -> features
      const match = hash.match(/^#([^#]+)/)
      const targetId = match ? match[1] : hash.replace("#", "")
      const el = document.getElementById(targetId)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)

    return () => clearTimeout(id)
  }, [])

  return null // renders nothing — behaviour only
}
