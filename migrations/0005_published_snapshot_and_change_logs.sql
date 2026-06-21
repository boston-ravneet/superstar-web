ALTER TABLE profiles ADD COLUMN published_stage_template_json TEXT;

CREATE TABLE IF NOT EXISTS profile_change_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  account_id TEXT,
  event TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profile_change_logs_profile_id
  ON profile_change_logs(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_change_logs_created_at
  ON profile_change_logs(created_at);

UPDATE profiles
SET published_stage_template_json = stage_template_json
WHERE publish_status = 'published'
  AND published_stage_template_json IS NULL
  AND stage_template_json IS NOT NULL;
