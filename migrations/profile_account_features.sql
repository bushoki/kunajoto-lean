-- Migration: Profile Account Features
-- Description: Add storage bucket for avatars, RPC functions for user data operations, and GDPR compliance

-- ============================================================================
-- 1. STORAGE BUCKET FOR USER AVATARS
-- ============================================================================

-- Create storage bucket for user avatars (if not exists)
-- Note: This needs to be done via Supabase Dashboard or API, not SQL
-- But we'll create the policies here

-- Storage policies for user-avatars bucket
-- Users can upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Anyone can view avatars (public read)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- ============================================================================
-- 2. RPC FUNCTION: UPDATE USER ACCOUNT DETAILS
-- ============================================================================

-- Function to update user account details across both tables
CREATE OR REPLACE FUNCTION update_user_account_details(
  p_user_id UUID,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_full_name TEXT;
  v_result JSON;
BEGIN
  -- Check if user is updating their own account
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only update your own account';
  END IF;

  -- Generate full_name from first_name and last_name
  v_full_name := TRIM(CONCAT(p_first_name, ' ', p_last_name));

  -- Update user_profiles table
  UPDATE user_profiles
  SET 
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    full_name = COALESCE(v_full_name, full_name),
    username = COALESCE(p_username, username),
    avatar_url = COALESCE(p_avatar_url, avatar_url)
  WHERE id = p_user_id;

  -- Update users table
  UPDATE users
  SET 
    full_name = COALESCE(v_full_name, full_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    date_of_birth = COALESCE(p_date_of_birth, date_of_birth),
    city = COALESCE(p_city, city),
    country = COALESCE(p_country, country),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'message', 'Account details updated successfully',
    'user_id', p_user_id
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_account_details TO authenticated;

-- ============================================================================
-- 3. RPC FUNCTION: EXPORT USER DATA (GDPR COMPLIANCE)
-- ============================================================================

-- Function to export all user data for GDPR compliance
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if user is exporting their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only export your own data';
  END IF;

  -- Compile all user data into JSON
  SELECT json_build_object(
    'export_date', NOW(),
    'user_id', p_user_id,
    'profile', (SELECT row_to_json(user_profiles.*) FROM user_profiles WHERE id = p_user_id),
    'user_details', (SELECT row_to_json(users.*) FROM users WHERE id = p_user_id),
    'preferences', (SELECT row_to_json(user_preferences.*) FROM user_preferences WHERE user_id = p_user_id),
    'favorites', (SELECT json_agg(row_to_json(favorites.*)) FROM favorites WHERE user_id = p_user_id),
    'check_ins', (SELECT json_agg(row_to_json(check_ins.*)) FROM check_ins WHERE user_id = p_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;

-- ============================================================================
-- 4. RPC FUNCTION: DELETE USER ACCOUNT (GDPR COMPLIANCE)
-- ============================================================================

-- Function to soft delete user account and anonymize data
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Check if user is deleting their own account
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only delete your own account';
  END IF;

  -- Anonymize user data instead of hard delete
  -- This preserves referential integrity while removing personal information
  
  -- Anonymize users table
  UPDATE users
  SET 
    email = 'deleted_' || p_user_id || '@deleted.kunajoto.app',
    full_name = 'Deleted User',
    avatar_url = NULL,
    bio = NULL,
    date_of_birth = NULL,
    city = NULL,
    country = NULL,
    preferences = '{}',
    safety_mode = false,
    trusted_friends = ARRAY[]::uuid[],
    blocked_users = ARRAY[]::uuid[],
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Anonymize user_profiles table
  UPDATE user_profiles
  SET 
    username = NULL,
    full_name = 'Deleted User',
    first_name = NULL,
    last_name = NULL,
    avatar_url = NULL,
    preferences = NULL
  WHERE id = p_user_id;

  -- Delete user preferences
  DELETE FROM user_preferences WHERE user_id = p_user_id;

  -- Delete favorites
  DELETE FROM favorites WHERE user_id = p_user_id;

  -- Anonymize check-ins (keep for analytics but remove personal data)
  UPDATE check_ins
  SET 
    notes = NULL,
    is_public = false
  WHERE user_id = p_user_id;

  -- Return success result
  v_result := json_build_object(
    'success', true,
    'message', 'Account deleted successfully',
    'user_id', p_user_id
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;

-- ============================================================================
-- 5. TABLE: ACCOUNT DELETION REQUESTS (Optional)
-- ============================================================================

-- Table to track account deletion requests for admin review
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS on account_deletion_requests
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_deletion_requests
CREATE POLICY "Users can create their own deletion requests"
ON account_deletion_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests"
ON account_deletion_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deletion requests"
ON account_deletion_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND default_role IN ('super_admin', 'app_admin')
  )
);

CREATE POLICY "Admins can update deletion requests"
ON account_deletion_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND default_role IN ('super_admin', 'app_admin')
  )
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;

-- Index on country for analytics
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country) WHERE country IS NOT NULL;

-- Index on account deletion requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user_id ON account_deletion_requests(user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON FUNCTION update_user_account_details IS 'Updates user account details across user_profiles and users tables';
COMMENT ON FUNCTION export_user_data IS 'Exports all user data for GDPR compliance';
COMMENT ON FUNCTION delete_user_account IS 'Soft deletes user account and anonymizes personal data for GDPR compliance';
COMMENT ON TABLE account_deletion_requests IS 'Tracks user account deletion requests for admin review';
