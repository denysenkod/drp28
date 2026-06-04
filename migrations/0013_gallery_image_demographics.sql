ALTER TABLE gallery_images
  ADD COLUMN ethnicity TEXT NOT NULL DEFAULT '';

ALTER TABLE gallery_images
  ADD COLUMN celebrity TEXT NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_gallery_images_ethnicity
  ON gallery_images (ethnicity);

CREATE INDEX IF NOT EXISTS idx_gallery_images_celebrity
  ON gallery_images (celebrity);
