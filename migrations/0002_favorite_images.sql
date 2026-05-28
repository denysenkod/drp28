CREATE TABLE IF NOT EXISTS favorite_images (
  session_id TEXT NOT NULL,
  image_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_images_session_id
  ON favorite_images (session_id);

CREATE INDEX IF NOT EXISTS idx_favorite_images_created_at
  ON favorite_images (created_at);
