-- =====================================================
-- KUNAJOTO ROLE SYSTEM - COMPLETE MIGRATION
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- Step 1: Create missing tables
CREATE TABLE IF NOT EXISTS public.venue_manager_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    business_phone TEXT,
    proof_document_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, venue_id),
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.venue_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{"can_edit": true, "can_respond_reviews": true, "can_view_analytics": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_user_id ON public.venue_manager_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_venue_id ON public.venue_manager_applications(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_status ON public.venue_manager_applications(status);
CREATE INDEX IF NOT EXISTS idx_venue_managers_user_id ON public.venue_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_venue_managers_venue_id ON public.venue_managers(venue_id);

-- Step 3: Create role checking functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_account_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, basejump
AS $$
DECLARE
    v_role TEXT;
BEGIN
    IF p_account_id IS NOT NULL THEN
        SELECT role INTO v_role
        FROM public.user_roles
        WHERE user_id = p_user_id AND account_id = p_account_id;
    END IF;
    
    IF v_role IS NULL THEN
        SELECT default_role INTO v_role
        FROM public.user_profiles
        WHERE id = p_user_id;
    END IF;
    
    RETURN COALESCE(v_role, 'guest');
END;
$$;

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

CREATE OR REPLACE FUNCTION public.is_venue_manager(p_user_id UUID, p_venue_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_venue_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.venue_managers
            WHERE user_id = p_user_id AND venue_id = p_venue_id
        );
    ELSE
        RETURN EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = p_user_id AND default_role = 'venue_manager'
        );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_permissions JSONB;
BEGIN
    IF public.is_super_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;
    
    SELECT permissions INTO v_permissions
    FROM public.admin_permissions
    WHERE user_id = p_user_id;
    
    IF v_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN COALESCE((v_permissions->>p_permission)::BOOLEAN, FALSE);
END;
$$;

-- Step 4: Create venue manager application functions
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
    
    IF EXISTS (
        SELECT 1 FROM public.venue_manager_applications
        WHERE user_id = v_user_id 
        AND venue_id = p_venue_id 
        AND status IN ('pending', 'approved')
    ) THEN
        RAISE EXCEPTION 'You already have an active application for this venue';
    END IF;
    
    INSERT INTO public.venue_manager_applications (
        user_id, venue_id, business_name, business_email,
        business_phone, proof_document_url, status
    ) VALUES (
        v_user_id, p_venue_id, p_business_name, p_business_email,
        p_business_phone, p_proof_document_url, 'pending'
    ) RETURNING id INTO v_application_id;
    
    RETURN v_application_id;
END;
$$;

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
    
    IF NOT public.has_admin_permission(v_reviewer_id, 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    SELECT * INTO v_app FROM public.venue_manager_applications WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;
    
    IF v_app.status != 'pending' THEN
        RAISE EXCEPTION 'Application is not pending';
    END IF;
    
    UPDATE public.venue_manager_applications
    SET status = 'approved', reviewed_by = v_reviewer_id, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = p_application_id;
    
    INSERT INTO public.venue_managers (user_id, venue_id, is_primary)
    VALUES (v_app.user_id, v_app.venue_id, TRUE)
    ON CONFLICT (user_id, venue_id) DO NOTHING;
    
    UPDATE public.user_profiles
    SET default_role = 'venue_manager', updated_at = NOW()
    WHERE id = v_app.user_id AND default_role = 'guest';
    
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = v_app.user_id AND personal_account = TRUE
    LIMIT 1;
    
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (v_app.user_id, v_account_id, 'venue_manager', NOW(), v_reviewer_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'venue_manager', approved_at = NOW(), approved_by = v_reviewer_id, updated_at = NOW();
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_venue_manager(p_application_id UUID, p_reason TEXT)
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
    
    IF NOT public.has_admin_permission(v_reviewer_id, 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    UPDATE public.venue_manager_applications
    SET status = 'rejected', reviewed_by = v_reviewer_id, reviewed_at = NOW(),
        rejection_reason = p_reason, updated_at = NOW()
    WHERE id = p_application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not pending';
    END IF;
END;
$$;

-- Step 5: Create role promotion functions
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
    
    IF NOT public.is_super_admin(v_promoter_id) THEN
        RAISE EXCEPTION 'Only super admins can promote to super admin';
    END IF;
    
    UPDATE public.user_profiles
    SET default_role = 'super_admin', updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = p_user_id AND personal_account = TRUE
    LIMIT 1;
    
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (p_user_id, v_account_id, 'super_admin', NOW(), v_promoter_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'super_admin', approved_at = NOW(), approved_by = v_promoter_id, updated_at = NOW();
    END IF;
END;
$$;

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
    
    IF NOT public.is_super_admin(v_promoter_id) THEN
        RAISE EXCEPTION 'Only super admins can promote users to app admin';
    END IF;
    
    v_default_permissions := COALESCE(p_permissions, '{
        "can_approve_managers": true,
        "can_moderate_content": true,
        "can_view_analytics": true,
        "can_manage_data_ingestion": true,
        "can_manage_users": false,
        "can_manage_billing": false,
        "can_configure_system": false
    }'::jsonb);
    
    UPDATE public.user_profiles
    SET default_role = 'app_admin', updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    INSERT INTO public.admin_permissions (user_id, permissions)
    VALUES (p_user_id, v_default_permissions)
    ON CONFLICT (user_id) DO UPDATE
    SET permissions = v_default_permissions, updated_at = NOW();
    
    SELECT id INTO v_account_id
    FROM basejump.accounts
    WHERE primary_owner_user_id = p_user_id AND personal_account = TRUE
    LIMIT 1;
    
    IF v_account_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
        VALUES (p_user_id, v_account_id, 'app_admin', NOW(), v_promoter_id)
        ON CONFLICT (user_id, account_id) DO UPDATE
        SET role = 'app_admin', approved_at = NOW(), approved_by = v_promoter_id, updated_at = NOW();
    END IF;
END;
$$;

-- Step 6: Create utility function
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

-- Step 7: Create triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_manager_apps_updated_at ON public.venue_manager_applications;
CREATE TRIGGER update_venue_manager_apps_updated_at
    BEFORE UPDATE ON public.venue_manager_applications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_venue_managers_updated_at ON public.venue_managers;
CREATE TRIGGER update_venue_managers_updated_at
    BEFORE UPDATE ON public.venue_managers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_permissions_updated_at ON public.admin_permissions;
CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON public.admin_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_manager_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT
USING (public.is_super_admin(auth.uid()) OR public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Step 10: Create RLS policies for venue_manager_applications
DROP POLICY IF EXISTS "Users can view own applications" ON public.venue_manager_applications;
CREATE POLICY "Users can view own applications" ON public.venue_manager_applications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create applications" ON public.venue_manager_applications;
CREATE POLICY "Users can create applications" ON public.venue_manager_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all applications" ON public.venue_manager_applications;
CREATE POLICY "Admins can view all applications" ON public.venue_manager_applications FOR SELECT
USING (public.is_super_admin(auth.uid()) OR public.has_admin_permission(auth.uid(), 'can_approve_managers'));

DROP POLICY IF EXISTS "Admins can update applications" ON public.venue_manager_applications;
CREATE POLICY "Admins can update applications" ON public.venue_manager_applications FOR UPDATE
USING (public.is_super_admin(auth.uid()) OR public.has_admin_permission(auth.uid(), 'can_approve_managers'));

-- Step 11: Create RLS policies for venue_managers
DROP POLICY IF EXISTS "Managers can view own venues" ON public.venue_managers;
CREATE POLICY "Managers can view own venues" ON public.venue_managers FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all venue managers" ON public.venue_managers;
CREATE POLICY "Admins can view all venue managers" ON public.venue_managers FOR SELECT
USING (public.is_super_admin(auth.uid()) OR public.is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage venue managers" ON public.venue_managers;
CREATE POLICY "Admins can manage venue managers" ON public.venue_managers FOR ALL
USING (public.is_super_admin(auth.uid()) OR public.has_admin_permission(auth.uid(), 'can_approve_managers'));

-- Step 12: Create RLS policies for admin_permissions
DROP POLICY IF EXISTS "Admins can view own permissions" ON public.admin_permissions;
CREATE POLICY "Admins can view own permissions" ON public.admin_permissions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins can view all permissions" ON public.admin_permissions;
CREATE POLICY "Super admins can view all permissions" ON public.admin_permissions FOR SELECT
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.admin_permissions;
CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Step 13: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_app_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_for_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_venue_manager TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_managed_venues TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_super_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_app_admin TO authenticated;

-- Verification query
SELECT 
    'Role system migration completed!' AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_roles', 'venue_manager_applications', 'venue_managers', 'admin_permissions')) AS tables_created,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%admin%' OR routine_name LIKE '%venue%' OR routine_name LIKE '%role%') AS functions_created;
