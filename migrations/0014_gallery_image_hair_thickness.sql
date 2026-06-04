ALTER TABLE gallery_images
  ADD COLUMN hair_thickness TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_gallery_images_hair_thickness
  ON gallery_images (hair_thickness);

CREATE INDEX IF NOT EXISTS idx_gallery_images_hair_colour
  ON gallery_images (hair_colour);
