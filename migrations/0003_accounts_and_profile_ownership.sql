-- Superstar account auth (Apple / Google login)
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT,
  display_name TEXT,
  auth_provider TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (auth_provider, auth_subject)
);

CREATE INDEX IF NOT EXISTS idx_accounts_auth ON accounts (auth_provider, auth_subject);

ALTER TABLE profiles ADD COLUMN account_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON profiles (account_id);
