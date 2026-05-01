-- FreeTier Sentinel — D1 schema
-- Run: wrangler d1 execute freetier-sentinel-db --file=src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_cus ON users(stripe_customer_id);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  credentials_enc TEXT NOT NULL,
  threshold_pct INTEGER NOT NULL DEFAULT 80,
  last_check INTEGER,
  last_usage_pct INTEGER,
  last_status TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_check ON services(last_check);

CREATE TABLE IF NOT EXISTS alert_channels (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  target TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alert_channels(user_id);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  usage_pct INTEGER NOT NULL,
  status TEXT NOT NULL,
  notified INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_service ON events(service_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
