"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Separate animated state so it updates *after* next-themes'
  // disableTransitionOnChange clears its `transition: none !important`.
  const [isDark, setIsDark] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
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
      <span className="relative block size-4 overflow-hidden">
        {/* Sun — slides in from below when switching to dark */}
        <Sun
          className="absolute inset-0 size-4"
          style={{
            transform: `translateY(${isDark ? "0" : "100%"})`,
            opacity: isDark ? 1 : 0,
            transition: "transform 300ms ease, opacity 300ms ease",
          }}
        />
        {/* Moon — slides in from above when switching to light */}
        <Moon
          className="absolute inset-0 size-4"
          style={{
            transform: `translateY(${isDark ? "-100%" : "0"})`,
            opacity: isDark ? 0 : 1,
            transition: "transform 300ms ease, opacity 300ms ease",
          }}
        />
      </span>
    </Button>
  )
}

