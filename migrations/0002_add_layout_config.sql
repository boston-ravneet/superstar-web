-- Creator panel layout configuration
ALTER TABLE profiles ADD COLUMN layout_config_json TEXT NOT NULL DEFAULT '{}';
