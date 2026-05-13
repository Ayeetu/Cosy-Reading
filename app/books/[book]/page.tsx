import { books } from "@/lib/books"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { getBookReadingProgress, getReadLaterSlugs } from "@/lib/read-later"
import BookProgressPanel from "@/components/book-progress-panel"
import ReadLaterBookButton from "@/components/read-later-book-button"

function formatCheckedMonth(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ book: string }>
}) {
  const { book } = await params
  const bookData = books.find((b) => b.slug === book)
  if (!bookData) notFound()
  const session = await auth()
  const readLaterSlugs = session ? await getReadLaterSlugs() : []
  const readingProgress = session
    ? await getBookReadingProgress(bookData.slug)
    : 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All Books
      </Link>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:gap-14">
        {/* Cover */}
        <div className="shrink-0 self-start">
          <div
            data-book-cover={bookData.slug}
            className="relative h-80 w-52 overflow-hidden rounded-lg shadow-2xl sm:h-96 sm:w-64"
          >
            <Image
              src={`/covers/${bookData.slug}.jpg`}
              alt={`Cover of ${bookData.title}`}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">
              {bookData.author} · {bookData.year}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {bookData.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="text-amber-400">★</span>
            <span className="text-sm font-medium">
              {bookData.goodreadsRating.value.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">on Goodreads</span>
            <span className="text-sm text-muted-foreground">
              · checked {formatCheckedMonth(bookData.goodreadsRating.asOf)}
            </span>
          </div>

          <p className="max-w-prose leading-relaxed text-muted-foreground">
            {bookData.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <BookProgressPanel
              slug={bookData.slug}
              initialProgress={readingProgress}
            />
            {session && (
              <ReadLaterBookButton
                slug={bookData.slug}
                title={bookData.title}
                author={bookData.author}
                initialSaved={readLaterSlugs.includes(bookData.slug)}
                size="lg"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
