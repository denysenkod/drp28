-- Allow one owner session to create multiple completed style briefs over time.
-- The original table had UNIQUE(session_id), which forced every completion to
-- reuse one share link and one feedback thread.
CREATE TABLE IF NOT EXISTS style_briefs_next (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  details_json TEXT NOT NULL DEFAULT '{}'
);

INSERT OR IGNORE INTO style_briefs_next (id, session_id, items_json, created_at, updated_at, details_json)
SELECT id, session_id, items_json, created_at, updated_at, details_json
FROM style_briefs;

DROP TABLE style_briefs;
ALTER TABLE style_briefs_next RENAME TO style_briefs;

CREATE INDEX IF NOT EXISTS idx_style_briefs_session_id
  ON style_briefs (session_id);

CREATE INDEX IF NOT EXISTS idx_style_briefs_session_updated_at
  ON style_briefs (session_id, updated_at DESC);
