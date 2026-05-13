"use client"

import { useMemo, useRef } from "react"
import { BookMarked, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { coverPath } from "@/lib/books"
import { useReadLaterShelf } from "@/components/read-later-shelf"

type Props = {
  slug: string
  title: string
  author: string
  initialSaved?: boolean
  size?: "sm" | "lg"
  compact?: boolean
}

export default function ReadLaterBookButton({
  slug,
  title,
  author,
  initialSaved = false,
  size = "sm",
  compact = false,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { addBook, hydrated, isBookSaved, removeBook } = useReadLaterShelf()
  const saved = hydrated ? isBookSaved(slug) : initialSaved

  const book = useMemo(
    () => ({
      slug,
      title,
      author,
      coverPath: coverPath(slug),
    }),
    [author, slug, title],
  )

  function getSource() {
    return (
      buttonRef.current
        ?.closest("[data-book-card]")
        ?.querySelector<HTMLElement>("[data-book-cover]") ??
      document.querySelector<HTMLElement>(`[data-book-cover="${slug}"]`)
    )
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant={compact ? "ghost" : saved ? "secondary" : "outline"}
      size={size}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from read later` : `Save ${title} for later`}
      title={saved ? "Saved" : "Read later"}
      className={
        compact
          ? "border border-white/35 bg-black/70 text-white shadow-lg shadow-black/25 backdrop-blur hover:border-white/60 hover:bg-black/85 hover:text-white"
          : undefined
      }
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (saved) {
          removeBook(slug, getSource())
        } else {
          addBook(book, getSource())
        }
      }}
    >
      {saved ? <Check className="size-4" /> : <BookMarked className="size-4" />}
      {!compact && <span>{saved ? "Saved" : "Read later"}</span>}
    </Button>
  )
}
