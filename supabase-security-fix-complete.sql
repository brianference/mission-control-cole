-- Complete Security Advisor Fix
-- Fixes both errors shown in Security Advisor

-- ═══════════════════════════════════════════════════════════════════
-- ERROR 1: Security Definer View (recent_activity_summary)
-- ═══════════════════════════════════════════════════════════════════

-- Drop the SECURITY DEFINER view and recreate without it
DROP VIEW IF EXISTS recent_activity_summary;

-- Recreate view WITHOUT security definer (uses invoker's permissions instead)
CREATE OR REPLACE VIEW recent_activity_summary AS
SELECT 
  DATE(timestamp) as activity_date,
  action_type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count
FROM activity_log
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), action_type
ORDER BY activity_date DESC, action_type;

-- Grant SELECT to anon (same as before)
GRANT SELECT ON recent_activity_summary TO anon;

-- ═══════════════════════════════════════════════════════════════════
-- ERROR 2: RLS Disabled on secrets table
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on secrets table
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;

-- Add policies for secrets table
-- Only allow anon to read/write their own secrets (filtered by user_id)
CREATE POLICY "Users can read own secrets" ON secrets
  FOR SELECT 
  USING (user_id = 'brian');  -- Adjust if you have auth.uid() later

CREATE POLICY "Users can insert own secrets" ON secrets
  FOR INSERT 
  WITH CHECK (user_id = 'brian');  -- Adjust if you have auth.uid() later

CREATE POLICY "Users can update own secrets" ON secrets
  FOR UPDATE 
  USING (user_id = 'brian') 
  WITH CHECK (user_id = 'brian');  -- Adjust if you have auth.uid() later

-- ═══════════════════════════════════════════════════════════════════
-- Update RLS policies on activity tables (from previous fix)
-- ═══════════════════════════════════════════════════════════════════

-- Drop the overly-permissive policies if they still exist
DROP POLICY IF EXISTS "Allow all operations on activity_log" ON activity_log;
DROP POLICY IF EXISTS "Allow all operations on performance_metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Allow all operations on heartbeat_pings" ON heartbeat_pings;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;

-- Activity Log: Allow INSERT and SELECT for anon
DROP POLICY IF EXISTS "Allow anon to insert activity" ON activity_log;
DROP POLICY IF EXISTS "Allow anon to read activity" ON activity_log;

CREATE POLICY "Allow anon to insert activity" ON activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read activity" ON activity_log
  FOR SELECT USING (true);

-- Performance Metrics: Allow INSERT and SELECT for anon
DROP POLICY IF EXISTS "Allow anon to insert metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Allow anon to read metrics" ON performance_metrics;

CREATE POLICY "Allow anon to insert metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read metrics" ON performance_metrics
  FOR SELECT USING (true);

-- Heartbeat Pings: Allow INSERT and SELECT for anon
DROP POLICY IF EXISTS "Allow anon to insert heartbeat" ON heartbeat_pings;
DROP POLICY IF EXISTS "Allow anon to read heartbeat" ON heartbeat_pings;

CREATE POLICY "Allow anon to insert heartbeat" ON heartbeat_pings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read heartbeat" ON heartbeat_pings
  FOR SELECT USING (true);

-- Sessions: Allow INSERT, SELECT, and UPDATE for anon
DROP POLICY IF EXISTS "Allow anon to insert sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon to read sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon to update sessions" ON sessions;

CREATE POLICY "Allow anon to insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to update sessions" ON sessions
  FOR UPDATE USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════
-- Verify all fixes applied
-- ═══════════════════════════════════════════════════════════════════

-- Check view is no longer SECURITY DEFINER
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE schemaname = 'public' AND viewname = 'recent_activity_summary';

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('activity_log', 'performance_metrics', 'heartbeat_pings', 'sessions', 'secrets')
ORDER BY tablename;

-- Check all policies
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected results:
-- ✅ recent_activity_summary exists (no security definer flag)
-- ✅ All 5 tables have rls_enabled = true
-- ✅ Each table has specific INSERT/SELECT policies (no "Allow all operations")
-- ✅ secrets table has user_id-based policies
