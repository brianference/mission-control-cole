import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jvkrdrboermwmpzblwlx.supabase.co';
const supabaseAnonKey = 'sb_publishable__oNWuVW8-W9HqoYW5RFxVw_Xe7EC0Ix';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Activity Logger - logs all actions to Supabase
export interface ActivityLog {
  id?: string;
  timestamp: string;
  action_type: string; // 'tool_call', 'deployment', 'session_start', 'cron_run', 'heartbeat'
  action_name: string;
  details: Record<string, any>;
  status: 'success' | 'error' | 'pending';
  user_id: string;
}

export async function logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      ...activity,
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error('Failed to log activity:', error);
    return null;
  }
  
  return data;
}

// Performance Metrics
export interface PerformanceMetric {
  id?: string;
  timestamp: string;
  metric_type: string; // 'api_call', 'tool_execution', 'model_response'
  metric_name: string;
  value: number;
  unit: string; // 'ms', 'tokens', 'bytes', 'count'
  metadata: Record<string, any>;
}

export async function logMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) {
  const { data, error } = await supabase
    .from('performance_metrics')
    .insert({
      ...metric,
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error('Failed to log metric:', error);
    return null;
  }

  return data;
}

// Heartbeat Pings
export interface HeartbeatPing {
  id?: string;
  timestamp: string;
  status: 'online' | 'degraded' | 'offline';
  active_sessions: number;
  total_tokens_today: number;
  uptime_seconds: number;
  last_activity: string;
  metadata: Record<string, any>;
}

export async function sendHeartbeat(ping: Omit<HeartbeatPing, 'id' | 'timestamp'>) {
  const { data, error } = await supabase
    .from('heartbeat_pings')
    .insert({
      ...ping,
      timestamp: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error('Failed to send heartbeat:', error);
    return null;
  }

  return data;
}

// Fetch recent activity (for dashboard)
export async function getRecentActivity(limit = 50) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch activity:', error);
    return [];
  }

  return data as ActivityLog[];
}

// Fetch performance metrics
export async function getRecentMetrics(limit = 100) {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch metrics:', error);
    return [];
  }

  return data as PerformanceMetric[];
}

// Fetch heartbeat status
export async function getHeartbeatStatus() {
  const { data, error } = await supabase
    .from('heartbeat_pings')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Failed to fetch heartbeat:', error);
    return null;
  }

  return data?.[0] as HeartbeatPing | null;
}

// Session management
export interface SessionRecord {
  id?: string;
  session_id: string;
  started_at: string;
  ended_at?: string;
  total_tokens: number;
  messages_count: number;
  model: string;
  status: 'active' | 'completed' | 'error';
  metadata: Record<string, any>;
}

export async function logSession(session: Omit<SessionRecord, 'id'>) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select();

  if (error) {
    console.error('Failed to log session:', error);
    return null;
  }

  return data;
}

export async function updateSession(sessionId: string, updates: Partial<SessionRecord>) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('session_id', sessionId)
    .select();

  if (error) {
    console.error('Failed to update session:', error);
    return null;
  }

  return data;
}
