-- Superstar App D1 schema
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  social_links_json TEXT NOT NULL DEFAULT '[]',
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  oauth_provider TEXT,
  oauth_subject TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_oauth_subject ON profiles (oauth_provider, oauth_subject);
