# Budget Tracking - Multi-Tier Reliability Plan

**Created:** 2026-02-22 22:00 MST  
**Goal:** Most reliable and accurate budget tracking with fallback methods

## Architecture: 3-Tier System

### Tier 1: Real-Time Server-Side Generation (BEST)
**Method:** Cloudflare Pages Function (serverless edge function)  
**Endpoint:** `/api/usage-live`  
**How it works:**
1. Function deployed alongside static site
2. Reads session JSONL files from mounted volume or S3
3. Runs `collect-usage-data.js` logic server-side
4. Returns fresh data on every request
5. Caches for 2 minutes (CDN edge cache)

**Pros:**
- ✅ Always fresh (max 2min old)
- ✅ No client-side CORS issues
- ✅ Runs on Cloudflare's edge network (fast)
- ✅ Auto-scales

**Cons:**
- ⚠️ Requires session logs accessible to function
- ⚠️ Cloudflare Pages Functions may have limitations

**Fallback if:** Function errors, session logs inaccessible

---

### Tier 2: Pre-Generated Static JSON (GOOD)
**Method:** Cron job updates JSON every 5-15 minutes  
**File:** `/public/usage-data.json`  
**How it works:**
1. Cron runs `collect-usage-data.js` every 5 min
2. Writes to `/public/usage-data.json`
3. Git commit + push triggers Cloudflare rebuild (or direct upload)
4. Client fetches static JSON file

**Pros:**
- ✅ Simple, no server-side code needed
- ✅ Works with static hosting
- ✅ Fast client-side load
- ✅ Already implemented

**Cons:**
- ⚠️ Data can be up to 5-15 min stale
- ⚠️ Requires git push or direct file upload
- ⚠️ Cron job must run reliably

**Fallback if:** Cron fails, file not updated

---

### Tier 3: Cached Client-Side Data (FALLBACK)
**Method:** LocalStorage with timestamp  
**File:** Cached `usage-data.json` in browser  
**How it works:**
1. Client tries Tier 1, then Tier 2
2. If both fail, use last successful fetch from LocalStorage
3. Display staleness warning ("Last updated: 2 hours ago")

**Pros:**
- ✅ Always shows something
- ✅ No network required after first load
- ✅ Graceful degradation

**Cons:**
- ⚠️ Can be very stale (hours/days)
- ⚠️ Shows warning to user

**Fallback if:** All network requests fail

---

## Implementation Plan

### Phase 1: Client-Side Retry Logic (Immediate)
```typescript
async function fetchUsageData() {
  // Tier 1: Try live API
  try {
    const res = await fetch('/api/usage-live');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('usage-cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return { data, source: 'live', age: 0 };
    }
  } catch (e) {
    console.warn('Live API failed, trying static');
  }

  // Tier 2: Fall back to static JSON
  try {
    const res = await fetch('/usage-data.json');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('usage-cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return { data, source: 'static', age: getFileAge(data) };
    }
  } catch (e) {
    console.warn('Static JSON failed, using cache');
  }

  // Tier 3: Use cached data
  const cached = localStorage.getItem('usage-cache');
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    return { data, source: 'cache', age };
  }

  throw new Error('No usage data available');
}
```

### Phase 2: Cron Job for Static Updates (15 minutes)
```yaml
# Cron: Every 5 minutes
schedule: "*/5 * * * *"
command: |
  cd /root/.openclaw/workspace/mission-control-cole
  node scripts/collect-usage-data.js
  git add public/usage-data.json
  git commit -m "Update usage data: $(date)"
  git push origin main
  # Trigger Cloudflare deploy hook
  curl -X POST "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/..."
```

### Phase 3: Cloudflare Pages Function (Optional, if supported)
```javascript
// functions/api/usage-live.js
export async function onRequest(context) {
  try {
    // Option A: Read from R2 storage
    const logs = await context.env.R2.get('session-logs.tar.gz');
    
    // Option B: Call external API
    const response = await fetch('https://gateway.openclaw.dev/api/usage');
    
    // Process and return
    const data = await processUsageData(logs);
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=120' // 2 min cache
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
}
```

---

## Recommended Implementation Order

### 1. **Now (5 min):** Add client-side retry logic
- Update BudgetMeter.tsx with 3-tier fetch
- Add staleness indicator
- Store in localStorage

### 2. **Next (15 min):** Set up cron job
- Create cron to run `collect-usage-data.js` every 5 min
- Auto-commit and trigger Cloudflare rebuild
- Monitor cron execution

### 3. **Later (optional):** Add Cloudflare Function
- If Cloudflare Pages Functions support file access
- Or create separate Workers endpoint
- Point client to function first

---

## Success Metrics

**Tier 1 success rate:** 95%+ (when implemented)  
**Tier 2 success rate:** 99%+ (cron reliability)  
**Tier 3 fallback:** 100% (always works with cache)

**Maximum staleness:**
- Best case: 2 minutes (Tier 1 cache)
- Normal case: 5 minutes (Tier 2 cron)
- Worst case: Last successful fetch (Tier 3 cache)

**User experience:**
- Shows freshness indicator: "Updated 2 min ago"
- Warning if data is >15 min old
- Error only if all tiers fail AND no cache

---

## Files to Create/Modify

**Create:**
- `src/utils/usageDataFetcher.ts` - Multi-tier fetch logic
- `scripts/update-usage-cron.sh` - Cron script for Tier 2
- `functions/api/usage-live.js` - Cloudflare Function (optional)

**Modify:**
- `src/components/overview/BudgetMeter.tsx` - Use new fetcher
- `src/pages/Overview.tsx` - Update data loading

**Cron:**
- ID: `<new-cron-id>`
- Schedule: `*/5 * * * *` (every 5 minutes)
- Command: `bash /root/.openclaw/workspace/mission-control-cole/scripts/update-usage-cron.sh`

---

## Next Steps

1. ✅ Document plan (this file)
2. ⏳ Implement Tier 3 (client-side retry + cache)
3. ⏳ Set up Tier 2 (cron job)
4. ⏳ Research Tier 1 feasibility (Cloudflare Functions)
5. ⏳ Deploy and monitor

**Priority:** Tier 3 + Tier 2 first (most reliable with current infrastructure)
