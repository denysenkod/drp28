ALTER TABLE gallery_images
  ADD COLUMN gender TEXT NOT NULL DEFAULT 'Unisex';

CREATE INDEX IF NOT EXISTS idx_gallery_images_gender
  ON gallery_images (gender);

UPDATE gallery_images
SET gender = 'Men'
WHERE id LIKE 'gq-%'
   OR image_url LIKE '%gq-magazine.co.uk%'
   OR features_json LIKE '%"gq"%'
   OR features_json LIKE '%"mens-hair-trends"%';

UPDATE gallery_images
SET gender = 'Women'
WHERE id LIKE 'glamour-%'
   OR image_url LIKE '%glamour.com%'
   OR features_json LIKE '%"glamour"%'
   OR features_json LIKE '%"womens-hair-trends"%';
