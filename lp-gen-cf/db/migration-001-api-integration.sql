-- migration-001-api-integration.sql
-- LP Factory V2 — API Integration Schema Migration
-- Run: wrangler d1 execute lp-factory-beta --file=db/migration-001-api-integration.sql

-- OPS_ACCOUNTS: Link to card + profile
ALTER TABLE ops_accounts ADD COLUMN card_uuid TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_last4 TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN card_status TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN profile_id TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN proxy_ip TEXT DEFAULT '';
ALTER TABLE ops_accounts ADD COLUMN monthly_spend REAL DEFAULT 0;

-- OPS_PROFILES: Multilogin fields
ALTER TABLE ops_profiles ADD COLUMN ml_profile_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN ml_folder_id TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_host TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_port TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN proxy_user TEXT DEFAULT '';
ALTER TABLE ops_profiles ADD COLUMN fingerprint_os TEXT DEFAULT 'windows';

-- OPS_PAYMENTS: LeadingCards fields
ALTER TABLE ops_payments ADD COLUMN lc_card_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN lc_bin_uuid TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN card_limit REAL DEFAULT 0;
ALTER TABLE ops_payments ADD COLUMN card_expiry TEXT DEFAULT '';
ALTER TABLE ops_payments ADD COLUMN total_spend REAL DEFAULT 0;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_accounts_card ON ops_accounts(card_uuid);
CREATE INDEX IF NOT EXISTS idx_accounts_profile ON ops_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ml ON ops_profiles(ml_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_lc ON ops_payments(lc_card_uuid);
