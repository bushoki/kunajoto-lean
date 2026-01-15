# Kunajoto Role System Design
## Integration with Basejump SaaS Kit

**Date**: December 12, 2025  
**Status**: Design Phase  
**Database**: Production Supabase (grnekxrkypgighmxyveh)  
**Branch**: ux-development5-preferences2

---

## Executive Summary

This document outlines the comprehensive role-based access control (RBAC) system for Kunajoto, integrating Basejump's account management with Kunajoto's specific role requirements. The system supports four distinct roles with granular permissions while leveraging Basejump's existing infrastructure for teams, billing, and invitations.

---

## 1. Role Definitions

Based on the app blueprints, Kunajoto requires four distinct user roles:

### 1.1 Super Admin
- **Purpose**: App owners with full system control
- **Count**: Limited (catalystcongo@gmail.com + designated owners)
- **Access**: Full dashboard, all features, all data
- **Key Powers**:
  - Manage all users and roles
  - Configure system settings (vibe score weights, AI timeouts, data sources)
  - Approve/reject venue managers
  - Control feature flags and A/B tests
  - Access analytics and monitoring
  - Manage billing and subscriptions
  - Geographic restrictions management
  - Push notification controls

### 1.2 App Admin
- **Purpose**: Managers appointed by super admins
- **Count**: Multiple allowed
- **Access**: Partial/segmented dashboard access
- **Key Powers**:
  - Review and approve venue manager applications
  - Manage content moderation (reviews, reports)
  - View analytics (read-only)
  - Manage data ingestion queue
  - Cannot modify system configuration
  - Cannot manage other admins
  - Cannot access billing

### 1.3 Venue Manager
- **Purpose**: Venue owners/operators managing their locations
- **Count**: Unlimited (requires admin approval)
- **Access**: Venue Dashboard (single or multi-location)
- **Key Powers**:
  - Claim and verify venue ownership
  - Update venue details (hours, photos, description)
  - View bookings, check-ins, and plans
  - Respond to reviews
  - View venue analytics
  - **Premium Managers**: Manage multiple locations
- **Restrictions**:
  - Can only access their own venue(s)
  - Requires admin approval before activation
  - Cannot access other venues' data

### 1.4 Guest/Reveller
- **Purpose**: End users consuming nightlife content
- **Count**: Unlimited (default role)
- **Access**: Mobile app features
- **Key Powers**:
  - View map and vibe scores
  - Search and filter venues
  - Check in to venues
  - Write reviews and ratings
  - Save favorites
  - Create itineraries
  - Book venues
  - **Premium Guests**: Access AI-powered itineraries
- **Restrictions**:
  - Cannot access dashboards
  - Cannot manage venues
  - Cannot moderate content

---

## 2. Database Schema Design

### 2.1 New Tables

#### `user_roles` Table
Stores the primary role assignment for each user. Integrates with Basejump accounts.

```sql
CREATE TABLE public.user_roles (
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
```

#### `venue_manager_applications` Table
Tracks venue manager verification requests.

```sql
CREATE TABLE public.venue_manager_applications (
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
```

#### `venue_managers` Table
Links approved venue managers to their venues.

```sql
CREATE TABLE public.venue_managers (
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
```

#### `admin_permissions` Table
Granular permissions for app admins (segmented access).

```sql
CREATE TABLE public.admin_permissions (
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
```

### 2.2 Modified Existing Tables

#### Update `user_profiles` Table
Add role reference and premium status.

```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS default_role TEXT DEFAULT 'guest' CHECK (default_role IN ('super_admin', 'app_admin', 'venue_manager', 'guest')),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_default_role ON public.user_profiles(default_role);
```

---

## 3. Database Functions

### 3.1 Role Management Functions

#### `get_user_role(user_id UUID, account_id UUID)`
Returns the user's role for a specific account context.

```sql
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_account_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- If account_id provided, get role for that account
    IF p_account_id IS NOT NULL THEN
        SELECT role INTO v_role
        FROM public.user_roles
        WHERE user_id = p_user_id AND account_id = p_account_id;
    ELSE
        -- Get default role from user_profiles
        SELECT default_role INTO v_role
        FROM public.user_profiles
        WHERE id = p_user_id;
    END IF;
    
    -- Default to guest if no role found
    RETURN COALESCE(v_role, 'guest');
END;
$$;
```

#### `is_super_admin(user_id UUID)`
Checks if user is a super admin.

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND default_role = 'super_admin'
    );
END;
$$;
```

#### `is_app_admin(user_id UUID)`
Checks if user is an app admin.

```sql
CREATE OR REPLACE FUNCTION public.is_app_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = p_user_id AND default_role = 'app_admin'
    );
END;
$$;
```

#### `is_venue_manager(user_id UUID, venue_id UUID)`
Checks if user manages a specific venue.

```sql
CREATE OR REPLACE FUNCTION public.is_venue_manager(p_user_id UUID, p_venue_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
```

#### `has_admin_permission(user_id UUID, permission TEXT)`
Checks if app admin has specific permission.

```sql
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
```

### 3.2 Venue Manager Application Functions

#### `apply_for_venue_manager(venue_id UUID, business_details JSONB)`
Submit venue manager application.

```sql
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
AS $$
DECLARE
    v_application_id UUID;
BEGIN
    -- Check if user already has pending/approved application for this venue
    IF EXISTS (
        SELECT 1 FROM public.venue_manager_applications
        WHERE user_id = auth.uid() 
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
        auth.uid(),
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
```

#### `approve_venue_manager(application_id UUID)`
Approve venue manager application (admin only).

```sql
CREATE OR REPLACE FUNCTION public.approve_venue_manager(p_application_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_app RECORD;
BEGIN
    -- Check if user has permission
    IF NOT public.has_admin_permission(auth.uid(), 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    -- Get application details
    SELECT * INTO v_app
    FROM public.venue_manager_applications
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;
    
    IF v_app.status != 'pending' THEN
        RAISE EXCEPTION 'Application is not pending';
    END IF;
    
    -- Update application status
    UPDATE public.venue_manager_applications
    SET status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = NOW()
    WHERE id = p_application_id;
    
    -- Create venue manager record
    INSERT INTO public.venue_managers (user_id, venue_id, is_primary)
    VALUES (v_app.user_id, v_app.venue_id, TRUE)
    ON CONFLICT (user_id, venue_id) DO NOTHING;
    
    -- Update user role if not already venue manager
    UPDATE public.user_profiles
    SET default_role = 'venue_manager'
    WHERE id = v_app.user_id AND default_role = 'guest';
    
    -- Create user_role record
    INSERT INTO public.user_roles (user_id, account_id, role, approved_at, approved_by)
    SELECT v_app.user_id, a.id, 'venue_manager', NOW(), auth.uid()
    FROM basejump.accounts a
    WHERE a.primary_owner_user_id = v_app.user_id
    ON CONFLICT (user_id, account_id) DO UPDATE
    SET role = 'venue_manager', approved_at = NOW(), approved_by = auth.uid();
END;
$$;
```

#### `reject_venue_manager(application_id UUID, reason TEXT)`
Reject venue manager application (admin only).

```sql
CREATE OR REPLACE FUNCTION public.reject_venue_manager(
    p_application_id UUID,
    p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Check if user has permission
    IF NOT public.has_admin_permission(auth.uid(), 'can_approve_managers') THEN
        RAISE EXCEPTION 'Insufficient permissions';
    END IF;
    
    -- Update application status
    UPDATE public.venue_manager_applications
    SET status = 'rejected',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        rejection_reason = p_reason
    WHERE id = p_application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not pending';
    END IF;
END;
$$;
```

---

## 4. Row Level Security (RLS) Policies

### 4.1 user_roles Table Policies

```sql
-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.is_app_admin(auth.uid())
);

-- Only super admins can insert/update/delete roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.is_super_admin(auth.uid()));
```

### 4.2 venue_manager_applications Table Policies

```sql
-- Enable RLS
ALTER TABLE public.venue_manager_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
ON public.venue_manager_applications FOR SELECT
USING (auth.uid() = user_id);

-- Users can create applications
CREATE POLICY "Users can create applications"
ON public.venue_manager_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.venue_manager_applications FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);

-- Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications"
ON public.venue_manager_applications FOR UPDATE
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);
```

### 4.3 venue_managers Table Policies

```sql
-- Enable RLS
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;

-- Venue managers can view their own venues
CREATE POLICY "Managers can view own venues"
ON public.venue_managers FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all venue managers
CREATE POLICY "Admins can view all venue managers"
ON public.venue_managers FOR SELECT
USING (
    public.is_super_admin(auth.uid()) OR 
    public.is_app_admin(auth.uid())
);

-- Only admins can insert/update/delete venue managers
CREATE POLICY "Admins can manage venue managers"
ON public.venue_managers FOR ALL
USING (
    public.is_super_admin(auth.uid()) OR 
    public.has_admin_permission(auth.uid(), 'can_approve_managers')
);
```

### 4.4 admin_permissions Table Policies

```sql
-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- App admins can view their own permissions
CREATE POLICY "Admins can view own permissions"
ON public.admin_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can view all permissions
CREATE POLICY "Super admins can view all permissions"
ON public.admin_permissions FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
ON public.admin_permissions FOR ALL
USING (public.is_super_admin(auth.uid()));
```

---

## 5. Integration with Basejump

### 5.1 Account-Role Mapping

Basejump provides account management, but Kunajoto needs custom roles. The integration strategy:

1. **Personal Accounts**: Every user gets a personal Basejump account (via `handle_new_user()` trigger)
2. **Role Assignment**: User's primary role stored in `user_profiles.default_role`
3. **Account Context**: When user acts within a team/account context, role from `user_roles` table is used
4. **Premium Status**: Linked to Basejump billing subscriptions

### 5.2 Basejump Account Roles vs Kunajoto Roles

| Basejump Role | Kunajoto Role | Use Case |
|---------------|---------------|----------|
| `owner` | `super_admin` | App owners managing the platform |
| `owner` | `venue_manager` | Venue owner managing their business |
| `member` | `app_admin` | Team member with admin privileges |
| `member` | `guest` | Team member with standard access |

### 5.3 Team Features

Basejump teams enable:
- **Shared Itineraries**: Teams can collaborate on nightlife plans
- **Venue Management Teams**: Multiple managers for a single venue
- **Admin Teams**: Super admins can invite app admins to management team

---

## 6. Implementation Phases

### Phase 1: Core Role Infrastructure (Current)
- ✅ Create role tables and functions
- ✅ Implement RLS policies
- ✅ Set up venue manager application workflow
- ✅ Integrate with Basejump accounts

### Phase 2: Frontend Integration
- Update React app to check user roles
- Implement role-based navigation
- Add venue manager application UI
- Create admin approval interface

### Phase 3: Dashboard Development
- Super admin dashboard (full control)
- App admin dashboard (limited access)
- Venue manager dashboard (venue-specific)

### Phase 4: Premium Features
- Link premium status to Basejump billing
- Implement premium-only features (AI itineraries, multi-venue management)
- Add subscription management UI

---

## 7. Security Considerations

### 7.1 Role Elevation Prevention
- Users cannot self-promote to admin roles
- All role changes require super admin approval
- Audit trail for all role modifications

### 7.2 Venue Manager Verification
- Proof of ownership required
- Admin approval mandatory
- Periodic re-verification for active managers

### 7.3 Data Access Controls
- Venue managers can only access their venues
- App admins have read-only analytics access
- Super admins have full access with audit logging

---

## 8. Testing Strategy

### 8.1 Role Assignment Tests
- ✅ Verify new users default to 'guest' role
- Test role promotion workflows
- Verify RLS policies block unauthorized access

### 8.2 Venue Manager Tests
- Test application submission
- Test approval workflow
- Test rejection workflow
- Verify venue access restrictions

### 8.3 Permission Tests
- Test each admin permission flag
- Verify super admin override
- Test permission inheritance

---

## 9. Migration Plan

### 9.1 Existing Users
- Set all existing users to 'guest' role
- Manually promote catalystcongo@gmail.com to 'super_admin'
- Create personal accounts for all users (already done)

### 9.2 Existing Data
- Link existing venues to potential managers
- Migrate any existing admin users
- Preserve all user preferences and favorites

---

## 10. Next Steps

1. **Create SQL migration file** with all tables, functions, and policies
2. **Apply migration** to production database
3. **Test role system** with existing users
4. **Update React app** to use role-based access
5. **Implement venue manager application UI**
6. **Create admin dashboard** for approvals
7. **Link premium features** to Basejump billing

---

## Appendix A: Role Permission Matrix

| Feature | Guest | Venue Manager | App Admin | Super Admin |
|---------|-------|---------------|-----------|-------------|
| View map & scores | ✅ | ✅ | ✅ | ✅ |
| Check-in | ✅ | ✅ | ✅ | ✅ |
| Write reviews | ✅ | ✅ | ✅ | ✅ |
| Save favorites | ✅ | ✅ | ✅ | ✅ |
| Create itineraries | ✅ | ✅ | ✅ | ✅ |
| AI itineraries | Premium | Premium | ✅ | ✅ |
| Manage own venue | ❌ | ✅ | ❌ | ✅ |
| Manage multiple venues | ❌ | Premium | ❌ | ✅ |
| Approve managers | ❌ | ❌ | ✅ | ✅ |
| Moderate content | ❌ | ❌ | ✅ | ✅ |
| View analytics | ❌ | Own venue | All venues | All venues |
| Configure system | ❌ | ❌ | ❌ | ✅ |
| Manage billing | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

---

**End of Document**
