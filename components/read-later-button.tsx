"use client"

import { BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useReadLaterShelf } from "@/components/read-later-shelf"

export default function ReadLaterButton({
  className,
  label = "Read later",
}: {
  className?: string
  label?: string
}) {
  const { items, toggleShelf } = useReadLaterShelf()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleShelf}
      className={className}
      data-read-later-trigger
    >
      <BookMarked className="size-4" />
      <span>{label}</span>
      {items.length > 0 && (
        <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
          {items.length}
        </span>
      )}
    </Button>
  )
}
