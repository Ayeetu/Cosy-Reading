import { Suspense } from "react"
import { books } from "@/lib/books"
import BookCard from "@/components/book-card"
import BooksFilters from "@/components/books-filters"

type SearchParams = Promise<{
  q?: string
  rating?: string
  year?: string
}>

export default async function BooksPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, rating, year } = await searchParams

  const filtered = books.filter((book) => {
    // Text search
    if (q) {
      const needle = q.toLowerCase()
      if (
        !book.title.toLowerCase().includes(needle) &&
        !book.author.toLowerCase().includes(needle)
      ) return false
    }
    // Rating
    if (rating && book.goodreadsRating < parseFloat(rating)) return false
    // Year range
    if (year) {
      if (year === "pre1800"   && book.year >= 1800) return false
      if (year === "1800-1850" && (book.year < 1800 || book.year > 1850)) return false
      if (year === "1850-1900" && (book.year < 1850 || book.year > 1900)) return false
      if (year === "1900-1930" && (book.year < 1900 || book.year > 1930)) return false
    }

    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Books</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Classic works, free to read — all public domain.
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <BooksFilters
          totalResults={filtered.length}
          totalBooks={books.length}
        />
      </Suspense>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((book) => (
            <BookCard
              key={book.slug}
              slug={book.slug}
              title={book.title}
              author={book.author}
              year={book.year}
              goodreadsRating={book.goodreadsRating}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No books match your filters.
        </p>
      )}
    </div>
  )
}

