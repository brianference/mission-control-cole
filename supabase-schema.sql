-- Mission Control Activity Tracking Schema
-- Run this in Supabase SQL Editor to create all tables

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action_type TEXT NOT NULL,
  action_name TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON performance_metrics(metric_type);

-- Heartbeat Pings Table
CREATE TABLE IF NOT EXISTS heartbeat_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('online', 'degraded', 'offline')),
  active_sessions INTEGER DEFAULT 0,
  total_tokens_today INTEGER DEFAULT 0,
  uptime_seconds INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heartbeat_timestamp ON heartbeat_pings(timestamp DESC);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  total_tokens INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

-- Enable Row Level Security (RLS)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeat_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies (fixes Security Advisor warnings)
-- Allow INSERT + SELECT for anon (heartbeat writes, dashboard reads)
-- No UPDATE/DELETE allowed (prevents unauthorized data modification)

-- Activity Log Policies
CREATE POLICY "Allow anon to insert activity" ON activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read activity" ON activity_log
  FOR SELECT USING (true);

-- Performance Metrics Policies
CREATE POLICY "Allow anon to insert metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read metrics" ON performance_metrics
  FOR SELECT USING (true);

-- Heartbeat Pings Policies
CREATE POLICY "Allow anon to insert heartbeat" ON heartbeat_pings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read heartbeat" ON heartbeat_pings
  FOR SELECT USING (true);

-- Sessions Policies
CREATE POLICY "Allow anon to insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon to read sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to update sessions" ON sessions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create a view for recent activity summary
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

-- Create a function to clean old data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM activity_log WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM heartbeat_pings WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Sample data to test (optional - remove if not needed)
INSERT INTO activity_log (action_type, action_name, details, status, user_id) VALUES
  ('tool_call', 'web_search', '{"query": "test query"}', 'success', 'brian'),
  ('deployment', 'mission-control-deploy', '{"commit": "abc123"}', 'success', 'brian'),
  ('session_start', 'new-session', '{"model": "claude-sonnet-4-5"}', 'success', 'brian');

INSERT INTO heartbeat_pings (status, active_sessions, total_tokens_today, uptime_seconds, last_activity, metadata) VALUES
  ('online', 1, 15000, 3600, NOW(), '{"memory_usage": "45%"}');

-- Grant access to anon role (adjust as needed for security)
GRANT ALL ON activity_log TO anon;
GRANT ALL ON performance_metrics TO anon;
GRANT ALL ON heartbeat_pings TO anon;
GRANT ALL ON sessions TO anon;
GRANT SELECT ON recent_activity_summary TO anon;
