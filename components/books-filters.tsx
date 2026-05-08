"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"

const RATING_OPTIONS = [
  { label: "Any rating", value: "" },
  { label: "4.3 and up", value: "4.3" },
  { label: "4.2 and up", value: "4.2" },
  { label: "4.1 and up", value: "4.1" },
  { label: "4.0 and up", value: "4.0" },
  { label: "3.9 and up", value: "3.9" },
]

const YEAR_OPTIONS = [
  { label: "Any era",    value: "" },
  { label: "Before 1800", value: "pre1800" },
  { label: "1800 – 1850", value: "1800-1850" },
  { label: "1850 – 1900", value: "1850-1900" },
  { label: "1900 – 1930", value: "1900-1930" },
]

export default function BooksFilters({ totalResults, totalBooks }: { totalResults: number, totalBooks: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // only use this for clearing input on "Clear filters" click, since otherwise it would be out of sync with the URL after the first change
  const inputRef = useRef<HTMLInputElement>(null)

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to first page on filter change
      params.delete("page")
      router.push(`${pathname}?${params}`)
    },
    [router, pathname, searchParams],
  )

  const q      = searchParams.get("q")      ?? ""
  const rating = searchParams.get("rating") ?? ""
  const year   = searchParams.get("year")   ?? ""

  return (
    <div className="mb-8 flex flex-col gap-4">
      {/* Search */}
      <Input
        type="search"
        placeholder="Search by title or author…"
        defaultValue={q}
        onChange={(e) => update("q", e.target.value)}
        className="max-w-md"
        ref={inputRef}
      />

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Rating */}
        <select
          value={rating}
          onChange={(e) => update("rating", e.target.value)}
          className="border-input bg-background text-foreground rounded-4xl border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Era */}
        <select
          value={year}
          onChange={(e) => update("year", e.target.value)}
          className="border-input bg-background text-foreground rounded-4xl border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {YEAR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Clear — only shown when any filter is active */}
        {(q || rating || year) && (
          <button
            onClick={() => {
              router.push(pathname)
              if (inputRef.current) {
                inputRef.current.value = ""
              }
            }}
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-muted-foreground text-sm">
        {totalResults === totalBooks
          ? `${totalBooks} books`
          : `${totalResults} of ${totalBooks} books`}
      </p>
    </div>
  )
}
