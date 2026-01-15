-- =====================================================
-- KUNAJOTO ROLE SYSTEM MIGRATION
-- Integration with Basejump SaaS Kit
-- Date: December 12, 2025
-- =====================================================

-- This migration creates a comprehensive role-based access control system
-- with 4 roles: Super Admin, App Admin, Venue Manager, Guest

BEGIN;

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- 1.1 user_roles: Primary role assignment for each user
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'app_admin', 'venue_manager', 'guest')),
    is_premium BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_account_id ON public.user_roles(account_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

COMMENT ON TABLE public.user_roles IS 'Stores role assignments for users within account contexts';
COMMENT ON COLUMN public.user_roles.role IS 'User role: super_admin, app_admin, venue_manager, or guest';
COMMENT ON COLUMN public.user_roles.is_premium IS 'Premium subscription status for enhanced features';

-- 1.2 venue_manager_applications: Venue manager verification requests
CREATE TABLE IF NOT EXISTS public.venue_manager_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    business_phone TEXT,
    proof_document_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_venue_manager_apps_user_id ON public.venue_manager_applications(user_id);
CREATE INDEX idx_venue_manager_apps_venue_id ON public.venue_manager_applications(venue_id);
CREATE INDEX idx_venue_manager_apps_status ON public.venue_manager_applications(status);

COMMENT ON TABLE public.venue_manager_applications IS 'Tracks venue manager verification applications';
COMMENT ON COLUMN public.venue_manager_applications.status IS 'Application status: pending, approved, or rejected';

-- 1.3 venue_managers: Links approved managers to their venues
CREATE TABLE IF NOT EXISTS public.venue_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{"can_edit": true, "can_respond_reviews": true, "can_view_analytics": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_venue_managers_user_id ON public.venue_managers(user_id);
CREATE INDEX idx_venue_managers_venue_id ON public.venue_managers(venue_id);

COMMENT ON TABLE public.venue_managers IS 'Links approved venue managers to their venues';
COMMENT ON COLUMN public.venue_managers.is_primary IS 'Whether this is the primary manager for the venue';
COMMENT ON COLUMN public.venue_managers.permissions IS 'Granular permissions for this manager';

-- 1.4 admin_permissions: Granular permissions for app admins
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '{
        "can_approve_managers": true,
        "can_moderate_content": true,
        "can_view_analytics": true,
        "can_manage_data_ingestion": true,
        "can_manage_users": false,
        "can_manage_billing": false,
        "can_configure_system": false
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_admin_permissions_user_id ON public.admin_permissions(user_id);

COMMENT ON TABLE public.admin_permissions IS 'Granular permissions for app admin users';
COMMENT ON COLUMN public.admin_permissions.permissions IS 'JSONB object with boolean permission flags';

-- =====================================================
-- 2. UPDATE EXISTING TABLES
-- =====================================================

-- 2.1 Add role columns to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS default_role TEXT DEFAULT 'guest' CHECK (default_role IN ('super_admin', 'app_admin', 'venue_manager', 'guest')),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_default_role ON public.user_profiles(default_role);

COMMENT ON COLUMN public.user_profiles.default_role IS 'User''s default role across the platform';
COMMENT ON COLUMN public.user_profiles.is_premium IS 'Premium subscription status';

-- =====================================================
-- 3. CREATE FUNCTIONS
-- =====================================================

-- 3.1 get_user_role: Get user's role for account context
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_account_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, basejump
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- If account_id provided, get role for that account
    IF p_account_id IS NOT NULL THEN
        SELECT role INTO v_role
        FROM public.user_roles
        WHERE user_id = p_user_id AND account_id = p_account_id;
    END IF;
    
    -- If no account-specific role, get default role
    IF v_role IS NULL THEN
        SELECT default_role INTO v_role
        FROM public.user_profiles
        WHERE id = p_user_id;
    END IF;
    
    -- Default to guest if no role found
    RETURN COALESCE(v_role, 'guest');
END;
$$;

COMMENT ON FUNCTION public.get_user_role IS 'Returns user role for account context or default role';

-- 3.2 is_super_admin: Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND default_role = 'super_admin'
    );
END;
$$;

COMMENT ON FUNCTION public.is_super_admin IS 'Returns true if user is a super admin';

-- 3.3 is_app_admin: Check if user is app admin
CREATE OR REPLACE FUNCTION public.is_app_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND default_role = 'app_admin'
    );
END;
$$;

COMMENT ON FUNCTION public.is_app_admin IS 'Returns true if user is an app admin';

-- 3.4 is_venue_manager: Check if user manages venue(s)
CREATE OR REPLACE FUNCTION public.is_venue_manager(p_user_id UUID, p_venue_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_venue_id IS NOT NULL THEN
        -- Check if user manages this specific venue
        RETURN EXISTS (
            SELECT 1 FROM public.venue_managers
            WHERE user_id = p_user_id AND venue_id = p_venue_id
        );
    ELSE
        -- Check if user is a venue manager at all
        RETURN EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = p_user_id AND default_role = 'venue_manager'
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION public.is_venue_manager IS 'Returns true if user manages specified venue or any venue';

-- 3.5 has_admin_permission: Check admin permission
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_permissions JSONB;
BEGIN
    -- Super admins have all permissions
    IF public.is_super_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check app admin permissions
    SELECT permissions INTO v_permissions
    FROM public.admin_permissions
    WHERE user_id = p_user_id;
    
    IF v_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE((v_permissions->>p_permission)::BOOLEAN, FALSE);
END;
$$;

COMMENT ON FUNCTION public.has_admin_permission IS 'Returns true if user has specified admin permission';

-- 3.6 apply_for_venue_manager: Submit venue manager application
CREATE OR REPLACE FUNCTION public.apply_for_venue_manager(
    p_venue_id UUID,
    p_business_name TEXT,
    p_business_email TEXT,
    p_business_phone TEXT DEFAULT NULL,
    p_proof_document_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_application_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user already has pending/approved application for this venue
    IF EXISTS (
        SELECT 1 FROM public.venue_manager_applications
        WHERE user_id = v_user_id 
        AND venue_id = p_venue_id 
        AND status IN ('pending', 'approved')
    ) THEN
        RAISE EXCEPTION 'You already have an active application for this venue';
    END IF;
    
    -- Create application
    INSERT INTO public.venue_manager_applications (
        user_id,
        venue_id,
        business_name,
        business_email,
        business_phone,
        proof_document_url,
        status
    ) VALUES (
        v_user_id,
        p_venue_id,
        p_business_name,
        p_business_email,
        p_business_phone,
        p_proof_document_url,
        'pending'
    ) RETURNING id INTO v_application_id;
    
    RETURN v_application_id;
END;
$$;

COMMENT ON FUNCTION public.apply_for_venue_manager IS 'Submit venue manager application';

-- 3.7 approve_venue_manager: Approve venue manager application
CREATE OR REPLACE FUNCTION public.approve_venue_manager(p_application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, basejump
AS $$
DECLARE
    v_app RECORD;
    v_reviewer_id UUID;
    v_account_id UUID;
BEGIN
    v_reviewer_id := auth.uid();
    
    IF v_reviewer_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user has permission
    IF NOT public.has_admin_permission(v_reviewer_id, 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions to approve venue managers';
    END IF;
    
    -- Get application details
    SELECT * INTO v_app
    FROM public.venue_manager_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;
    
    IF v_app.status != 'pending' THEN
        RAISE EXCEPTION 'Application is not pending (current status: %)', v_app.status;
    END IF;
    
    -- Update application status
    UPDATE public.venue_manager_applications
    SET status = 'approved',
        reviewed_by = v_reviewer_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_application_id;
    
    -- Create venue manager record
    INSERT INTO public.venue_managers (user_id, venue_id, is_primary)
    VALUES (v_app.user_id, v_app.venue_id, TRUE)
    ON CONFLICT (user_id, venue_id) DO NOTHING;
    
    -- Update user role if not already venue manager or higher
    UPDATE public.user_profiles
    SET default_role = 'venue_manager',
        updated_at = NOW()
    WHERE id = v_app.user_id 
    AND default_role = 'guest';
    
    -- Get user's personal account
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = v_app.user_id
    AND personal_account = TRUE
    LIMIT 1;
    
    -- Create user_role record if account exists
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (v_app.user_id, v_account_id, 'venue_manager', NOW(), v_reviewer_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'venue_manager', 
            approved_at = NOW(), 
            approved_by = v_reviewer_id,
            updated_at = NOW();
    END IF;
END;
$$;

COMMENT ON FUNCTION public.approve_venue_manager IS 'Approve venue manager application (admin only)';

-- 3.8 reject_venue_manager: Reject venue manager application
CREATE OR REPLACE FUNCTION public.reject_venue_manager(
    p_application_id UUID,
    p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_reviewer_id UUID;
BEGIN
    v_reviewer_id := auth.uid();
    
    IF v_reviewer_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user has permission
    IF NOT public.has_admin_permission(v_reviewer_id, 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions to reject venue managers';
    END IF;
    
    -- Update application status
    UPDATE public.venue_manager_applications
    SET status = 'rejected',
        reviewed_by = v_reviewer_id,
        reviewed_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not pending';
    END IF;
END;
$$;

COMMENT ON FUNCTION public.reject_venue_manager IS 'Reject venue manager application (admin only)';

-- 3.9 get_user_managed_venues: Get venues managed by user
CREATE OR REPLACE FUNCTION public.get_user_managed_venues(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    venue_id UUID,
    venue_name TEXT,
    is_primary BOOLEAN,
    permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    RETURN QUERY
    SELECT 
        vm.venue_id,
        v.name AS venue_name,
        vm.is_primary,
        vm.permissions
    FROM public.venue_managers vm
    JOIN public.venues v ON v.id = vm.venue_id
    WHERE vm.user_id = v_user_id
    ORDER BY vm.is_primary DESC, v.name;
END;
$$;

COMMENT ON FUNCTION public.get_user_managed_venues IS 'Returns list of venues managed by user';

-- 3.10 promote_to_app_admin: Promote user to app admin
CREATE OR REPLACE FUNCTION public.promote_to_app_admin(
    p_user_id UUID,
    p_permissions JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, basejump
AS $$
DECLARE
    v_promoter_id UUID;
    v_account_id UUID;
    v_default_permissions JSONB;
BEGIN
    v_promoter_id := auth.uid();
    
    IF v_promoter_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Only super admins can promote to app admin
    IF NOT public.is_super_admin(v_promoter_id) THEN
        RAISE EXCEPTION 'Only super admins can promote users to app admin';
    END IF;
    
    -- Set default permissions if not provided
    v_default_permissions := COALESCE(p_permissions, '{
        "can_approve_managers": true,
        "can_moderate_content": true,
        "can_view_analytics": true,
        "can_manage_data_ingestion": true,
        "can_manage_users": false,
        "can_manage_billing": false,
        "can_configure_system": false
    }'::jsonb);
    
    -- Update user profile
    UPDATE public.user_profiles
    SET default_role = 'app_admin',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Create admin permissions
    INSERT INTO public.admin_permissions (user_id, permissions)
    VALUES (p_user_id, v_default_permissions)
    ON CONFLICT (user_id) DO UPDATE
    SET permissions = v_default_permissions,
        updated_at = NOW();
    
    -- Get user's personal account
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = p_user_id
    AND personal_account = TRUE
    LIMIT 1;
    
    -- Update user_role record if account exists
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (p_user_id, v_account_id, 'app_admin', NOW(), v_promoter_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'app_admin',
            approved_at = NOW(),
            approved_by = v_promoter_id,
            updated_at = NOW();
    END IF;
END;
$$;

COMMENT ON FUNCTION public.promote_to_app_admin IS 'Promote user to app admin role (super admin only)';

-- 3.11 promote_to_super_admin: Promote user to super admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, basejump
AS $$
DECLARE
    v_promoter_id UUID;
    v_account_id UUID;
BEGIN
    v_promoter_id := auth.uid();
    
    IF v_promoter_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Only existing super admins can promote to super admin
    IF NOT public.is_super_admin(v_promoter_id) THEN
        RAISE EXCEPTION 'Only super admins can promote users to super admin';
    END IF;
    
    -- Update user profile
    UPDATE public.user_profiles
    SET default_role = 'super_admin',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get user's personal account
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = p_user_id
    AND personal_account = TRUE
    LIMIT 1;
    
    -- Update user_role record if account exists
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (p_user_id, v_account_id, 'super_admin', NOW(), v_promoter_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'super_admin',
            approved_at = NOW(),
            approved_by = v_promoter_id,
            updated_at = NOW();
    END IF;
END;
$$;

COMMENT ON FUNCTION public.promote_to_super_admin IS 'Promote user to super admin role (super admin only)';

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- 4.1 Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to all role tables
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_manager_apps_updated_at
    BEFORE UPDATE ON public.venue_manager_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_venue_managers_updated_at
    BEFORE UPDATE ON public.venue_managers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON public.admin_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4.2 Trigger to auto-create user_role on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, basejump
AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Get the user's personal account (created by Basejump)
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = NEW.id
    AND personal_account = TRUE
    LIMIT 1;
    
    -- If account exists, create default guest role
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role)
        VALUES (NEW.id, v_account_id, 'guest')
        ON CONFLICT (user_id, account_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on user_profiles insert
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_role();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- 5.1 user_roles table policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.is_app_admin(auth.uid())
);

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_super_admin(auth.uid()));

-- 5.2 venue_manager_applications table policies
ALTER TABLE public.venue_manager_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own applications" ON public.venue_manager_applications;
CREATE POLICY "Users can view own applications"
ON public.venue_manager_applications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create applications" ON public.venue_manager_applications;
CREATE POLICY "Users can create applications"
ON public.venue_manager_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.venue_manager_applications;
CREATE POLICY "Admins can view all applications"
ON public.venue_manager_applications FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);

DROP POLICY IF EXISTS "Admins can update applications" ON public.venue_manager_applications;
CREATE POLICY "Admins can update applications"
ON public.venue_manager_applications FOR UPDATE
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);

-- 5.3 venue_managers table policies
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers can view own venues" ON public.venue_managers;
CREATE POLICY "Managers can view own venues"
ON public.venue_managers FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all venue managers" ON public.venue_managers;
CREATE POLICY "Admins can view all venue managers"
ON public.venue_managers FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.is_app_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage venue managers" ON public.venue_managers;
CREATE POLICY "Admins can manage venue managers"
ON public.venue_managers FOR ALL
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);

-- 5.4 admin_permissions table policies
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view own permissions" ON public.admin_permissions;
CREATE POLICY "Admins can view own permissions"
ON public.admin_permissions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can view all permissions" ON public.admin_permissions;
CREATE POLICY "Super admins can view all permissions"
ON public.admin_permissions FOR SELECT
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.admin_permissions;
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions FOR ALL
USING (public.is_super_admin(auth.uid()));

-- =====================================================
-- 6. INITIALIZE EXISTING USERS
-- =====================================================

-- Set all existing users without a role to 'guest'
UPDATE public.user_profiles
SET default_role = 'guest'
WHERE default_role IS NULL;

-- Create user_roles for all existing users with personal accounts
INSERT INTO public.user_roles (user_id, account_id, role)
SELECT 
    up.id AS user_id,
    a.id AS account_id,
    COALESCE(up.default_role, 'guest') AS role
FROM public.user_profiles up
JOIN basejump.accounts a ON a.primary_owner_user_id = up.id
WHERE a.personal_account = TRUE
ON CONFLICT (user_id, account_id) DO NOTHING;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_for_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_managed_venues TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_app_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin TO authenticated;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify installation
DO $$
BEGIN
    RAISE NOTICE '✅ Role system migration completed successfully!';
    RAISE NOTICE 'Tables created: user_roles, venue_manager_applications, venue_managers, admin_permissions';
    RAISE NOTICE 'Functions created: 11 role management functions';
    RAISE NOTICE 'Triggers created: 5 update triggers + 1 new user trigger';
    RAISE NOTICE 'RLS policies created: 13 security policies';
    RAISE NOTICE 'Next step: Promote initial super admin user';
END $$;
