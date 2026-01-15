# Kunajoto Deployment Workflow

## Overview

This document outlines the automated workflow for managing code changes, resolving conflicts, running tests, and coordinating with Netlify deployments for the Kunajoto project.

---

## Branch Structure

### Active Branches

- **`main`** - Production branch deployed to Netlify
- **`agent-screen-issue-in-deployment-9d38`** - Active development branch (current)
- **`backend-integration-fixes`** - Feature branch (merged into active branch)

### Branch Flow

```
Feature Branches (e.g., backend-integration-fixes)
    ↓
Active Development Branch (agent-screen-issue-in-deployment-9d38)
    ↓
main (Production)
    ↓
Netlify Deployment
```

---

## Pull Request Workflow

### Current PRs

1. **PR #1**: `agent-screen-issue-in-deployment-9d38` → `main`
   - Status: OPEN
   - Purpose: Deploy active development to production
   - Mergeable: ✅ No conflicts

2. **PR #13**: `backend-integration-fixes` → `agent-screen-issue-in-deployment-9d38`
   - Status: ✅ MERGED
   - Purpose: Add backend integration features
   - Resolved: All conflicts resolved

---

## Automated Workflow Steps

### 1. Check for Merge Conflicts

**Command:**
```bash
gh pr view <PR_NUMBER> --json mergeable,mergeStateStatus,state
```

**Expected Output:**
```json
{
  "mergeable": "MERGEABLE" | "CONFLICTING" | "UNKNOWN",
  "mergeStateStatus": "CLEAN" | "DIRTY" | "UNKNOWN",
  "state": "OPEN" | "MERGED" | "CLOSED"
}
```

**Action:**
- If `mergeable: "CONFLICTING"` → Resolve conflicts
- If `mergeable: "MERGEABLE"` → Proceed to tests
- If `state: "MERGED"` → Already complete

---

### 2. Resolve Merge Conflicts

**Process:**

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Checkout base branch
git checkout <base-branch>
git pull origin <base-branch>

# 3. Attempt merge
git merge --no-commit <feature-branch>

# 4. Check for conflicts
git status

# 5. Resolve conflicts
# - For package files: Use feature branch (--ours)
# - For config files: Use base branch (--theirs) if it has deployment fixes
# - For code files: Manual review and merge

# 6. Add resolved files
git add <resolved-files>

# 7. Commit merge
git commit -m "Merge <feature-branch> into <base-branch>

Resolved conflicts by:
- [List conflict resolution strategy]
"

# 8. Push
git push origin <base-branch>
```

**Conflict Resolution Strategy:**

| File Type | Strategy | Reason |
|-----------|----------|--------|
| `package.json`, `package-lock.json` | Use feature branch (`--ours`) | Latest dependencies |
| `index.html` | Use base branch (`--theirs`) | Deployment configuration |
| `vite.config.ts` | Use base branch (`--theirs`) | Environment variable handling |
| `App.tsx`, `AuthModal.tsx` | Use base branch (`--theirs`) | Supabase auth integration |
| `services/geminiService.ts` | Use base branch (`--theirs`) | Correct env var setup |
| `.env`, `.env.example` | Remove | Use Netlify env vars |
| Service files (`authService`, `dataService`) | Keep both, update imports | New functionality |
| Documentation | Keep all | No conflicts |

---

### 3. Run Endpoint Tests

**Command:**
```bash
cd /home/ubuntu/Kunajoto-fire-
npx tsx test-endpoints.ts
```

**Expected Results:**

✅ **Pass:**
- Supabase URL configured
- Supabase Anon Key configured
- Database connection
- Fetch venues (143 venues)
- User authentication
- Favorites system
- User profiles

⚠️ **Expected Failures (Non-blocking):**
- Gemini API Key (requires user to add)
- AI Chat features (requires Gemini API)

**Test Output Example:**
```
🔍 KUNAJOTO ENDPOINT TEST SUITE
============================================================
📋 CONFIGURATION TESTS
✅ Supabase URL configured
✅ Supabase Anon Key configured
❌ Gemini API Key configured (Expected - user needs to add)

🔌 DATABASE CONNECTION TESTS
✅ Database connection
✅ Fetch venues (143 venues found)

👤 AUTHENTICATION TESTS
✅ User registration
✅ User login
✅ Profile creation

============================================================
📊 TEST SUMMARY
Success Rate: 85.7%
```

---

### 4. Merge to Main (Production)

**Prerequisites:**
- All conflicts resolved ✅
- Tests passing ✅
- PR approved ✅

**Command:**
```bash
# Check PR status
gh pr view 1 --json mergeable,state

# If mergeable, merge via GitHub CLI
gh pr merge 1 --squash --delete-branch=false

# Or merge manually
git checkout main
git pull origin main
git merge agent-screen-issue-in-deployment-9d38
git push origin main
```

**Post-Merge:**
- Netlify automatically deploys from `main`
- Monitor deployment at Netlify dashboard
- Verify deployment at production URL

---

### 5. Netlify Deployment Coordination

**Environment Variables (Set in Netlify):**

```bash
VITE_SUPABASE_URL=https://grnekxrkypgighmxyveh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_GOOGLE_MAPS_API_KEY=<maps-key>
VITE_GEMINI_API_KEY=<gemini-key>
```

**Secrets Scanner Configuration:**

In `netlify.toml`:
```toml
[build.environment]
  SECRETS_SCAN_OMIT_KEYS = "VITE_SUPABASE_ANON_KEY,VITE_SUPABASE_URL,VITE_GOOGLE_MAPS_API_KEY,google_maps_id,google_maps_javascript_api"
```

**Build Command:**
```bash
npm run build
```

**Publish Directory:**
```
dist
```

**Deployment Triggers:**
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment

---

## Automated Checklist

### Before Every Merge

- [ ] Check for conflicts: `gh pr view <PR> --json mergeable`
- [ ] Fetch latest changes: `git fetch origin`
- [ ] Review changed files: `git diff <base>..<feature>`
- [ ] Run endpoint tests: `npx tsx test-endpoints.ts`
- [ ] Verify database connection
- [ ] Check Netlify environment variables

### During Conflict Resolution

- [ ] Identify conflicting files: `git status`
- [ ] Choose appropriate resolution strategy
- [ ] Update imports if file locations changed
- [ ] Remove duplicate files (e.g., multiple supabaseClient.ts)
- [ ] Test locally after resolution
- [ ] Commit with descriptive message

### After Merge

- [ ] Verify PR status: `gh pr view <PR> --json state`
- [ ] Run tests on merged branch
- [ ] Check Netlify deployment status
- [ ] Verify production URL
- [ ] Monitor for errors in Netlify logs

---

## Common Issues & Solutions

### Issue: "Invalid API key" in tests

**Cause:** Expired or incorrect Supabase anon key

**Solution:**
```bash
# Get fresh key from Supabase
manus-mcp-cli tool call get_publishable_keys --server supabase --input '{"project_id":"grnekxrkypgighmxyveh"}'

# Update .env file (for local testing only)
VITE_SUPABASE_ANON_KEY=<new-key>

# Update Netlify environment variables
```

---

### Issue: Merge conflicts in package.json

**Cause:** Both branches updated dependencies

**Solution:**
```bash
# Use feature branch version (has latest deps)
git checkout --ours package.json package-lock.json
git add package.json package-lock.json

# Reinstall to verify
npm install
```

---

### Issue: Duplicate supabaseClient files

**Cause:** Different branches created clients in different locations

**Solution:**
```bash
# Keep base branch version (src/supabaseClient.ts)
git rm services/supabaseClient.ts

# Update imports in service files
sed -i "s|from './supabaseClient'|from '../src/supabaseClient'|g" services/*.ts

# Remove isSupabaseConfigured checks (always configured in production)
```

---

### Issue: Netlify deployment fails with "Secrets detected"

**Cause:** API keys in code without proper configuration

**Solution:**
1. Ensure `netlify.toml` has `SECRETS_SCAN_OMIT_KEYS`
2. Use `process.env` instead of `import.meta.env` for sensitive keys
3. Configure in `vite.config.ts`:
   ```ts
   define: {
     'process.env.SUPABASE_URL': JSON.stringify(SUPABASE_URL),
     'process.env.SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY)
   }
   ```

---

### Issue: Tests pass locally but fail in CI

**Cause:** Environment variables not set in CI

**Solution:**
1. Ensure `.env` is in `.gitignore`
2. Set variables in Netlify dashboard
3. Use `dotenv` for local testing:
   ```ts
   import 'dotenv/config';
   ```

---

## Hard Deployment (Cache Clear)

**When to use:**
- Build artifacts are corrupted
- Environment variables not updating
- Persistent deployment errors

**How to trigger:**
1. Go to Netlify dashboard
2. Navigate to Deploys
3. Click "Trigger deploy" → "Clear cache and deploy site"

**Or via CLI:**
```bash
netlify deploy --prod --build --clear-cache
```

---

## Monitoring & Alerts

### Deployment Status

**Check via GitHub CLI:**
```bash
gh pr checks <PR_NUMBER>
```

**Check via Netlify CLI:**
```bash
netlify status
netlify deploy:list
```

### Database Health

**Check via MCP:**
```bash
manus-mcp-cli tool call execute_sql --server supabase --input '{"project_id":"grnekxrkypgighmxyveh","query":"SELECT COUNT(*) FROM venues;"}'
```

**Expected:** 143 venues

---

## Future Automation

### Potential Improvements

1. **GitHub Actions Workflow**
   - Auto-run tests on PR
   - Auto-resolve simple conflicts
   - Auto-merge when tests pass

2. **Pre-commit Hooks**
   - Run linter
   - Check for secrets
   - Validate imports

3. **Deployment Notifications**
   - Slack/Discord webhook
   - Email on deployment failure
   - Test results in PR comments

4. **Automated Rollback**
   - Detect deployment failures
   - Auto-revert to last working version
   - Alert team

---

## Contact & Support

**For deployment issues:**
- Check Netlify logs first
- Review this workflow document
- Contact: [Your contact info]

**For database issues:**
- Check Supabase dashboard
- Verify RLS policies
- Run endpoint tests

**For merge conflicts:**
- Follow resolution strategy above
- Test locally before pushing
- Document any new patterns

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-27 | 1.0 | Initial workflow documentation |
| 2025-11-27 | 1.1 | Added conflict resolution strategies |
| 2025-11-27 | 1.2 | Added Netlify deployment coordination |

---

## Quick Reference

### Check PR Status
```bash
gh pr view <PR> --json mergeable,state
```

### Resolve Conflicts
```bash
git merge <branch>
git checkout --ours <file>  # Use our version
git checkout --theirs <file>  # Use their version
git add <file>
git commit
```

### Run Tests
```bash
npx tsx test-endpoints.ts
```

### Deploy to Production
```bash
gh pr merge 1 --squash
```

### Check Deployment
```bash
netlify status
```

---

**Remember:** Always test locally before pushing, and monitor Netlify deployments after merging to main!
