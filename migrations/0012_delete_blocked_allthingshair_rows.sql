DELETE FROM favorite_images
WHERE image_id IN (
  SELECT id
  FROM gallery_images
  WHERE id LIKE 'ath-asianwomen-%'
    AND image_url LIKE 'https://assets.unileversolutions.com/%'
    AND classified_at = ''
);

DELETE FROM gallery_images
WHERE id LIKE 'ath-asianwomen-%'
  AND image_url LIKE 'https://assets.unileversolutions.com/%'
  AND classified_at = '';
