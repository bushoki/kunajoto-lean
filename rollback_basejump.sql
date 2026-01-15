-- ============================================================
-- BASEJUMP ROLLBACK - REMOVE BASEJUMP FROM PRODUCTION
-- ============================================================
-- Run this ONLY if you need to completely remove Basejump
-- This will delete all Basejump tables and data
-- Your Kunajoto tables will NOT be affected
-- ============================================================

-- Drop all Basejump tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS basejump.billing_subscriptions CASCADE;
DROP TABLE IF EXISTS basejump.billing_customers CASCADE;
DROP TABLE IF EXISTS basejump.invitations CASCADE;
DROP TABLE IF EXISTS basejump.account_user CASCADE;
DROP TABLE IF EXISTS basejump.accounts CASCADE;
DROP TABLE IF NOT EXISTS basejump.config CASCADE;

-- Drop the account_role enum
DROP TYPE IF EXISTS basejump.account_role CASCADE;

-- Drop the basejump schema
DROP SCHEMA IF EXISTS basejump CASCADE;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Verify Basejump is completely removed:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'basejump';
-- Should return 0 rows

-- Verify your Kunajoto tables are still there:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
-- Should show all your original tables (venues, user_profiles, etc.)

-- ============================================================
-- ROLLBACK COMPLETE
-- ============================================================
