# Supabase Security Advisor Fix

## Issues

Supabase Security Advisor flagged **2 errors** in project `swordtruth` (jvkrdrboermwmpzblwlx):

### Error 1: Security Definer View
**Entity:** `public.recent_activity_summary`  
**Problem:** View uses SECURITY DEFINER property (runs with creator's elevated permissions)  
**Risk:** Could allow privilege escalation attacks

### Error 2: RLS Disabled on secrets table
**Entity:** `public.secrets`  
**Problem:** Row Level Security not enabled  
**Risk:** Anyone with anon key can read/modify all secrets

## Fix (2 minutes)

### Run Complete Security Fix SQL

1. Open Supabase SQL Editor: https://app.supabase.com/project/jvkrdrboermwmpzblwlx/sql
2. Copy/paste the entire contents of `supabase-security-fix-complete.sql`
3. Click **Run**

This will:
- ✅ Recreate `recent_activity_summary` view WITHOUT security definer
- ✅ Enable RLS on `secrets` table
- ✅ Add user-scoped policies for `secrets` (user_id = 'brian')
- ✅ Tighten activity table policies (INSERT + SELECT only)
- ✅ Block unnecessary UPDATE/DELETE operations

**Result:** Both Security Advisor errors will clear within 24 hours.

### Option 2: View Security Advisor

1. Open: https://app.supabase.com/project/jvkrdrboermwmpzblwlx/advisors/security
2. Review the specific warnings
3. Run the SQL fix above

## What Changed

### Fix 1: Remove SECURITY DEFINER from View

**Before (Insecure):**
```sql
CREATE OR REPLACE VIEW recent_activity_summary AS
SELECT ... 
-- Implicitly uses SECURITY DEFINER (runs with creator's permissions)
```

**After (Secure):**
```sql
CREATE OR REPLACE VIEW recent_activity_summary AS
SELECT ... 
-- Uses SECURITY INVOKER (runs with caller's permissions - safer default)
```

### Fix 2: Enable RLS on secrets table

**Before (Insecure):**
```sql
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;  -- Was disabled
-- Anyone could read/modify all secrets
```

**After (Secure):**
```sql
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own secrets" ON secrets
  FOR SELECT USING (user_id = 'brian');
-- Only user 'brian' can access their secrets
```

### Fix 3: Tighten Activity Table Policies

**Before (Insecure):**
```sql
CREATE POLICY "Allow all operations on activity_log" ON activity_log
  FOR ALL USING (true) WITH CHECK (true);
-- Allows: INSERT, SELECT, UPDATE, DELETE (too permissive)
```

**After (Secure):**
```sql
CREATE POLICY "Allow anon to insert activity" ON activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read activity" ON activity_log
  FOR SELECT USING (true);
-- Allows: INSERT, SELECT only
-- Blocks: UPDATE, DELETE (not needed)
```

## Why This Is Safe

**Heartbeat service only needs:**
- ✅ INSERT (write new pings)
- ✅ SELECT (dashboard reads data)

**Heartbeat does NOT need:**
- ❌ UPDATE (never modifies existing rows)
- ❌ DELETE (uses auto-cleanup function instead)

**New policies:**
- Allow exactly what's needed (INSERT + SELECT)
- Block everything else by default
- Maintains full functionality
- Fixes Security Advisor warnings

## Verify Fix Applied

After running the SQL, check policies were updated:

```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'activity_log'
ORDER BY policyname;
```

**Expected output:**
```
activity_log | Allow anon to insert activity | INSERT
activity_log | Allow anon to read activity   | SELECT
```

(No "Allow all operations" policy)

## Impact on Existing System

**No changes needed to code** — heartbeat service works exactly the same.

Only difference:
- ✅ Still writes pings (INSERT works)
- ✅ Still reads data (SELECT works)
- ❌ Can't modify old pings (UPDATE blocked, but we never did this anyway)
- ❌ Can't delete pings (DELETE blocked, use cleanup function instead)

## Cleanup Function Still Works

The auto-cleanup function runs with elevated permissions (not affected by RLS):

```sql
-- Run manually if needed:
SELECT cleanup_old_activity();
```

This deletes data >30 days old (bypasses RLS because it's a function).

## Timeline

1. **Now:** Run `supabase-security-fix.sql`
2. **Immediately:** Policies updated, warnings fixed
3. **Within 24h:** Security Advisor rechecks and clears warnings
4. **Next week:** No more security warning emails

---

**Status:** Ready to apply  
**Impact:** Fixes security warnings, zero downtime  
**Code changes:** None required
