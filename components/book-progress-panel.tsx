"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function normalizeProgress(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value > 1 ? value : value * 100)))
}

export default function BookProgressPanel({
  slug,
  initialProgress,
}: {
  slug: string
  initialProgress: number
}) {
  const [localProgress, setLocalProgress] = useState(initialProgress)
  const progress = Math.max(initialProgress, localProgress)
  const showProgress = progress > 0

  useEffect(() => {
    let frame = 0

    try {
      const raw = localStorage.getItem(`cosy-reader-pos-${slug}`)
      if (!raw) return undefined

      const localPos = JSON.parse(raw) as { percentage?: number }
      const nextProgress = normalizeProgress(localPos.percentage)
      if (nextProgress > initialProgress) {
        frame = requestAnimationFrame(() => setLocalProgress(nextProgress))
      }
    } catch {}

    return () => cancelAnimationFrame(frame)
  }, [initialProgress, slug])

  return (
    <>
      {showProgress && (
        <div className="max-w-sm rounded-md border border-border bg-muted/30 p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Reading progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <Button asChild size="lg">
        <Link href={`/books/${slug}/read`}>
          {showProgress ? "Continue Reading" : "Start Reading"}
        </Link>
      </Button>
    </>
  )
}
