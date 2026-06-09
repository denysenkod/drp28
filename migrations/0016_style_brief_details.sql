-- Colour & consultation info for a style brief: the chosen colour treatment
-- (default "No colour treatment"), allergies, previous colour treatments,
-- damage, and general notes. Stored as a single JSON object so it travels with
-- the brief and reaches the stylist who opens the share link.
ALTER TABLE style_briefs ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}';
