/**
 * gatewayApi.ts — OpenClaw Gateway Data Layer
 *
 * Fetches real data from the pre-generated public JSON files.
 * These files are built from live OpenClaw session/cron data at deploy time.
 * Falls back gracefully to cached state if API unavailable.
 *
 * Gateway: http://localhost:18789 (WebSocket-based, local only)
 * Data: /public/*.json (generated at build from ~/.openclaw/)
 */

export interface GatewaySession {
  agentId: string;
  sessionKey: string;
  displayName: string;
  model: string;
  totalTokens: number;
  updatedAt: number;
  status: string;
  messageCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  fileSizeKb?: number;
}

export interface SessionsPayload {
  lastUpdated: string;
  sessions: GatewaySession[];
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  scheduleKind: string;
  tz: string;
  model: string;
  lastRunMs?: number;
  nextRunMs?: number;
  lastStatus: string;
  lastDurationMs?: number;
  consecutiveErrors: number;
  lastError?: string;
  agentId: string;
}

export interface CronsPayload {
  lastUpdated: string;
  jobs: CronJob[];
}

export interface UsageDay {
  date: string;
  cost: number;
  tokens: number;
  requests: number;
  sessions: number;
}

export interface UsagePayload {
  summary: {
    monthTotal?: number;
    totalTokens?: number;
    totalCost?: number;
  };
  daily: UsageDay[];
}

export type ConnectionStatus = 'live' | 'cached' | 'offline';

const DATA_FRESH_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

function checkDataFreshness(lastUpdated: string): ConnectionStatus {
  try {
    const ts = new Date(lastUpdated).getTime();
    const ageMs = Date.now() - ts;
    if (ageMs < DATA_FRESH_THRESHOLD_MS) return 'live';
    return 'cached';
  } catch {
    return 'offline';
  }
}

// ── Sessions ─────────────────────────────────────────────────────────────────

let _sessionsCache: SessionsPayload | null = null;
let _sessionsStatus: ConnectionStatus = 'offline';

export async function fetchSessions(): Promise<{ data: SessionsPayload; status: ConnectionStatus }> {
  try {
    const res = await fetch('/active-sessions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SessionsPayload = await res.json();
    _sessionsCache = data;
    _sessionsStatus = checkDataFreshness(data.lastUpdated);
    return { data, status: _sessionsStatus };
  } catch (err) {
    console.warn('gatewayApi: sessions fetch failed, using cache', err);
    if (_sessionsCache) return { data: _sessionsCache, status: 'cached' };
    return {
      data: { lastUpdated: new Date().toISOString(), sessions: [] },
      status: 'offline',
    };
  }
}

// ── Crons ────────────────────────────────────────────────────────────────────

let _cronsCache: CronsPayload | null = null;
let _cronsStatus: ConnectionStatus = 'offline';

export async function fetchCrons(): Promise<{ data: CronsPayload; status: ConnectionStatus }> {
  try {
    const res = await fetch('/crons.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CronsPayload = await res.json();
    _cronsCache = data;
    _cronsStatus = checkDataFreshness(data.lastUpdated);
    return { data, status: _cronsStatus };
  } catch (err) {
    console.warn('gatewayApi: crons fetch failed, using cache', err);
    if (_cronsCache) return { data: _cronsCache, status: 'cached' };
    return {
      data: { lastUpdated: new Date().toISOString(), jobs: [] },
      status: 'offline',
    };
  }
}

// ── Usage ────────────────────────────────────────────────────────────────────

let _usageCache: UsagePayload | null = null;

export async function fetchUsage(): Promise<UsagePayload | null> {
  try {
    const res = await fetch('/usage-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: UsagePayload = await res.json();
    _usageCache = data;
    return data;
  } catch (err) {
    console.warn('gatewayApi: usage fetch failed, using cache', err);
    return _usageCache;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the data was built within the last 4 hours (considered "live"). */
export function isDataLive(lastUpdated: string): boolean {
  return checkDataFreshness(lastUpdated) === 'live';
}

export function formatTimeAgo(ms: number): string {
  const diffMs = Date.now() - ms;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
