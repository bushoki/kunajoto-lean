-- ============================================================
-- BASEJUMP SAAS KIT - PRODUCTION INSTALLATION
-- ============================================================
-- Run this in Supabase SQL Editor on your PRODUCTION database
-- Project: grnekxrkypgighmxyveh
-- Date: December 11, 2025
-- ============================================================

-- Create basejump schema
CREATE SCHEMA IF NOT EXISTS basejump;

-- Create account_role enum
CREATE TYPE IF NOT EXISTS basejump.account_role AS ENUM ('owner', 'member');

-- Create config table
CREATE TABLE IF NOT EXISTS basejump.config (
    enable_team_accounts boolean DEFAULT true,
    enable_personal_accounts boolean DEFAULT true
);

-- Insert default config
INSERT INTO basejump.config (enable_team_accounts, enable_personal_accounts)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- Create accounts table
CREATE TABLE IF NOT EXISTS basejump.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name text,
    personal_account boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create account_user junction table
CREATE TABLE IF NOT EXISTS basejump.account_user (
    user_id uuid NOT NULL,
    account_id uuid NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    account_role basejump.account_role NOT NULL,
    PRIMARY KEY (user_id, account_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS basejump.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    account_role basejump.account_role NOT NULL,
    token text UNIQUE NOT NULL,
    invited_by_user_id uuid,
    created_at timestamptz DEFAULT now()
);

-- Create billing_customers table
CREATE TABLE IF NOT EXISTS basejump.billing_customers (
    id uuid PRIMARY KEY,
    account_id uuid UNIQUE NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    email text,
    provider text DEFAULT 'stripe'
);

-- Create billing_subscriptions table
CREATE TABLE IF NOT EXISTS basejump.billing_subscriptions (
    id text PRIMARY KEY,
    customer_id uuid REFERENCES basejump.billing_customers(id) ON DELETE CASCADE,
    status text,
    price_id text,
    quantity integer,
    cancel_at_period_end boolean DEFAULT false,
    created timestamptz,
    current_period_start timestamptz,
    current_period_end timestamptz,
    ended_at timestamptz,
    cancel_at timestamptz,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz
);

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify installation:

-- Check all basejump tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'basejump'
ORDER BY table_name;

-- Expected result: 6 tables
-- - account_user
-- - accounts
-- - billing_customers
-- - billing_subscriptions
-- - config
-- - invitations

-- ============================================================
-- SUCCESS!
-- ============================================================
-- Basejump is now installed on your production database.
-- Your existing Kunajoto tables are untouched.
-- Both systems will coexist in separate schemas.
-- ============================================================
