import "dotenv/config"
import { readFile } from "node:fs/promises"
import postgres from "postgres"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL is not set.")
  process.exit(1)
}

const sql = postgres(databaseUrl, { ssl: "require" })

try {
  const schema = await readFile("schema.sql", "utf8")
  await sql.unsafe(schema)
  console.log("Database schema migrated.")
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await sql.end()
}
