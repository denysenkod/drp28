ALTER TABLE gallery_images
  ADD COLUMN labels_json TEXT NOT NULL DEFAULT '[]';

UPDATE gallery_images
SET labels_json = features_json
WHERE labels_json = '[]'
  AND features_json IS NOT NULL
  AND features_json <> ''
  AND features_json <> '[]';
