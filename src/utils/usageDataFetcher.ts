/**
 * Multi-tier usage data fetcher with automatic fallback
 * 
 * Tier 1: Live API endpoint (if available)
 * Tier 2: Static JSON file (updated via cron)
 * Tier 3: LocalStorage cache (last successful fetch)
 */

interface UsageData {
  summary: {
    weekTotal: number;
    monthTotal: number;
    totalSessions: number;
    totalRequests: number;
    dailyTotal?: number;
  };
  daily: Array<{
    date: string;
    cost: number;
    tokens: number;
    requests: number;
    sessions: number;
  }>;
  providers: Array<{ name: string; cost: number; tokens: number }>;
  models: Array<{ name: string; cost: number; tokens: number }>;
  lastUpdated?: string;
}

interface FetchResult {
  data: UsageData;
  source: 'live' | 'static' | 'cache';
  age: number; // milliseconds
  stale: boolean;
}

const CACHE_KEY = 'mission-control-usage-cache';
const STALE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

/**
 * Calculate age of data based on lastUpdated timestamp
 */
function calculateDataAge(data: UsageData): number {
  if (!data.lastUpdated) return 0;
  return Date.now() - new Date(data.lastUpdated).getTime();
}

/**
 * Save data to localStorage cache
 */
function cacheData(data: UsageData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache usage data:', e);
  }
}

/**
 * Load data from localStorage cache
 */
function loadCachedData(): { data: UsageData; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    console.warn('Failed to load cached data:', e);
    return null;
  }
}

/**
 * Tier 1: Try to fetch from live API endpoint
 */
async function fetchLiveAPI(): Promise<UsageData | null> {
  try {
    const response = await fetch('/api/usage-live', {
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      console.warn('Live API returned', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Fetched from live API');
    return data;
  } catch (error) {
    console.warn('Live API failed:', error);
    return null;
  }
}

/**
 * Tier 2: Fall back to static JSON file
 */
async function fetchStaticJSON(): Promise<UsageData | null> {
  try {
    const response = await fetch('/usage-data.json', {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn('Static JSON returned', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Fetched from static JSON');
    return data;
  } catch (error) {
    console.warn('Static JSON failed:', error);
    return null;
  }
}

/**
 * Tier 3: Use cached data from localStorage
 */
function fetchCachedData(): { data: UsageData; age: number } | null {
  const cached = loadCachedData();
  if (!cached) {
    console.warn('No cached data available');
    return null;
  }
  
  const age = Date.now() - cached.timestamp;
  console.log(`⚠️ Using cached data (${Math.round(age / 1000)}s old)`);
  return { data: cached.data, age };
}

/**
 * Main fetch function with 3-tier fallback
 */
export async function fetchUsageData(): Promise<FetchResult> {
  // Tier 1: Try live API
  const liveData = await fetchLiveAPI();
  if (liveData) {
    cacheData(liveData);
    const age = calculateDataAge(liveData);
    return {
      data: liveData,
      source: 'live',
      age,
      stale: age > STALE_THRESHOLD
    };
  }

  // Tier 2: Fall back to static JSON
  const staticData = await fetchStaticJSON();
  if (staticData) {
    cacheData(staticData);
    const age = calculateDataAge(staticData);
    return {
      data: staticData,
      source: 'static',
      age,
      stale: age > STALE_THRESHOLD
    };
  }

  // Tier 3: Use cached data as last resort
  const cached = fetchCachedData();
  if (cached) {
    return {
      data: cached.data,
      source: 'cache',
      age: cached.age,
      stale: true
    };
  }

  // All tiers failed
  throw new Error('Unable to fetch usage data from any source');
}

/**
 * Format age for display
 */
export function formatDataAge(age: number): string {
  const seconds = Math.floor(age / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Get staleness status for UI
 */
export function getStaleStatus(age: number): 'fresh' | 'recent' | 'stale' | 'very-stale' {
  const minutes = age / (60 * 1000);
  
  if (minutes < 2) return 'fresh';      // < 2 min
  if (minutes < 15) return 'recent';    // < 15 min
  if (minutes < 60) return 'stale';     // < 1 hour
  return 'very-stale';                   // > 1 hour
}
