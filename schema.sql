-- ============================================================
-- Cosy Reading — database schema
-- Run this file once against your Neon (or local) Postgres DB.
--
--   psql $DATABASE_URL -f schema.sql
--
-- Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- Auth.js required tables
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT,
  email           TEXT        NOT NULL UNIQUE,
  email_verified  TIMESTAMPTZ,
  image           TEXT,
  password_hash   TEXT,                       -- NULL for OAuth-only users
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  provider_account_id  TEXT NOT NULL,
  refresh_token        TEXT,
  access_token         TEXT,
  expires_at           INTEGER,
  token_type           TEXT,
  scope                TEXT,
  id_token             TEXT,
  session_state        TEXT,

  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT        NOT NULL UNIQUE,
  user_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier  TEXT        NOT NULL,
  token       TEXT        NOT NULL,
  expires     TIMESTAMPTZ NOT NULL,

  UNIQUE (identifier, token)
);


-- ──────────────────────────────────────────────────────────
-- App tables
-- ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS books (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT        NOT NULL,
  author      TEXT        NOT NULL,
  description TEXT,
  cover_image TEXT,                           -- e.g. /covers/moby-dick.jpg
  file_path   TEXT        NOT NULL UNIQUE,    -- e.g. /books/moby-dick.epub
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  book_id     TEXT        NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
  cfi         TEXT,                           -- epub.js CFI string (current location)
  percentage  FLOAT       NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS read_later_books (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  book_id     TEXT        NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS read_later_books_user_added_idx
  ON read_later_books (user_id, added_at DESC);
