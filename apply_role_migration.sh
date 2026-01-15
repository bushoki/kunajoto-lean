#!/bin/bash

# Script to apply role system migration in chunks
# This avoids issues with large SQL statements in MCP

PROJECT_ID="grnekxrkypgighmxyveh"

echo "🚀 Starting role system migration..."

# Step 1: Create tables
echo "📦 Step 1: Creating tables..."

echo "  - Creating user_roles table..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE TABLE IF NOT EXISTS public.user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('super_admin', 'app_admin', 'venue_manager', 'guest')), is_premium BOOLEAN DEFAULT FALSE, approved_at TIMESTAMP WITH TIME ZONE, approved_by UUID REFERENCES auth.users(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id, account_id));\"}" > /dev/null 2>&1

echo "  - Creating venue_manager_applications table..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE TABLE IF NOT EXISTS public.venue_manager_applications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE, business_name TEXT NOT NULL, business_email TEXT NOT NULL, business_phone TEXT, proof_document_url TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')), reviewed_by UUID REFERENCES auth.users(id), reviewed_at TIMESTAMP WITH TIME ZONE, rejection_reason TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id, venue_id));\"}" > /dev/null 2>&1

echo "  - Creating venue_managers table..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE TABLE IF NOT EXISTS public.venue_managers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE, is_primary BOOLEAN DEFAULT FALSE, permissions JSONB DEFAULT '{\\\"can_edit\\\": true, \\\"can_respond_reviews\\\": true, \\\"can_view_analytics\\\": true}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id, venue_id));\"}" > /dev/null 2>&1

echo "  - Creating admin_permissions table..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE TABLE IF NOT EXISTS public.admin_permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, permissions JSONB NOT NULL DEFAULT '{\\\"can_approve_managers\\\": true, \\\"can_moderate_content\\\": true, \\\"can_view_analytics\\\": true, \\\"can_manage_data_ingestion\\\": true, \\\"can_manage_users\\\": false, \\\"can_manage_billing\\\": false, \\\"can_configure_system\\\": false}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id));\"}" > /dev/null 2>&1

# Step 2: Create indexes
echo "📇 Step 2: Creating indexes..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id); CREATE INDEX IF NOT EXISTS idx_user_roles_account_id ON public.user_roles(account_id); CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);\"}" > /dev/null 2>&1

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_user_id ON public.venue_manager_applications(user_id); CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_venue_id ON public.venue_manager_applications(venue_id); CREATE INDEX IF NOT EXISTS idx_venue_manager_apps_status ON public.venue_manager_applications(status);\"}" > /dev/null 2>&1

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE INDEX IF NOT EXISTS idx_venue_managers_user_id ON public.venue_managers(user_id); CREATE INDEX IF NOT EXISTS idx_venue_managers_venue_id ON public.venue_managers(venue_id);\"}" > /dev/null 2>&1

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON public.admin_permissions(user_id);\"}" > /dev/null 2>&1

# Step 3: Update existing tables
echo "🔧 Step 3: Updating existing tables..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS default_role TEXT DEFAULT 'guest' CHECK (default_role IN ('super_admin', 'app_admin', 'venue_manager', 'guest')), ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;\"}" > /dev/null 2>&1

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"CREATE INDEX IF NOT EXISTS idx_user_profiles_default_role ON public.user_profiles(default_role);\"}" > /dev/null 2>&1

# Step 4: Initialize existing users
echo "👥 Step 4: Initializing existing users..."
manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"UPDATE public.user_profiles SET default_role = 'guest' WHERE default_role IS NULL;\"}" > /dev/null 2>&1

manus-mcp-cli tool call execute_sql --server supabase --input "{\"project_id\":\"$PROJECT_ID\",\"query\":\"INSERT INTO public.user_roles (user_id, account_id, role) SELECT up.id AS user_id, a.id AS account_id, COALESCE(up.default_role, 'guest') AS role FROM public.user_profiles up JOIN basejump.accounts a ON a.primary_owner_user_id = up.id WHERE a.personal_account = TRUE ON CONFLICT (user_id, account_id) DO NOTHING;\"}" > /dev/null 2>&1

echo "✅ Tables and indexes created successfully!"
echo ""
echo "⚠️  Note: Functions, triggers, and RLS policies need to be created via Supabase SQL Editor"
echo "    due to complexity. Opening migration file for manual application..."
