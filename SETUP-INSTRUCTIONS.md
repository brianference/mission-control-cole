# Supabase Activity System - Setup Instructions

## ⚡ Quick Setup (5 minutes)

### Step 1: Create Database Tables

1. Open Supabase Dashboard: https://app.supabase.com/project/jvkrdrboermwmpzblwlx
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy/paste the entire contents of `supabase-schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

**Expected result:** 
```
Success. 4 tables created, 12 indexes created, 4 policies created.
```

### Step 2: Verify Tables Exist

Run this query in SQL Editor:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activity_log', 'performance_metrics', 'heartbeat_pings', 'sessions');
```

**Expected result:** 4 rows returned

### Step 3: Test Activity Logging

The deployment will automatically start logging activity. To verify it's working:

1. Wait 2 minutes after deployment
2. Run this query in Supabase SQL Editor:
```sql
SELECT COUNT(*) as total_activities FROM activity_log;
SELECT COUNT(*) as total_heartbeats FROM heartbeat_pings;
```

**Expected result after 5 minutes:** 
- activity_log: 2-3 rows
- heartbeat_pings: 1 row

### Step 4: Monitor Live Activity

Visit Mission Control: https://mission-control-cole.pages.dev

You should see:
- **Live Activity Feed** at the bottom of Overview page
- New activities appearing every 2 minutes
- Heartbeat status updating every 5 minutes

## What Happens Automatically

Once deployed, the system will:

1. **Every 2 minutes:** Log random activity (dashboard views, data refreshes)
2. **Every 3 minutes:** Log performance metrics (page load times, memory usage)
3. **Every 5 minutes:** Send heartbeat ping (uptime, active sessions, token count)
4. **Every 30 seconds:** Dashboard refreshes and reads from Supabase

**Result:** ~1,488 database operations per day = constant activity

## Verification Checklist

After setup, verify these work:

- [ ] Tables created in Supabase (run query above)
- [ ] Heartbeat service starts (check browser console for "🫀 Starting heartbeat service")
- [ ] Activity appears in Supabase after 2 minutes
- [ ] Heartbeat appears in Supabase after 5 minutes
- [ ] Live Activity Feed shows data in Mission Control

## Troubleshooting

### "Table does not exist" error
**Fix:** Run supabase-schema.sql in SQL Editor

### No activity appearing after 5 minutes
**Check:**
1. Browser console for errors
2. Supabase anon key is correct in `src/utils/supabase.ts`
3. RLS policies are enabled (schema.sql includes this)

### Activity Feed empty
**Check:**
1. Heartbeat service started (browser console: "🫀 Starting heartbeat service")
2. Tables have data (run SQL query above)
3. No CORS errors in browser console

### Heartbeat not starting
**Fix:** Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)

## Manual Test

To manually test the system works, paste this in browser console:

```javascript
// Import the functions
const { logActivity, sendHeartbeat } = await import('./src/utils/supabase');

// Test activity logging
await logActivity({
  action_type: 'test',
  action_name: 'Manual test from console',
  details: { timestamp: new Date().toISOString() },
  status: 'success',
  user_id: 'brian'
});

// Check it worked
console.log('✅ Activity logged! Check Supabase dashboard.');
```

## Monitoring Queries

### Recent Activity Summary
```sql
SELECT 
  action_type,
  COUNT(*) as count,
  MAX(timestamp) as last_seen
FROM activity_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY action_type
ORDER BY count DESC;
```

### Heartbeat Status
```sql
SELECT 
  timestamp,
  status,
  active_sessions,
  uptime_seconds,
  ROUND(uptime_seconds / 3600.0, 2) as uptime_hours
FROM heartbeat_pings
ORDER BY timestamp DESC
LIMIT 10;
```

### Activity Per Day
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_activities
FROM activity_log
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 7;
```

## What This Prevents

**Supabase pauses projects** with "insufficient activity for 7+ days."

**This system generates:**
- 288 heartbeat pings/day (every 5 min)
- 720 activity logs/day (every 2 min)
- 480 performance metrics/day (every 3 min)

**Total:** ~1,488 operations/day = **constant activity**

## Next Steps After Setup

1. Monitor for 24 hours to verify activity is logging
2. Check Supabase dashboard weekly for health
3. No further action needed - system runs automatically!

---

**Setup Time:** ~5 minutes  
**Status:** Production-ready  
**Auto-starts:** Yes (on page load)  
**Maintenance:** None required
