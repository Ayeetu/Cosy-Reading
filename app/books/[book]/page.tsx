import { books } from "@/lib/books"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function BookPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params
  const bookData = books.find((b) => b.slug === book)
  if (!bookData) notFound()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/books"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        All Books
      </Link>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:gap-14">
        {/* Cover */}
        <div className="shrink-0 self-start">
          <div className="relative h-80 w-52 overflow-hidden rounded-lg shadow-2xl sm:h-96 sm:w-64">
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
            <p className="text-muted-foreground mb-1.5 text-sm">
              {bookData.author} · {bookData.year}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {bookData.title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-amber-400">★</span>
            <span className="text-sm font-medium">{bookData.goodreadsRating.toFixed(2)}</span>
            <span className="text-muted-foreground text-sm">on Goodreads</span>
          </div>

          <p className="text-muted-foreground max-w-prose leading-relaxed">
            {bookData.description}
          </p>

          <div className="mt-2">
            <Button asChild size="lg">
              <Link href={`/books/${bookData.slug}/read`}>Start Reading</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}