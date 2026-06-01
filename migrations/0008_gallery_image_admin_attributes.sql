ALTER TABLE gallery_images
  ADD COLUMN length TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN hair_type TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN maintenance_level TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_gallery_images_length
  ON gallery_images (length);

CREATE INDEX IF NOT EXISTS idx_gallery_images_hair_type
  ON gallery_images (hair_type);

CREATE INDEX IF NOT EXISTS idx_gallery_images_maintenance_level
  ON gallery_images (maintenance_level);
