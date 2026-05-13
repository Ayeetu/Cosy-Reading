import { auth } from "@/lib/auth"
import sql from "@/lib/db"
import { coverPath } from "@/lib/books"
import { ensureBookRecord, getBookBySlug, slugFromEpubPath } from "@/lib/book-records"

export type ReadLaterBook = {
  slug: string
  title: string
  author: string
  year: number
  coverPath: string
  progress: number
  finished: boolean
  addedAt: string
}

function normalizeProgress(value: number | null | undefined) {
  if (!value || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value > 1 ? value : value * 100)))
}

async function getCurrentUserId() {
  const session = await auth()
  if (!session?.user?.email) return null

  const [row] = await sql<{ id: string }[]>`
    SELECT id
    FROM users
    WHERE email = ${session.user.email}
  `

  return row?.id ?? session.user.id ?? null
}

export async function getReadLaterItems(): Promise<ReadLaterBook[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const rows = await sql<{
    file_path: string
    added_at: Date
    percentage: number | null
  }[]>`
    SELECT b.file_path, rl.added_at, rp.percentage
    FROM read_later_books rl
    JOIN books b ON b.id = rl.book_id
    LEFT JOIN reading_progress rp
      ON rp.user_id = rl.user_id
      AND rp.book_id = rl.book_id
    WHERE rl.user_id = ${userId}
    ORDER BY rl.added_at DESC
  `

  return rows.flatMap((row) => {
    const slug = slugFromEpubPath(row.file_path)
    const book = getBookBySlug(slug)
    if (!book) return []

    const progress = normalizeProgress(row.percentage)
    return {
      slug,
      title: book.title,
      author: book.author,
      year: book.year,
      coverPath: coverPath(slug),
      progress,
      finished: progress >= 99,
      addedAt: row.added_at.toISOString(),
    }
  })
}

export async function getReadLaterSlugs() {
  const items = await getReadLaterItems()
  return items.map((item) => item.slug)
}

export async function getReadingProgressMap() {
  const userId = await getCurrentUserId()
  if (!userId) return new Map<string, number>()

  const rows = await sql<{
    file_path: string
    percentage: number | null
  }[]>`
    SELECT b.file_path, rp.percentage
    FROM reading_progress rp
    JOIN books b ON b.id = rp.book_id
    WHERE rp.user_id = ${userId}
  `

  return new Map(
    rows
      .map((row) => [slugFromEpubPath(row.file_path), normalizeProgress(row.percentage)] as const)
      .filter(([, progress]) => progress > 0),
  )
}

export async function getBookReadingProgress(slug: string) {
  const progressMap = await getReadingProgressMap()
  return progressMap.get(slug) ?? 0
}

export async function addBookToReadLater(slug: string) {
  const userId = await getCurrentUserId()
  if (!userId) return getReadLaterItems()

  const bookId = await ensureBookRecord(slug)
  if (!bookId) return getReadLaterItems()

  await sql`
    INSERT INTO read_later_books (user_id, book_id, added_at)
    VALUES (${userId}, ${bookId}, now())
    ON CONFLICT (user_id, book_id) DO UPDATE
      SET added_at = now()
  `

  return getReadLaterItems()
}

export async function removeBookFromReadLater(slug: string) {
  const userId = await getCurrentUserId()
  if (!userId) return getReadLaterItems()

  await sql`
    DELETE FROM read_later_books rl
    USING books b
    WHERE rl.book_id = b.id
      AND rl.user_id = ${userId}
      AND b.file_path = ${`/books/${slug}.epub`}
  `

  return getReadLaterItems()
}
