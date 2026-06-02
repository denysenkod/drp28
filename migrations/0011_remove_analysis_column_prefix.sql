DROP INDEX IF EXISTS idx_gallery_images_analysis_updated_at;

DROP INDEX IF EXISTS idx_gallery_images_analysis_hair_subtype;

DROP INDEX IF EXISTS idx_gallery_images_maintenance_level;

UPDATE gallery_images
SET gender = CASE LOWER(analysis_gender)
  WHEN 'male' THEN 'Men'
  WHEN 'female' THEN 'Women'
  ELSE gender
END
WHERE analysis_gender IS NOT NULL
  AND analysis_gender <> '';

UPDATE gallery_images
SET length = analysis_length
WHERE analysis_length IS NOT NULL
  AND analysis_length <> '';

UPDATE gallery_images
SET hair_type = analysis_hair_type
WHERE analysis_hair_type IS NOT NULL
  AND analysis_hair_type <> '';

ALTER TABLE gallery_images
  RENAME COLUMN maintenance_level TO upkeep;

UPDATE gallery_images
SET upkeep = analysis_upkeep
WHERE analysis_upkeep IS NOT NULL
  AND analysis_upkeep <> '';

ALTER TABLE gallery_images
  RENAME COLUMN analysis_hair_subtype TO hair_subtype;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_face_shape TO face_shape;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_haircut_name TO haircut_name;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_hair_colour TO hair_colour;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_vibe TO vibe;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_maintenance TO maintenance;

ALTER TABLE gallery_images
  RENAME COLUMN analysis_updated_at TO classified_at;

ALTER TABLE gallery_images
  DROP COLUMN analysis_hair_type;

ALTER TABLE gallery_images
  DROP COLUMN analysis_length;

ALTER TABLE gallery_images
  DROP COLUMN analysis_gender;

ALTER TABLE gallery_images
  DROP COLUMN analysis_upkeep;

CREATE INDEX IF NOT EXISTS idx_gallery_images_upkeep
  ON gallery_images (upkeep);

CREATE INDEX IF NOT EXISTS idx_gallery_images_hair_subtype
  ON gallery_images (hair_subtype);

CREATE INDEX IF NOT EXISTS idx_gallery_images_classified_at
  ON gallery_images (classified_at);
