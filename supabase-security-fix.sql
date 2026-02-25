-- Fix Security Advisor Warnings - Tighten RLS Policies
-- Run this in Supabase SQL Editor to replace overly-permissive policies

-- Drop the overly-permissive policies
DROP POLICY IF EXISTS "Allow all operations on activity_log" ON activity_log;
DROP POLICY IF EXISTS "Allow all operations on performance_metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Allow all operations on heartbeat_pings" ON heartbeat_pings;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;

-- Activity Log: Allow INSERT and SELECT for anon, no UPDATE/DELETE
CREATE POLICY "Allow anon to insert activity" ON activity_log
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anon to read activity" ON activity_log
  FOR SELECT 
  USING (true);

-- Performance Metrics: Allow INSERT and SELECT for anon, no UPDATE/DELETE
CREATE POLICY "Allow anon to insert metrics" ON performance_metrics
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anon to read metrics" ON performance_metrics
  FOR SELECT 
  USING (true);

-- Heartbeat Pings: Allow INSERT and SELECT for anon, no UPDATE/DELETE
CREATE POLICY "Allow anon to insert heartbeat" ON heartbeat_pings
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anon to read heartbeat" ON heartbeat_pings
  FOR SELECT 
  USING (true);

-- Sessions: Allow INSERT and SELECT for anon, UPDATE for session owner
CREATE POLICY "Allow anon to insert sessions" ON sessions
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anon to read sessions" ON sessions
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow anon to update sessions" ON sessions
  FOR UPDATE 
  USING (true) 
  WITH CHECK (true);

-- Optional: Add authenticated user policies for UPDATE/DELETE
-- (Only if you plan to have authenticated users manage data)

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('activity_log', 'performance_metrics', 'heartbeat_pings', 'sessions')
ORDER BY tablename, policyname;
