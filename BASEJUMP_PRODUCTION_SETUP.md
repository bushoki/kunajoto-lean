# Basejump Production Installation Guide

**Date**: December 11, 2025  
**Database**: Production (grnekxrkypgighmxyveh)  
**Code Branch**: ux-development5-preferences2

---

## ✅ What's Been Done

1. ✅ Testing branch deleted (saved $9.70/month)
2. ✅ Production backup created (migration: `backup_before_basejump_20251211_171542`)
3. ✅ Installation SQL files created and committed to GitHub

---

## 🚀 Installation Steps

### Step 1: Install Basejump on Production

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/grnekxrkypgighmxyveh
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `install_basejump_production.sql` (in your GitHub repo)
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message

### Step 2: Verify Installation

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'basejump'
ORDER BY table_name;
```

**Expected result**: 6 tables
- account_user
- accounts
- billing_customers
- billing_subscriptions
- config
- invitations

### Step 3: Verify Your Existing Tables Are Untouched

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected result**: All your original 21 Kunajoto tables (venues, user_profiles, events, etc.)

---

## 🔄 If Something Goes Wrong - Rollback

If you need to remove Basejump completely:

1. Go to SQL Editor
2. Copy contents of `rollback_basejump.sql`
3. Paste and run
4. This will remove ONLY Basejump tables
5. Your Kunajoto data will be completely safe

---

## 📊 What Basejump Provides

### Tables Created

**basejump.accounts**
- Stores team/organization accounts
- Each user can belong to multiple accounts
- Supports both personal and team accounts

**basejump.account_user**
- Junction table linking users to accounts
- Defines user roles (owner, member)

**basejump.invitations**
- Manages team invitations
- Token-based invitation system

**basejump.billing_customers**
- Links accounts to Stripe customers
- Stores billing email and provider info

**basejump.billing_subscriptions**
- Tracks subscription status
- Syncs with Stripe webhooks
- Handles trials, cancellations, renewals

**basejump.config**
- Global configuration
- Enable/disable features

---

## 🔧 Next Steps After Installation

### 1. Update Your App Code

The app needs to be updated to use Basejump for:
- User signup → Create personal account
- Team creation → Create team account
- Billing → Link to Stripe via Basejump

### 2. Create Helper Functions

You'll need to create functions to:
- Auto-create personal account on user signup
- Handle team invitations
- Sync billing with Stripe

### 3. Set Up RLS Policies

Basejump tables need Row Level Security policies to ensure:
- Users can only see their own accounts
- Only account owners can manage billing
- Team members can only access their team's data

### 4. Integrate with Stripe

Configure Stripe webhooks to update Basejump billing tables:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 📚 Basejump Documentation

- **Official Docs**: https://usebasejump.com/docs
- **GitHub**: https://github.com/usebasejump/basejump
- **Stripe Integration**: https://usebasejump.com/docs/billing

---

## 🆘 Troubleshooting

### "relation basejump.accounts does not exist"
→ Run the installation SQL again

### "type basejump.account_role already exists"
→ This is fine, the installation is idempotent (safe to run multiple times)

### "foreign key violation"
→ Make sure you run the installation SQL in the correct order (it's already ordered correctly in the file)

### Want to start fresh?
→ Run `rollback_basejump.sql`, then run `install_basejump_production.sql` again

---

## ✅ Summary

**What you have now**:
- ✅ Production database with backup
- ✅ Basejump SaaS infrastructure ready
- ✅ All existing Kunajoto features intact
- ✅ Rollback plan if needed

**What you need to do**:
1. Run `install_basejump_production.sql` in Supabase SQL Editor
2. Verify 6 Basejump tables were created
3. Update app code to use Basejump
4. Set up Stripe integration

**Files in repo**:
- `install_basejump_production.sql` - Run this to install
- `rollback_basejump.sql` - Run this to remove (if needed)
- `BASEJUMP_PRODUCTION_SETUP.md` - This guide

You're ready to install Basejump on production! The installation takes < 1 minute and is completely reversible.
