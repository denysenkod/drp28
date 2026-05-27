CREATE TABLE IF NOT EXISTS gallery_images (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  features_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at
  ON gallery_images (created_at);

CREATE TABLE IF NOT EXISTS quiz_responses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  answers_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_id
  ON quiz_responses (session_id);

CREATE INDEX IF NOT EXISTS idx_quiz_responses_created_at
  ON quiz_responses (created_at);

CREATE TABLE IF NOT EXISTS user_photos (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Photo',
  image_data TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  features_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_photos_session_id
  ON user_photos (session_id);

CREATE INDEX IF NOT EXISTS idx_user_photos_created_at
  ON user_photos (created_at);
