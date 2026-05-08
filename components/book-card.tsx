"use client"

import { useState } from "react"
import Link from "next/link"
import { coverPath } from "@/lib/books"

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
  goodreadsRating: number
}

export default function BookCard({ slug, title, author, year, goodreadsRating }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const color = slugColor(slug)

  return (
    <Link
      href={`/books/${slug}`}
      className="group flex flex-col gap-2"
    >
      {/* Cover — portrait 2:3 aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-md shadow-md transition-shadow group-hover:shadow-lg"
        style={{ aspectRatio: "2/3" }}
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
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
          {title}
        </p>
        <p className="text-muted-foreground text-xs">
          {author} · {year}
        </p>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-muted-foreground text-xs">{goodreadsRating.toFixed(2)}</span>
        </div>
      </div>
    </Link>
  )
}
