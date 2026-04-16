-- Run once against your Neon database:
--   psql $DATABASE_URL -f lib/db/schema.sql

CREATE TABLE IF NOT EXISTS research_sessions (
  id              TEXT        PRIMARY KEY,
  user_id         TEXT        NOT NULL,
  timestamp       BIGINT      NOT NULL,
  query           TEXT        NOT NULL,
  mode            TEXT        NOT NULL,
  summary         TEXT        NOT NULL DEFAULT '',
  confidence      INTEGER     NOT NULL DEFAULT 50,
  source_count    INTEGER     NOT NULL DEFAULT 0,
  iteration_count INTEGER     NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS research_sessions_timestamp_idx
  ON research_sessions (timestamp DESC);

CREATE INDEX IF NOT EXISTS research_sessions_user_id_idx
  ON research_sessions (user_id);
