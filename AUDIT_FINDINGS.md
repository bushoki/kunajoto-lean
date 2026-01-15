# Kunajoto App - Backend Integration Audit

## Date: November 27, 2025

## Critical Issues Identified

### 1. **Missing Environment Variables** (CRITICAL)
- **Issue**: No `.env` file exists with Supabase credentials
- **Impact**: All database operations fail, app runs in mock mode
- **Evidence**: `supabaseClient.ts` returns `null` when env vars are missing
- **Fix Required**: Create `.env` file with:
  - `SUPABASE_URL=https://grnekxrkypgighmxyveh.supabase.co`
  - `SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. **User Registration Error** (CRITICAL)
- **Issue**: "Database error saving new user" shown on registration
- **Root Cause**: Supabase client is null, auth service returns mock data, but error handling is incorrect
- **Location**: `AuthModal.tsx` lines 40-54
- **Fix Required**: Better error handling when Supabase is not configured

### 3. **Duplicate UI Text** (HIGH)
- **Issue**: Form subtitle appears twice in AuthModal
- **Location**: `AuthModal.tsx` lines 76-78
- **Evidence**: Screenshot shows "Create an account to unlock forecasts." appearing twice
- **Fix Required**: Remove duplicate text

### 4. **CityGauge AI Button Non-Functional** (CRITICAL)
- **Issue**: AI chat button doesn't work
- **Location**: Need to investigate `AIChat.tsx` component
- **Fix Required**: Connect to Gemini service properly

## Database Schema Analysis

### Existing Tables (Supabase)
✅ **users** - User profiles with preferences
✅ **user_preferences** - Separate preferences table
✅ **user_profiles** - Profile data with onboarding status
✅ **venues** - 143 venues already in database!
✅ **favorites** - User favorites
✅ **check_ins** - User check-ins
✅ **events** - Events data
✅ **vibe_scores** - Vibe scoring system
✅ **venue_signals** - Signal tracking
✅ **vibe_score_weights** - Scoring weights
✅ **admin_feature_flags** - Admin controls
✅ **data_ingestion_log** - Ingestion tracking
✅ **heatmap_cache** - Map performance

### Schema Mismatches
⚠️ **venues table** uses different column names:
- Frontend expects: `lat`, `lng`, `image_url`, `vibe_score`
- Database has: `latitude`, `longitude`, `image_url`, `vibe_score`
- **Fix Required**: Update `dataService.ts` mapping

⚠️ **favorites vs user_favorites**:
- Frontend code references: `user_favorites`
- Database table name: `favorites`
- **Fix Required**: Update table references

## Frontend Components Audit

### Components Requiring Backend Integration

#### 1. **AuthModal.tsx** ✅ Partially Connected
- ✅ Sign up functionality
- ✅ Sign in functionality
- ❌ Error handling needs improvement
- ❌ No user profile creation after signup

#### 2. **Profile.tsx** ❌ Not Connected
- Need to review implementation

#### 3. **PreferenceFlow.tsx** ❌ Not Connected
- Need to review implementation

#### 4. **AIChat.tsx** ❌ Not Connected
- Need to review implementation

#### 5. **AdminDashboard.tsx** ❌ Not Connected
- Need to review implementation

#### 6. **MapContainer.tsx** ❌ Partially Connected
- Need to review venue fetching

#### 7. **VenueDetail.tsx** ❌ Not Connected
- Need to review favorites integration

## Next Steps

1. ✅ Create `.env` file with Supabase credentials
2. ✅ Fix schema mismatches in dataService.ts
3. ✅ Fix duplicate text in AuthModal
4. ✅ Improve error handling in AuthModal
5. ⏳ Review and fix all component integrations
6. ⏳ Create endpoint tests
7. ⏳ Test all features end-to-end
