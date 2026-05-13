/**
 * Custom Auth.js (NextAuth v5) adapter backed by raw postgres.
 *
 * Auth.js calls these functions internally whenever it needs to read or write
 * auth data (users, sessions, OAuth accounts, verification tokens).
 *
 * Each method maps to one or more hand-written SQL statements so you can see
 * exactly what hits the database.
 *
 * Reference: https://authjs.dev/guides/creating-a-database-adapter
 */

import type { Adapter, AdapterUser, AdapterSession, AdapterAccount, VerificationToken } from "next-auth/adapters"
import sql from "./db"

// ── helpers ────────────────────────────────────────────────────────────────────

/** postgres returns snake_case columns; Auth.js expects camelCase objects. */
function toAdapterUser(row: Record<string, unknown>): AdapterUser {
  return {
    id:            row.id             as string,
    name:          row.name           as string | null,
    email:         row.email          as string,
    emailVerified: row.email_verified as Date | null,
    image:         row.image          as string | null,
  }
}

function toAdapterSession(row: Record<string, unknown>): AdapterSession {
  return {
    sessionToken: row.session_token as string,
    userId:       row.user_id       as string,
    expires:      row.expires       as Date,
  }
}

// ── adapter ────────────────────────────────────────────────────────────────────

export const PostgresAdapter: Adapter = {
  // ── Users ──────────────────────────────────────────────────────────────────

  async createUser(user) {
    const [row] = await sql`
      INSERT INTO users (name, email, email_verified, image)
      VALUES (${user.name ?? null}, ${user.email}, ${user.emailVerified ?? null}, ${user.image ?? null})
      RETURNING *
    `
    return toAdapterUser(row)
  },

  async getUser(id) {
    const [row] = await sql`
      SELECT * FROM users WHERE id = ${id}
    `
    return row ? toAdapterUser(row) : null
  },

  async getUserByEmail(email) {
    const [row] = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    return row ? toAdapterUser(row) : null
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const [row] = await sql`
      SELECT u.* FROM users u
      JOIN accounts a ON a.user_id = u.id
      WHERE a.provider = ${provider}
        AND a.provider_account_id = ${providerAccountId}
    `
    return row ? toAdapterUser(row) : null
  },

  async updateUser(user) {
    const [row] = await sql`
      UPDATE users
      SET
        name           = COALESCE(${user.name          ?? null}, name),
        email          = COALESCE(${user.email         ?? null}, email),
        email_verified = COALESCE(${user.emailVerified ?? null}, email_verified),
        image          = COALESCE(${user.image         ?? null}, image),
        updated_at     = now()
      WHERE id = ${user.id}
      RETURNING *
    `
    return toAdapterUser(row)
  },

  async deleteUser(userId) {
    // Cascading deletes handle accounts, sessions, and reading_progress.
    await sql`DELETE FROM users WHERE id = ${userId}`
  },

  // ── OAuth Accounts ─────────────────────────────────────────────────────────

  async linkAccount(account) {
    const userId             = account.userId
    const type               = account.type as string
    const provider           = account.provider
    const providerAccountId  = account.providerAccountId
    const refreshToken       = (account.refresh_token  ?? null) as string | null
    const accessToken        = (account.access_token   ?? null) as string | null
    const expiresAt          = (account.expires_at     ?? null) as number | null
    const tokenType          = (account.token_type     ?? null) as string | null
    const scope              = (account.scope          ?? null) as string | null
    const idToken            = (account.id_token       ?? null) as string | null
    const sessionState       = (account.session_state  ?? null) as string | null

    await sql`
      INSERT INTO accounts (
        user_id, type, provider, provider_account_id,
        refresh_token, access_token, expires_at,
        token_type, scope, id_token, session_state
      ) VALUES (
        ${userId}, ${type}, ${provider}, ${providerAccountId},
        ${refreshToken}, ${accessToken}, ${expiresAt},
        ${tokenType}, ${scope}, ${idToken}, ${sessionState}
      )
    `
    return account as AdapterAccount
  },

  async unlinkAccount({ provider, providerAccountId }) {
    await sql`
      DELETE FROM accounts
      WHERE provider = ${provider}
        AND provider_account_id = ${providerAccountId}
    `
  },

  // ── Sessions ───────────────────────────────────────────────────────────────

  async createSession(session) {
    const [row] = await sql`
      INSERT INTO sessions (session_token, user_id, expires)
      VALUES (${session.sessionToken}, ${session.userId}, ${session.expires})
      RETURNING *
    `
    return toAdapterSession(row)
  },

  async getSessionAndUser(sessionToken) {
    const [row] = await sql`
      SELECT
        s.session_token, s.user_id, s.expires,
        u.id as u_id, u.name, u.email, u.email_verified, u.image
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires > now()
    `
    if (!row) return null

    return {
      session: {
        sessionToken: row.session_token as string,
        userId:       row.user_id       as string,
        expires:      row.expires       as Date,
      },
      user: {
        id:            row.u_id          as string,
        name:          row.name          as string | null,
        email:         row.email         as string,
        emailVerified: row.email_verified as Date | null,
        image:         row.image         as string | null,
      },
    }
  },

  async updateSession(session) {
    const [row] = await sql`
      UPDATE sessions
      SET
        expires    = COALESCE(${session.expires ?? null}, expires),
        user_id    = COALESCE(${session.userId  ?? null}, user_id)
      WHERE session_token = ${session.sessionToken}
      RETURNING *
    `
    return row ? toAdapterSession(row) : null
  },

  async deleteSession(sessionToken) {
    await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`
  },

  // ── Verification tokens (email sign-in / magic links) ──────────────────────

  async createVerificationToken(verificationToken) {
    const [row] = await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${verificationToken.identifier}, ${verificationToken.token}, ${verificationToken.expires})
      RETURNING *
    `
    return {
      identifier: row.identifier as string,
      token:      row.token      as string,
      expires:    row.expires    as Date,
    } satisfies VerificationToken
  },

  async useVerificationToken({ identifier, token }) {
    // Delete and return in one round-trip — tokens are single-use.
    const [row] = await sql`
      DELETE FROM verification_tokens
      WHERE identifier = ${identifier} AND token = ${token}
      RETURNING *
    `
    return row
      ? {
          identifier: row.identifier as string,
          token:      row.token      as string,
          expires:    row.expires    as Date,
        }
      : null
  },
}
