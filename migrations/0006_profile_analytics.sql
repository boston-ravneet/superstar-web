-- Daily rollup for profile page views (public stage visits).
CREATE TABLE IF NOT EXISTS profile_analytics_daily (
  profile_id TEXT NOT NULL,
  view_date TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, view_date),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profile_analytics_daily_date
  ON profile_analytics_daily (view_date);
