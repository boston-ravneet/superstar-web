-- Terms & Conditions acceptance tracking
ALTER TABLE accounts ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE accounts ADD COLUMN terms_version TEXT;
