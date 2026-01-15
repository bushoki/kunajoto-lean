# Supabase Setup Instructions for Profile Account Features

## Overview
This document provides instructions for setting up the backend infrastructure required for the profile account features, including storage bucket creation and database migrations.

## 1. Create Storage Bucket for User Avatars

The Supabase MCP server doesn't have a direct tool for creating storage buckets, so this needs to be done manually via the Supabase Dashboard or using the Supabase CLI.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/grnekxrkypgighmxyveh
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `user-avatars`
   - **Public**: ✅ Enable (avatars should be publicly accessible)
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
5. Click **Create bucket**

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref grnekxrkypgighmxyveh

# Create the storage bucket
supabase storage create user-avatars --public
```

## 2. Apply Database Migration

The migration file `migrations/profile_account_features.sql` contains all the necessary database changes:
- Storage bucket RLS policies
- RPC functions for user account operations
- GDPR compliance features
- Performance indexes

### Apply via MCP (Automated - Recommended)

The migration will be applied automatically using the Supabase MCP server's `apply_migration` tool.

### Apply via Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the contents of `migrations/profile_account_features.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Apply via Supabase CLI (Manual)

```bash
# From the project root directory
supabase db push
```

## 3. Verify Setup

After completing the above steps, verify the setup:

### Check Storage Bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'user-avatars';
```

### Check RPC Functions
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'update_user_account_details',
  'export_user_data',
  'delete_user_account'
);
```

### Check Storage Policies
```sql
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

## 4. Test the Features

Once setup is complete, test the following features in the application:

1. **Profile Picture Upload**
   - Navigate to Profile → Account Details
   - Click on the avatar to upload a new image
   - Verify the image is uploaded to the `user-avatars` bucket
   - Verify the `avatar_url` is updated in both `users` and `user_profiles` tables

2. **Account Details Edit**
   - Edit first name, last name, bio, city, country, etc.
   - Save changes
   - Verify data is updated in both tables

3. **Privacy Settings**
   - Toggle privacy options
   - Verify settings are saved in the `preferences` JSONB field

4. **Data Export (GDPR)**
   - Click "Export My Data" in Privacy Settings
   - Verify a JSON file is downloaded with all user data

5. **Account Deletion (GDPR)** - ⚠️ Test with caution
   - Type "DELETE MY ACCOUNT" in the confirmation field
   - Verify account is anonymized (not hard deleted)
   - Verify user is signed out

## 5. Troubleshooting

### Storage Bucket Not Found
If you get an error about the bucket not existing:
- Verify the bucket name is exactly `user-avatars` (case-sensitive)
- Check that the bucket is public
- Verify RLS policies are applied

### RPC Function Not Found
If RPC functions are not available:
- Re-run the migration SQL
- Check for SQL errors in the Supabase dashboard logs
- Verify the functions exist in the `public` schema

### Upload Fails
If image uploads fail:
- Check file size (must be < 5MB)
- Check file type (must be JPEG, PNG, or WebP)
- Verify storage policies allow authenticated users to upload
- Check browser console for detailed error messages

### RLS Policy Errors
If you get RLS policy errors:
- Verify the user is authenticated
- Check that the user ID matches the authenticated user
- Review the storage policies in the Supabase dashboard

## 6. Security Considerations

- ✅ Storage bucket is public (read-only) for avatar display
- ✅ Only authenticated users can upload/update/delete their own avatars
- ✅ RPC functions verify user identity before operations
- ✅ Account deletion is a soft delete (anonymization) to preserve data integrity
- ✅ All sensitive operations require authentication
- ✅ GDPR compliance features (data export, account deletion)

## 7. Next Steps

After setup is complete:
1. Test all features thoroughly on both mobile and desktop
2. Verify Netlify deployment works correctly
3. Monitor Supabase logs for any errors
4. Consider adding rate limiting for sensitive operations
5. Review and update privacy policy and terms of service

## Support

If you encounter any issues:
- Check Supabase project logs: https://supabase.com/dashboard/project/grnekxrkypgighmxyveh/logs
- Review Supabase documentation: https://supabase.com/docs
- Contact support: https://help.manus.im
