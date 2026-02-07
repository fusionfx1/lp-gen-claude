ALTER TABLE ops_profiles ADD COLUMN proxy_pass TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_type TEXT DEFAULT 'http';
ALTER TABLE ops_profiles ADD COLUMN mlx_status TEXT DEFAULT 'stopped';
ALTER TABLE ops_profiles ADD COLUMN last_started_at TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN last_stopped_at TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN account_id TEXT DEFAULT '';
