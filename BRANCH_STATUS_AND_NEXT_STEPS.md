# Kunajoto Testing Branch - Current Status & Next Steps

**Date**: December 11, 2025  
**Branch**: kunajoto-testing-v2  
**Branch ID**: gwxwwoirnxssgqzofcsx  
**Code Branch**: ux-development5-preferences2

---

## ✅ What's Been Completed

### 1. Database Branch Created
- ✅ New Supabase branch created and active
- ✅ Isolated from production database
- ✅ Ready for testing without affecting live data

### 2. Schema Migration
- ✅ **21 Kunajoto tables** created (venues, user_profiles, events, check_ins, favorites, etc.)
- ✅ **6 Basejump tables** created (accounts, billing_customers, billing_subscriptions, invitations, etc.)
- ✅ **1 function** created (handle_new_user trigger)
- ✅ All table structures match production

### 3. Environment Configuration
- ✅ Branch API URL: `https://gwxwwoirnxssgqzofcsx.supabase.co`
- ✅ API keys generated
- ✅ Environment file created: `.env.kunajoto-testing`

---

## ⚠️ What Still Needs To Be Done

### 1. Copy Production Data (CRITICAL)
The tables are empty. You need to copy:
- **187 venues** from production
- **5 user profiles** from production  
- Any other data (events, check-ins, favorites)

**Why this is critical**: Without data, the app won't display anything when you test it.

### 2. Copy Remaining Functions
Production has 3 functions, branch has 1. Still need:
- `generate_full_name()` - Auto-generates full names from first/last
- `calculate_vibe_score()` - Calculates venue vibe scores

### 3. Copy RLS Policies
Production has 42 RLS (Row Level Security) policies. These control who can access what data.

**Note**: For testing purposes, you could temporarily disable RLS, but this is NOT recommended for production.

---

## 🚀 How To Complete The Setup

### Option A: Use Supabase Dashboard (Easiest)

1. **Copy Data**:
   - Go to production database Table Editor
   - Export each table as CSV
   - Go to branch database Table Editor  
   - Import the CSV files

2. **Copy Functions**:
   - Go to production Database → Functions
   - Copy the SQL for each function
   - Go to branch SQL Editor
   - Paste and execute

3. **Copy RLS Policies**:
   - Go to production Authentication → Policies
   - For each table, copy the policy SQL
   - Apply to branch database

### Option B: Use Supabase CLI (Recommended for developers)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref grnekxrkypgighmxyveh

# Pull schema from production (creates migration files)
supabase db pull

# This creates migration files in supabase/migrations/

# Now apply those migrations to the branch
# (You'll need to manually change the connection string to the branch)

# Or use pg_dump/pg_restore:
pg_dump -h db.grnekxrkypgighmxyveh.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --table=venues \
        > venues_data.sql

psql -h db.gwxwwoirnxssgqzofcsx.supabase.co \
     -U postgres \
     -d postgres \
     < venues_data.sql
```

### Option C: Use the Provided Scripts

I've created scripts in `/home/ubuntu/` that attempt to copy data via MCP tools, but they're slow. You can try running them:

```bash
python3 /home/ubuntu/copy_all_data_final.py
```

---

## 📝 Connecting Your App To The Branch

### 1. Update Environment Variables

Create `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://gwxwwoirnxssgqzofcsx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eHd3b2lybnhzc2dxem9mY3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTM3MzksImV4cCI6MjA0OTUyOTczOX0.Iy0Tl5_2qMdFJRHUyPOPnbfZIJCvHWM-rJxK0yzOvPQ
```

### 2. Deploy To Netlify

In your Netlify project settings:
1. Go to Site configuration → Environment variables
2. Add the above variables
3. Trigger a new deploy

### 3. Test The App

Once deployed:
- Visit your Netlify URL
- Test user signup (will use Basejump tables)
- Test venue browsing (will use Kunajoto tables)
- Verify everything works

---

## 🔄 Merging Branch Back To Production

**IMPORTANT**: Only merge after thorough testing!

### Step 1: Backup Production
```bash
# Create a backup before merging
pg_dump -h db.grnekxrkypgighmxyveh.supabase.co \
        -U postgres \
        -d postgres \
        > production_backup_$(date +%Y%m%d).sql
```

### Step 2: Test Basejump Integration

On the branch, verify:
- ✅ User signup works
- ✅ Team creation works  
- ✅ Billing integration works
- ✅ Existing Kunajoto features still work
- ✅ No conflicts between Basejump and Kunajoto tables

### Step 3: Merge Database Changes

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to Branches
3. Click on kunajoto-testing-v2
4. Click "Merge to Production"
5. Review changes
6. Confirm merge

**Option B: Using SQL**
1. Export Basejump tables from branch:
   ```sql
   -- Run on branch database
   SELECT * FROM basejump.accounts;
   -- Export as CSV or SQL
   ```

2. Import to production:
   ```sql
   -- Run on production database
   -- Paste the exported data
   ```

### Step 4: Merge Code Changes

```bash
cd /home/ubuntu/Kunajoto-fire-

# Make sure you're on the testing branch
git checkout ux-development5-preferences2

# Merge to main development branch
git checkout ux-development4-favorites
git merge ux-development5-preferences2

# Push to GitHub
git push origin ux-development4-favorites

# Deploy to production Netlify
# (Update environment variables to use production database)
```

### Step 5: Delete Testing Branch

Once everything is working in production:

```bash
# Via Supabase Dashboard:
# Go to Branches → kunajoto-testing-v2 → Delete

# Or via MCP:
manus-mcp-cli tool call delete_branch --server supabase \
  --input '{"project_id":"grnekxrkypgighmxyveh","branch_id":"gwxwwoirnxssgqzofcsx"}'
```

**This will stop the $9.70/month charge!**

---

## 📊 Current Branch Costs

- **Hourly**: $0.01344
- **Daily**: ~$0.32
- **Monthly**: ~$9.70

**Remember to delete the branch after testing to avoid ongoing charges!**

---

## 🆘 Troubleshooting

### App shows no venues
→ Data wasn't copied. Use Option A or B above to copy venues table.

### User signup fails
→ Check that `handle_new_user` function exists and `user_profiles` table is accessible.

### "RLS policy violation" errors
→ RLS policies weren't copied. Either copy them or temporarily disable RLS for testing:
```sql
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
```

### Basejump features don't work
→ Verify all 6 Basejump tables exist and are accessible.

---

## 📚 Additional Resources

- [Supabase Branching Docs](https://supabase.com/docs/guides/platform/branching)
- [Basejump Documentation](https://usebasejump.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

## ✅ Summary

**What you have**:
- ✅ Working testing branch with proper schema
- ✅ Basejump SaaS infrastructure installed
- ✅ Isolated environment for safe testing
- ✅ Clear path to production

**What you need to do**:
1. Copy production data to branch (187 venues, 5 users)
2. Copy remaining functions (2 more)
3. Test thoroughly
4. Merge to production when ready
5. Delete testing branch to stop charges

The foundation is solid. You just need to populate it with data and test!
