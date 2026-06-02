ALTER TABLE gallery_images
  ADD COLUMN analysis_hair_subtype TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_gallery_images_analysis_hair_subtype
  ON gallery_images (analysis_hair_subtype);
