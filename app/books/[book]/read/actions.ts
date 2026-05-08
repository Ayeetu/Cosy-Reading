"use server"

import { auth } from "@/lib/auth"
import sql from "@/lib/db"

export async function getReadingProgress(slug: string): Promise<{ cfi: string | null; percentage: number } | null> {
  const session = await auth()
  if (!session?.user?.email) return null

  const [row] = await sql<{ cfi: string | null; percentage: number }[]>`
    SELECT rp.cfi, rp.percentage
    FROM reading_progress rp
    JOIN users u ON u.id = rp.user_id
    JOIN books b ON b.id = rp.book_id
    WHERE u.email = ${session.user.email}
      AND b.file_path = ${`/books/${slug}.epub`}
  `
  return row ?? null
}

export async function saveReadingProgress(
  slug: string,
  cfi: string,
  percentage: number,
): Promise<void> {
  const session = await auth()
  if (!session?.user?.email) return

  await sql`
    INSERT INTO reading_progress (user_id, book_id, cfi, percentage, last_read_at)
    SELECT u.id, b.id, ${cfi}, ${percentage}, now()
    FROM users u, books b
    WHERE u.email = ${session.user.email}
      AND b.file_path = ${`/books/${slug}.epub`}
    ON CONFLICT (user_id, book_id) DO UPDATE
      SET cfi = EXCLUDED.cfi,
          percentage = EXCLUDED.percentage,
          last_read_at = now()
  `
}
