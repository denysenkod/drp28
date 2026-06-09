-- Shareable style briefs.
-- A brief is the owner's collection of brief items (photos of their own hair and
-- references), each with a rating and notes. It lives server-side so the owner
-- can share a link and a reviewer (e.g. their stylist) can open it.
--
-- items_json stores the full brief array exactly as the frontend models it
-- (including base64 data URLs for uploaded photos). One row per owner session.
CREATE TABLE IF NOT EXISTS style_briefs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  items_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_style_briefs_session_id
  ON style_briefs (session_id);

-- Reviewer feedback is kept in its own table so the owner's auto-save (which
-- rewrites items_json) never overwrites it. item_id ties a comment to a single
-- brief item; a null item_id is general feedback on the whole brief.
CREATE TABLE IF NOT EXISTS brief_feedback (
  id TEXT PRIMARY KEY,
  brief_id TEXT NOT NULL,
  item_id TEXT,
  author TEXT NOT NULL DEFAULT 'Reviewer',
  rating INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brief_feedback_brief_id
  ON brief_feedback (brief_id);
