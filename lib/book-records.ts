import sql from "@/lib/db"
import { books, coverPath, epubPath } from "@/lib/books"

export function getBookBySlug(slug: string) {
  return books.find((book) => book.slug === slug) ?? null
}

export function slugFromEpubPath(path: string) {
  return path.replace(/^\/books\//, "").replace(/\.epub$/, "")
}

export async function ensureBookRecord(slug: string) {
  const book = getBookBySlug(slug)
  if (!book) return null

  const [row] = await sql<{ id: string }[]>`
    INSERT INTO books (title, author, description, cover_image, file_path)
    VALUES (
      ${book.title},
      ${book.author},
      ${book.description},
      ${coverPath(book.slug)},
      ${epubPath(book.slug)}
    )
    ON CONFLICT (file_path) DO UPDATE SET
      title = EXCLUDED.title,
      author = EXCLUDED.author,
      description = EXCLUDED.description,
      cover_image = EXCLUDED.cover_image
    RETURNING id
  `

  return row?.id ?? null
}
