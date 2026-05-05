-- 002 — swap Stripe columns for LemonSqueezy.
-- Country lock-in on the existing US Stripe account forced a migration to
-- LemonSqueezy (Merchant of Record). Existing rows preserve `plan` value;
-- ls_* columns start NULL until the first LS webhook arrives.

DROP INDEX IF EXISTS idx_users_stripe_cus;

ALTER TABLE users DROP COLUMN stripe_customer_id;
ALTER TABLE users DROP COLUMN stripe_subscription_id;

ALTER TABLE users ADD COLUMN ls_customer_id TEXT;
ALTER TABLE users ADD COLUMN ls_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_ls_cus ON users(ls_customer_id);
