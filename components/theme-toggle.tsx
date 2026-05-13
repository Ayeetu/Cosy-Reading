"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // Separate animated state so it updates *after* next-themes'
  // disableTransitionOnChange clears its `transition: none !important`.
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [transitionsReady, setTransitionsReady] = useState(false)

  useEffect(() => {
    if (!resolvedTheme) return

    if (!mounted) {
      let readyId = 0
      const id = requestAnimationFrame(() => {
        setIsDark(resolvedTheme === "dark")
        setMounted(true)
        readyId = requestAnimationFrame(() => setTransitionsReady(true))
      })
      return () => {
        cancelAnimationFrame(id)
        cancelAnimationFrame(readyId)
      }
    }

    const id = setTimeout(() => setIsDark(resolvedTheme === "dark"), 50)
    return () => clearTimeout(id)
  }, [mounted, resolvedTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative block size-4 overflow-hidden" suppressHydrationWarning>
        {!mounted ? (
          <Moon className="absolute inset-0 size-4 opacity-0" />
        ) : null}
        {/* Sun — slides in from below when switching to dark */}
        <Sun
          className="absolute inset-0 size-4"
          style={{
            transform: `translateY(${isDark ? "0" : "100%"})`,
            opacity: mounted && isDark ? 1 : 0,
            transition: transitionsReady ? "transform 300ms ease, opacity 300ms ease" : "none",
          }}
        />
        {/* Moon — slides in from above when switching to light */}
        <Moon
          className="absolute inset-0 size-4"
          style={{
            transform: `translateY(${isDark ? "-100%" : "0"})`,
            opacity: mounted && isDark ? 0 : mounted ? 1 : 0,
            transition: transitionsReady ? "transform 300ms ease, opacity 300ms ease" : "none",
          }}
        />
      </span>
    </Button>
  )
}

