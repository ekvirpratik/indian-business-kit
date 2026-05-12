"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"

interface HyperTextProps {
  text: string
  className?: string
  duration?: number
  delay?: number
  as?: React.ElementType
  startOnView?: boolean
  animateOnHover?: boolean
}

export function HyperText({
  text,
  className,
  duration = 800,
  delay = 0,
  as: Component = "span",
  startOnView = false,
  animateOnHover = true,
}: HyperTextProps) {
  const [displayText, setDisplayText] = useState(text.split(""))
  const [isAnimating, setIsAnimating] = useState(false)
  const iterationsRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elementRef = useRef<HTMLElement>(null)

  const startAnimation = () => {
    if (isAnimating) return
    setIsAnimating(true)
    iterationsRef.current = 0

    intervalRef.current = setInterval(() => {
      setDisplayText((prev) =>
        prev.map((char, idx) => {
          if (idx < iterationsRef.current) return text[idx]
          if (char === " ") return " "
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
      )
      iterationsRef.current += 0.5
      if (iterationsRef.current >= text.length) {
        clearInterval(intervalRef.current!)
        setDisplayText(text.split(""))
        setIsAnimating(false)
      }
    }, duration / (text.length * 10))
  }

  useEffect(() => {
    if (!startOnView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(startAnimation, delay)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (elementRef.current) observer.observe(elementRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOnView])

  useEffect(() => {
    if (!startOnView) {
      startAnimation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Component
      ref={elementRef}
      className={cn("cursor-default font-mono", className)}
      onMouseEnter={animateOnHover ? startAnimation : undefined}
    >
      {displayText.map((char, i) => (
        <motion.span
          key={i}
          className={cn(
            char !== text[i] ? "text-[#18E299]" : ""
          )}
        >
          {char}
        </motion.span>
      ))}
    </Component>
  )
}
