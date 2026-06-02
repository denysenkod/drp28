ALTER TABLE gallery_images
  ADD COLUMN analysis_hair_type TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_length TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_face_shape TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_gender TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_upkeep TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_haircut_name TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_hair_colour TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_vibe TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_maintenance TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_model TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN analysis_updated_at TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_gallery_images_analysis_updated_at
  ON gallery_images (analysis_updated_at);
