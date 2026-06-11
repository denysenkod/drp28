CREATE TABLE IF NOT EXISTS try_on_generations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  style_id TEXT,
  model TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_try_on_generations_session
  ON try_on_generations (session_id, created_at DESC);
