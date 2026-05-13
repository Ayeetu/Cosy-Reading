"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { type Book, coverPath } from "@/lib/books"
import ReadLaterBookButton from "@/components/read-later-book-button"

// A warm palette — one color is picked deterministically from the slug
// so each book always gets the same colour without storing it in data.
const COVER_COLORS = [
  "#5C3D2E", "#2C3E50", "#1A3A4A", "#3D2B1F",
  "#2D4A3E", "#4A1942", "#1C3A5E", "#4A3728",
  "#3B2A1A", "#1E3A5F",
]

function slugColor(slug: string) {
  let hash = 0
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]
}

type Props = {
  slug: string
  title: string
  author: string
  year: number
  goodreadsRating: Book["goodreadsRating"]
  readingProgress?: number
  readLaterEnabled?: boolean
  isReadLater?: boolean
}

export default function BookCard({
  slug,
  title,
  author,
  year,
  goodreadsRating,
  readingProgress = 0,
  readLaterEnabled = false,
  isReadLater = false,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const [localReadingProgress, setLocalReadingProgress] = useState(readingProgress)
  const color = slugColor(slug)
  const visibleReadingProgress = Math.max(readingProgress, localReadingProgress)
  const showProgress = visibleReadingProgress > 0

  useEffect(() => {
    let frame = 0
    try {
      const raw = localStorage.getItem(`cosy-reader-pos-${slug}`)
      if (!raw) return undefined

      const localPos = JSON.parse(raw) as { percentage?: number }
      const localProgress =
        typeof localPos.percentage === "number"
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(localPos.percentage > 1 ? localPos.percentage : localPos.percentage * 100),
              ),
            )
          : 0

      if (localProgress > readingProgress) {
        frame = requestAnimationFrame(() => setLocalReadingProgress(localProgress))
      }
    } catch {}

    return () => cancelAnimationFrame(frame)
  }, [readingProgress, slug])

  return (
    <article data-book-card className="group flex flex-col gap-2">
      {/* Cover — portrait 2:3 aspect ratio */}
      <div
        data-book-cover={slug}
        className="relative w-full overflow-hidden rounded-md shadow-md transition-shadow group-hover:shadow-lg"
        style={{ aspectRatio: "2/3" }}
      >
        <Link
          href={`/books/${slug}`}
          className="absolute inset-0"
        >
          {!imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPath(slug)}
              alt={`Cover of ${title}`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : null}

          {/* Fallback — always rendered underneath; hidden by the image when it loads */}
          <div
            className={[
              "absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center",
              imgFailed ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ backgroundColor: color }}
            aria-hidden={!imgFailed}
          >
            <span className="line-clamp-4 text-xs font-semibold leading-snug text-white/90">
              {title}
            </span>
            <span className="text-[10px] text-white/60">{author}</span>
          </div>
        </Link>

        {(readLaterEnabled || showProgress) && (
          <div className="absolute right-2 top-2 flex w-[6.25rem] flex-col items-end gap-2">
            {readLaterEnabled && (
              <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <ReadLaterBookButton
                  slug={slug}
                  title={title}
                  author={author}
                  initialSaved={isReadLater}
                  compact
                />
              </div>
            )}
            {showProgress && (
              <div className="w-full rounded-md border border-white/15 bg-black/70 px-2.5 py-2 text-white shadow-lg shadow-black/25 backdrop-blur">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium leading-none">
                  <span>Progress</span>
                  <span>{visibleReadingProgress}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{ width: `${visibleReadingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta */}
      <Link href={`/books/${slug}`} className="flex flex-col gap-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
          {title}
        </p>
        <p className="text-muted-foreground text-xs">
          {author} · {year}
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-muted-foreground text-xs">{goodreadsRating.value.toFixed(2)}</span>
        </div>
      </Link>
    </article>
  )
}
