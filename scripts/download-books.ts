/**
 * Downloads EPUBs and cover images for all books from Standard Ebooks.
 *
 * Run from the project root:
 *   npx tsx scripts/download-books.ts
 *
 * Files are saved to:
 *   public/books/[slug].epub
 *   public/covers/[slug].jpg
 *
 * Standard Ebooks URL pattern:
 *   https://standardebooks.org/ebooks/[se-slug]/downloads/[se-slug-with-underscores].epub
 *   https://standardebooks.org/ebooks/[se-slug]/downloads/cover.jpg
 *
 * NOTE: SE slugs for translated works include the translator name
 * (e.g. fyodor-dostoevsky/crime-and-punishment/constance-garnett).
 * If a download returns 404, visit standardebooks.org to find the exact slug.
 */

import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { books } from "../lib/books"

const SE_BASE = "https://standardebooks.org/ebooks"

async function download(url: string, dest: string, expectedType: string): Promise<boolean> {
  if (existsSync(dest)) {
    console.log(`  skip  ${path.basename(dest)} (already exists)`)
    return true
  }
  const res = await fetch(url, {
    headers: { "User-Agent": "cosy-reading/dev (educational, public domain books)" },
    redirect: "follow",
  })
  if (!res.ok) {
    console.error(`  ✗ ${res.status}  ${url}`)
    return false
  }
  // Guard: SE returns an HTML interstitial if the URL is wrong.
  // Check the Content-Type matches what we expect before saving.
  const contentType = res.headers.get("content-type") ?? ""
  if (!contentType.includes(expectedType)) {
    console.error(`  ✗ unexpected content-type "${contentType}" for ${path.basename(dest)}`)
    return false
  }
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
  console.log(`  ✓ ${path.basename(dest)}`)
  return true
}

async function main() {
  await mkdir("public/books",  { recursive: true })
  await mkdir("public/covers", { recursive: true })

  let ok = 0, fail = 0

  for (const book of books) {
    console.log(`\n▸ ${book.title} (${book.author})`)

    // The EPUB filename uses underscores in place of slashes in the SE slug.
    // ?source=download bypasses SE's "Your Download Has Started" HTML interstitial.
    const seFileName = book.seSlug.replace(/\//g, "_")
    const epubUrl  = `${SE_BASE}/${book.seSlug}/downloads/${seFileName}.epub?source=download`
    const coverUrl = `${SE_BASE}/${book.seSlug}/downloads/cover.jpg`

    const epubOk  = await download(epubUrl,  `public/books/${book.slug}.epub`,  "epub")
    const coverOk = await download(coverUrl, `public/covers/${book.slug}.jpg`,  "image")

    if (epubOk && coverOk) ok++
    else fail++
  }

  console.log(`\n✔ Done — ${ok} succeeded, ${fail} failed.`)
  if (fail > 0) {
    console.log("  For failed books, visit https://standardebooks.org and find the exact URL slug.")
  }
}

main().catch(console.error)
