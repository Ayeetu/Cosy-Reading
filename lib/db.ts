import postgres from "postgres"

declare global {
  // Prevent multiple instances in Next.js dev hot-reload
  // eslint-disable-next-line no-var
  var _sql: postgres.Sql | undefined
}

const sql: postgres.Sql =
  globalThis._sql ??
  postgres(process.env.DATABASE_URL!, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") globalThis._sql = sql

export default sql
