ALTER TABLE profiles ADD COLUMN publish_status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE profiles ADD COLUMN stage_template_json TEXT;
ALTER TABLE profiles ADD COLUMN builder_input_json TEXT;
ALTER TABLE profiles ADD COLUMN generation_error TEXT;
