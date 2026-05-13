import { readFile, writeFile } from "node:fs/promises"
import { books } from "../lib/books"

const CSV_PATH = "data/goodreads-ratings.csv"
const BOOKS_PATH = "lib/books.ts"
const EXPECTED_HEADERS = ["slug", "rating", "count", "url"]

type RatingRow = {
  slug: string
  rating: string
  count: string
  url: string
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ""
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && quoted && next === '"') {
      value += '"'
      i++
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === "," && !quoted) {
      values.push(value.trim())
      value = ""
      continue
    }

    value += char
  }

  if (quoted) {
    throw new Error(`Unclosed quote in CSV line: ${line}`)
  }

  values.push(value.trim())
  return values
}

function parseCsv(csv: string): RatingRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error(`${CSV_PATH} is empty.`)
  }

  const headers = parseCsvLine(lines[0])
  if (headers.join(",") !== EXPECTED_HEADERS.join(",")) {
    throw new Error(`Expected CSV headers: ${EXPECTED_HEADERS.join(",")}`)
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line)
    if (values.length !== EXPECTED_HEADERS.length) {
      throw new Error(`Line ${index + 2} must have ${EXPECTED_HEADERS.length} columns.`)
    }

    return {
      slug: values[0],
      rating: values[1],
      count: values[2],
      url: values[3],
    }
  })
}

function validateRows(rows: RatingRow[]) {
  const knownSlugs = new Set(books.map((book) => book.slug))
  const seenSlugs = new Set<string>()
  const errors: string[] = []

  for (const row of rows) {
    if (!row.slug) {
      errors.push("Found a row with an empty slug.")
      continue
    }

    if (seenSlugs.has(row.slug)) {
      errors.push(`Duplicate slug: ${row.slug}`)
    }
    seenSlugs.add(row.slug)

    if (!knownSlugs.has(row.slug)) {
      errors.push(`Unknown slug: ${row.slug}`)
    }

    const rating = Number(row.rating)
    if (!row.rating || !Number.isFinite(rating) || rating < 0 || rating > 5) {
      errors.push(`Invalid rating for ${row.slug}: ${row.rating}`)
    }

    if (row.count) {
      const count = Number(row.count)
      if (!Number.isInteger(count) || count < 0) {
        errors.push(`Invalid count for ${row.slug}: ${row.count}`)
      }
    }

    if (row.url && !row.url.startsWith("https://www.goodreads.com/")) {
      errors.push(`Invalid Goodreads URL for ${row.slug}: ${row.url}`)
    }
  }

  for (const book of books) {
    if (!seenSlugs.has(book.slug)) {
      errors.push(`Missing slug: ${book.slug}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"))
  }
}

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Could not format current date.")
  }

  return `${year}-${month}-${day}`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function formatRatingObject(row: RatingRow, asOf: string) {
  const lines = [
    "goodreadsRating: {",
    `      value: ${Number(row.rating).toFixed(2)},`,
    `      asOf: "${asOf}",`,
  ]

  if (row.count) {
    lines.push(`      count: ${Number(row.count)},`)
  }

  if (row.url) {
    lines.push(`      url: "${row.url}",`)
  }

  lines.push("    }")
  return lines.join("\n")
}

function replaceRatingObject(source: string, row: RatingRow, asOf: string) {
  const slugIndex = source.search(new RegExp(`slug: "${escapeRegExp(row.slug)}",`))
  if (slugIndex === -1) {
    throw new Error(`Could not find book for ${row.slug}.`)
  }

  const bookStart = source.lastIndexOf("  {", slugIndex)
  const bookEndMatch = /\r?\n  \},/.exec(source.slice(slugIndex))
  if (bookStart === -1 || !bookEndMatch) {
    throw new Error(`Could not find book block for ${row.slug}.`)
  }

  const bookEnd = slugIndex + bookEndMatch.index
  const bookBlock = source.slice(bookStart, bookEnd)
  const ratingPattern = /goodreadsRating: \{[\s\S]*?\r?\n    \}/

  if (!ratingPattern.test(bookBlock)) {
    throw new Error(`Could not find rating object for ${row.slug}.`)
  }

  const nextBlock = bookBlock.replace(ratingPattern, formatRatingObject(row, asOf))
  return `${source.slice(0, bookStart)}${nextBlock}${source.slice(bookEnd)}`
}

async function main() {
  const rows = parseCsv(await readFile(CSV_PATH, "utf8"))
  validateRows(rows)

  const asOf = localDate()
  let source = await readFile(BOOKS_PATH, "utf8")

  for (const row of rows) {
    source = replaceRatingObject(source, row, asOf)
  }

  await writeFile(BOOKS_PATH, source)
  console.log(`Updated ${rows.length} Goodreads rating snapshots as of ${asOf}.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
