-- LP Factory V2 — Cloudflare D1 Schema
-- Run: wrangler d1 execute lp-factory --file=db/schema.sql

-- ═══ SITES ═══
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  domain TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  email TEXT DEFAULT '',
  loan_type TEXT DEFAULT 'personal',
  amount_min REAL DEFAULT 100,
  amount_max REAL DEFAULT 5000,
  apr_min REAL DEFAULT 5.99,
  apr_max REAL DEFAULT 35.99,
  color_id TEXT DEFAULT 'ocean',
  font_id TEXT DEFAULT 'dm-sans',
  layout TEXT DEFAULT 'hero-left',
  radius TEXT DEFAULT 'rounded',
  h1 TEXT DEFAULT '',
  badge TEXT DEFAULT '',
  cta TEXT DEFAULT '',
  sub TEXT DEFAULT '',
  gtm_id TEXT DEFAULT '',
  network TEXT DEFAULT 'LeadsGate',
  redirect_url TEXT DEFAULT '',
  conversion_id TEXT DEFAULT '',
  conversion_label TEXT DEFAULT '',
  copy_id TEXT DEFAULT '',
  sections TEXT DEFAULT 'default',
  compliance TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'completed',
  cost REAL DEFAULT 0,
  created_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═══ DEPLOYS ═══
CREATE TABLE IF NOT EXISTS deploys (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  brand TEXT DEFAULT '',
  url TEXT DEFAULT '',
  type TEXT DEFAULT 'new',
  deployed_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- ═══ VARIANTS (Registry) ═══
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  color_id TEXT DEFAULT 'ocean',
  font_id TEXT DEFAULT 'dm-sans',
  layout TEXT DEFAULT 'hero-left',
  radius TEXT DEFAULT 'rounded',
  copy_id TEXT DEFAULT 'smart',
  sections TEXT DEFAULT 'default',
  compliance TEXT DEFAULT 'standard',
  created_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ OPS: DOMAINS ═══
CREATE TABLE IF NOT EXISTS ops_domains (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  registrar TEXT DEFAULT '',
  account_id TEXT DEFAULT '',
  profile_id TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ OPS: ADS ACCOUNTS ═══
CREATE TABLE IF NOT EXISTS ops_accounts (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  email TEXT DEFAULT '',
  payment_id TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  card_uuid TEXT DEFAULT '',
  card_last4 TEXT DEFAULT '',
  card_status TEXT DEFAULT '',
  profile_id TEXT DEFAULT '',
  proxy_ip TEXT DEFAULT '',
  monthly_spend REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ OPS: PROFILES ═══
CREATE TABLE IF NOT EXISTS ops_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  proxy_ip TEXT DEFAULT '',
  browser_type TEXT DEFAULT '',
  os TEXT DEFAULT '',
  ml_profile_id TEXT DEFAULT '',
  ml_folder_id TEXT DEFAULT '',
  proxy_host TEXT DEFAULT '',
  proxy_port TEXT DEFAULT '',
  proxy_user TEXT DEFAULT '',
  fingerprint_os TEXT DEFAULT 'windows',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ OPS: PAYMENTS ═══
CREATE TABLE IF NOT EXISTS ops_payments (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT DEFAULT '',
  last4 TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  lc_card_uuid TEXT DEFAULT '',
  lc_bin_uuid TEXT DEFAULT '',
  card_limit REAL DEFAULT 0,
  card_expiry TEXT DEFAULT '',
  total_spend REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ OPS: ACTIVITY LOG ═══
CREATE TABLE IF NOT EXISTS ops_logs (
  id TEXT PRIMARY KEY,
  msg TEXT NOT NULL,
  created_by TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ═══ SETTINGS (per-user or shared) ═══
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sites_created ON sites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deploys_site ON deploys(site_id);
CREATE INDEX IF NOT EXISTS idx_deploys_created ON deploys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created ON ops_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domains_account ON ops_domains(account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payment ON ops_accounts(payment_id);
CREATE INDEX IF NOT EXISTS idx_accounts_card ON ops_accounts(card_uuid);
CREATE INDEX IF NOT EXISTS idx_accounts_profile ON ops_accounts(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ml ON ops_profiles(ml_profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_lc ON ops_payments(lc_card_uuid);
