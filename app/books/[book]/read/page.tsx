import { books } from "@/lib/books"
import { notFound } from "next/navigation"
import BookReader from "@/components/book-reader"

export default async function ReadPage({ params }: { params: Promise<{ book: string }> }) {
  const { book } = await params
  const bookData = books.find((b) => b.slug === book)
  if (!bookData) notFound()

  return <BookReader slug={bookData.slug} title={bookData.title} />
}
