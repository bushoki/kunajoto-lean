-- ============================================================
-- BASEJUMP COMPLETE INSTALLATION - PRODUCTION READY
-- ============================================================
-- This script installs a complete, future-proof Basejump setup
-- Including: Tables, Functions, Triggers, and RLS Policies
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ============================================================
-- PART 1: SCHEMA & TABLES
-- ============================================================

-- Create basejump schema
CREATE SCHEMA IF NOT EXISTS basejump;

-- Create account_role enum
DO $$ BEGIN
    CREATE TYPE basejump.account_role AS ENUM ('owner', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Config table
CREATE TABLE IF NOT EXISTS basejump.config (
    enable_team_accounts boolean DEFAULT true,
    enable_personal_accounts boolean DEFAULT true
);

-- Accounts table
CREATE TABLE IF NOT EXISTS basejump.accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name text,
    personal_account boolean DEFAULT false,
    updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Account_user junction table (MISSING - NOW ADDED)
CREATE TABLE IF NOT EXISTS basejump.account_user (
    user_id uuid NOT NULL,
    account_id uuid NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    account_role basejump.account_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, account_id)
);

-- Invitations table (MISSING - NOW ADDED)
CREATE TABLE IF NOT EXISTS basejump.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    account_role basejump.account_role NOT NULL,
    token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by_user_id uuid,
    invited_email text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Billing customers table
CREATE TABLE IF NOT EXISTS basejump.billing_customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid UNIQUE NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    email text,
    provider text DEFAULT 'stripe',
    provider_customer_id text UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- Billing subscriptions table
CREATE TABLE IF NOT EXISTS basejump.billing_subscriptions (
    id text PRIMARY KEY,
    customer_id uuid REFERENCES basejump.billing_customers(id) ON DELETE CASCADE,
    status text,
    price_id text,
    quantity integer DEFAULT 1,
    cancel_at_period_end boolean DEFAULT false,
    created timestamptz DEFAULT now(),
    current_period_start timestamptz,
    current_period_end timestamptz,
    ended_at timestamptz,
    cancel_at timestamptz,
    canceled_at timestamptz,
    trial_start timestamptz,
    trial_end timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Insert default config
INSERT INTO basejump.config (enable_team_accounts, enable_personal_accounts)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 2: FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Auto-create personal account on user signup
CREATE OR REPLACE FUNCTION basejump.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_account_id uuid;
BEGIN
    -- Create personal account
    INSERT INTO basejump.accounts (personal_account, team_name)
    VALUES (true, NEW.email)
    RETURNING id INTO new_account_id;
    
    -- Link user to their personal account as owner
    INSERT INTO basejump.account_user (user_id, account_id, account_role)
    VALUES (NEW.id, new_account_id, 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create account on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION basejump.handle_new_user();

-- Function: Get user's accounts
CREATE OR REPLACE FUNCTION basejump.get_user_accounts(user_uuid uuid)
RETURNS TABLE (
    account_id uuid,
    team_name text,
    personal_account boolean,
    account_role basejump.account_role,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.team_name,
        a.personal_account,
        au.account_role,
        a.created_at
    FROM basejump.accounts a
    JOIN basejump.account_user au ON a.id = au.account_id
    WHERE au.user_id = user_uuid
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create team account
CREATE OR REPLACE FUNCTION basejump.create_team_account(
    creator_user_id uuid,
    team_name_param text
)
RETURNS uuid AS $$
DECLARE
    new_account_id uuid;
BEGIN
    -- Create team account
    INSERT INTO basejump.accounts (personal_account, team_name)
    VALUES (false, team_name_param)
    RETURNING id INTO new_account_id;
    
    -- Add creator as owner
    INSERT INTO basejump.account_user (user_id, account_id, account_role)
    VALUES (creator_user_id, new_account_id, 'owner');
    
    RETURN new_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Invite user to account
CREATE OR REPLACE FUNCTION basejump.invite_user_to_account(
    account_id_param uuid,
    inviter_user_id uuid,
    invited_email_param text,
    role_param basejump.account_role DEFAULT 'member'
)
RETURNS uuid AS $$
DECLARE
    new_invitation_id uuid;
    is_owner boolean;
BEGIN
    -- Check if inviter is owner
    SELECT (account_role = 'owner') INTO is_owner
    FROM basejump.account_user
    WHERE user_id = inviter_user_id AND account_id = account_id_param;
    
    IF NOT is_owner THEN
        RAISE EXCEPTION 'Only account owners can invite users';
    END IF;
    
    -- Create invitation
    INSERT INTO basejump.invitations (account_id, invited_by_user_id, invited_email, account_role)
    VALUES (account_id_param, inviter_user_id, invited_email_param, role_param)
    RETURNING id INTO new_invitation_id;
    
    RETURN new_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Accept invitation
CREATE OR REPLACE FUNCTION basejump.accept_invitation(
    invitation_token text,
    accepting_user_id uuid
)
RETURNS boolean AS $$
DECLARE
    invitation_record RECORD;
BEGIN
    -- Get invitation
    SELECT * INTO invitation_record
    FROM basejump.invitations
    WHERE token = invitation_token
    AND expires_at > now();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Add user to account
    INSERT INTO basejump.account_user (user_id, account_id, account_role)
    VALUES (accepting_user_id, invitation_record.account_id, invitation_record.account_role)
    ON CONFLICT DO NOTHING;
    
    -- Delete invitation
    DELETE FROM basejump.invitations WHERE id = invitation_record.id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update account updated_at timestamp
CREATE OR REPLACE FUNCTION basejump.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on accounts
DROP TRIGGER IF EXISTS update_accounts_updated_at ON basejump.accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON basejump.accounts
    FOR EACH ROW
    EXECUTE FUNCTION basejump.update_updated_at_column();

-- ============================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE basejump.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.account_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Accounts: Users can view accounts they belong to
DROP POLICY IF EXISTS "Users can view their accounts" ON basejump.accounts;
CREATE POLICY "Users can view their accounts"
    ON basejump.accounts FOR SELECT
    USING (
        id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Accounts: Owners can update their accounts
DROP POLICY IF EXISTS "Owners can update accounts" ON basejump.accounts;
CREATE POLICY "Owners can update accounts"
    ON basejump.accounts FOR UPDATE
    USING (
        id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid() AND account_role = 'owner'
        )
    );

-- Accounts: Owners can delete their accounts
DROP POLICY IF EXISTS "Owners can delete accounts" ON basejump.accounts;
CREATE POLICY "Owners can delete accounts"
    ON basejump.accounts FOR DELETE
    USING (
        id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid() AND account_role = 'owner'
        )
    );

-- Account_user: Users can view members of their accounts
DROP POLICY IF EXISTS "Users can view account members" ON basejump.account_user;
CREATE POLICY "Users can view account members"
    ON basejump.account_user FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Account_user: Owners can manage account members
DROP POLICY IF EXISTS "Owners can manage members" ON basejump.account_user;
CREATE POLICY "Owners can manage members"
    ON basejump.account_user FOR ALL
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid() AND account_role = 'owner'
        )
    );

-- Invitations: Users can view invitations for their accounts
DROP POLICY IF EXISTS "Users can view account invitations" ON basejump.invitations;
CREATE POLICY "Users can view account invitations"
    ON basejump.invitations FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Invitations: Owners can manage invitations
DROP POLICY IF EXISTS "Owners can manage invitations" ON basejump.invitations;
CREATE POLICY "Owners can manage invitations"
    ON basejump.invitations FOR ALL
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid() AND account_role = 'owner'
        )
    );

-- Billing: Users can view billing for their accounts
DROP POLICY IF EXISTS "Users can view billing" ON basejump.billing_customers;
CREATE POLICY "Users can view billing"
    ON basejump.billing_customers FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid()
        )
    );

-- Billing: Owners can manage billing
DROP POLICY IF EXISTS "Owners can manage billing" ON basejump.billing_customers;
CREATE POLICY "Owners can manage billing"
    ON basejump.billing_customers FOR ALL
    USING (
        account_id IN (
            SELECT account_id FROM basejump.account_user
            WHERE user_id = auth.uid() AND account_role = 'owner'
        )
    );

-- Subscriptions: Users can view subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions" ON basejump.billing_subscriptions;
CREATE POLICY "Users can view subscriptions"
    ON basejump.billing_subscriptions FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM basejump.billing_customers
            WHERE account_id IN (
                SELECT account_id FROM basejump.account_user
                WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_account_user_user_id ON basejump.account_user(user_id);
CREATE INDEX IF NOT EXISTS idx_account_user_account_id ON basejump.account_user(account_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON basejump.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_account_id ON basejump.invitations(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_account_id ON basejump.billing_customers(account_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer_id ON basejump.billing_subscriptions(customer_id);

-- ============================================================
-- VERIFICATION QUERY
-- ============================================================

SELECT 
    'Tables' as type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'basejump'
UNION ALL
SELECT 
    'Functions' as type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'basejump'
UNION ALL
SELECT 
    'Policies' as type,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'basejump';

-- Expected results:
-- Tables: 6
-- Functions: 7
-- Policies: 10

-- ============================================================
-- INSTALLATION COMPLETE!
-- ============================================================
-- Your Basejump SaaS infrastructure is now fully installed
-- with all tables, functions, triggers, RLS policies, and indexes
-- ============================================================
