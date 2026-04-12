/**
 * Seed script — populates the `books` table with metadata.
 *
 * Usage:
 *   npm run seed
 *
 * Add a book:
 *   1. Drop the .epub file into public/books/  (e.g. public/books/moby-dick.epub)
 *   2. Drop a cover image into public/covers/  (e.g. public/covers/moby-dick.jpg)
 *   3. Add an entry to the BOOKS array below.
 *   4. Re-run: npm run seed  — existing records are upserted, nothing is duplicated.
 */

import "dotenv/config"
import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" })

type BookSeed = {
  title: string
  author: string
  description?: string
  coverImage?: string
  filePath: string
}

const BOOKS: BookSeed[] = [
  // ── Add your books here ──────────────────────────────────────────────────
  // {
  //   title: "Moby Dick",
  //   author: "Herman Melville",
  //   description: "The saga of Captain Ahab's obsessive quest to hunt the white whale.",
  //   coverImage: "/covers/moby-dick.jpg",
  //   filePath: "/books/moby-dick.epub",
  // },
]

async function main() {
  console.log(`Seeding ${BOOKS.length} book(s)…`)

  for (const book of BOOKS) {
    // Upsert on file_path — safe to re-run without creating duplicates
    const [row] = await sql`
      INSERT INTO books (title, author, description, cover_image, file_path)
      VALUES (
        ${book.title},
        ${book.author},
        ${book.description ?? null},
        ${book.coverImage  ?? null},
        ${book.filePath}
      )
      ON CONFLICT (file_path) DO UPDATE SET
        title       = EXCLUDED.title,
        author      = EXCLUDED.author,
        description = EXCLUDED.description,
        cover_image = EXCLUDED.cover_image
      RETURNING id, title
    `
    console.log(`  ✔ ${row.title} (${row.id})`)
  }

  console.log("Done.")
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

