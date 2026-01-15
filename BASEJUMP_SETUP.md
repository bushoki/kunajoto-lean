# Basejump Integration Setup

## Overview

Basejump has been successfully installed on the `kunajoto-testing` Supabase branch. This provides a complete SaaS infrastructure for authentication, team management, and billing.

## Database Branch Details

- **Branch Name**: kunajoto-testing
- **Branch ID**: cmabbbnvbugrajvzvyag
- **API URL**: https://cmabbbnvbugrajvzvyag.supabase.co
- **Status**: Active
- **Cost**: $0.01344/hour (~$9.70/month while active)

## Basejump Features Installed

### Core Tables

1. **basejump.accounts** - Personal and team accounts
2. **basejump.account_user** - Team membership with roles (owner/member)
3. **basejump.invitations** - Team invitation system
4. **basejump.billing_customers** - Stripe customer records
5. **basejump.billing_subscriptions** - Subscription management
6. **basejump.config** - Feature flags

### Features Enabled

- ✅ Personal accounts (auto-created on signup)
- ✅ Team accounts
- ✅ Role-based permissions (owner/member)
- ✅ Team invitations
- ✅ Stripe billing integration (ready for configuration)

## Testing the Integration

### 1. Switch to Branch Environment

```bash
cd /home/ubuntu/Kunajoto-fire-
cp .env.kunajoto-testing .env
npm run dev
```

### 2. Test User Signup

When a user signs up, Basejump will automatically:
- Create a personal account
- Add user as account owner
- Set up billing customer record (if configured)

### 3. Test Team Creation

Use the `basejump.create_account()` function:

```sql
SELECT basejump.create_account('My Team', 'my-team-slug');
```

### 4. Test Invitations

```sql
INSERT INTO basejump.invitations (account_id, account_role, invitation_type)
VALUES ('<account_id>', 'member', 'one_time');
```

## Next Steps

### Required: Enable RLS and Add Policies

The tables currently have RLS disabled. You need to:

1. Enable RLS on all tables
2. Add security policies
3. Create helper functions

Run this SQL:

```sql
-- Enable RLS
ALTER TABLE basejump.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.account_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE basejump.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add policies (see full SQL in basejump_manual_install.sql)
```

### Optional: Configure Stripe

1. Add Stripe keys to environment:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. Create webhook endpoint for subscription events

3. Configure subscription plans in Stripe Dashboard

## Merging to Production

Once testing is complete:

1. **Merge database changes**:
   ```bash
   manus-mcp-cli tool call merge_branch --server supabase \
     --input '{"project_id":"grnekxrkypgighmxyveh","branch_id":"eee1e2c4-3507-4b2b-823d-df1d49f7abb3"}'
   ```

2. **Update production environment**:
   - Copy `.env.kunajoto-testing` values to production `.env`
   - Update Supabase URL and keys to production values

3. **Delete testing branch** (to stop charges):
   ```bash
   manus-mcp-cli tool call delete_branch --server supabase \
     --input '{"project_id":"grnekxrkypgighmxyveh","branch_id":"eee1e2c4-3507-4b2b-823d-df1d49f7abb3"}'
   ```

## Troubleshooting

### Issue: RLS blocking queries

**Solution**: Ensure RLS policies are added (see basejump_manual_install.sql)

### Issue: Personal account not created on signup

**Solution**: Check that the trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'create_personal_account_on_signup';
```

### Issue: Billing not working

**Solution**: Configure Stripe keys and webhook endpoint

## Resources

- Basejump Documentation: https://usebasejump.com/docs
- Supabase Branching: https://supabase.com/docs/guides/platform/branching
- Stripe Integration: https://stripe.com/docs/billing/subscriptions/overview
