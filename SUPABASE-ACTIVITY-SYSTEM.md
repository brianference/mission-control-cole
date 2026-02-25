# Mission Control - Supabase Activity System

## Overview

This system generates **constant Supabase activity** to prevent automatic project pausing due to inactivity.

**Project:** `swordtruth` (ID: jvkrdrboermwmpzblwlx)  
**URL:** https://jvkrdrboermwmpzblwlx.supabase.co

## What Was Built

### 1. Activity Logger (`src/utils/supabase.ts`)
- Logs all OpenClaw actions to Supabase
- Types: tool_call, deployment, session_start, cron_run, heartbeat
- Includes timestamp, status, details, user_id

### 2. Performance Metrics
- Tracks API performance (response times, token usage)
- Logs dashboard metrics (page load, query times, memory)
- Updates every 3 minutes

### 3. Heartbeat Service (`src/services/heartbeat.ts`)
- **Pings Supabase every 5 minutes**
- Sends system health data (uptime, active sessions, tokens)
- Auto-logs activity every 2 minutes
- Auto-logs performance metrics every 3 minutes
- **Prevents Supabase pause by generating constant reads/writes**

### 4. Live Activity Feed (`src/components/activity/ActivityFeed.tsx`)
- Real-time activity display in Mission Control dashboard
- Filters by action type (tools, deploys, crons)
- Auto-refreshes every 30 seconds
- Subscribes to Supabase real-time changes

### 5. Session Tracking
- Records session start/end times
- Tracks tokens, messages, model usage
- Stores session metadata

## Database Schema

Run `supabase-schema.sql` in Supabase SQL Editor to create:

### Tables
- `activity_log` - All OpenClaw actions
- `performance_metrics` - Performance tracking
- `heartbeat_pings` - Health check pings every 5min
- `sessions` - Session records

### Features
- Automatic timestamps
- Indexes for fast queries
- Row Level Security (RLS) enabled
- Auto-cleanup of data >30 days

## Setup Instructions

### 1. Create Database Tables

```bash
# Copy SQL from supabase-schema.sql and run in Supabase SQL Editor
# OR use Supabase CLI:
supabase db push
```

### 2. Verify Supabase Config

Credentials stored in `/root/.openclaw/secrets/.bootstrap-cache.json`:
- `supabase_url`: https://jvkrdrboermwmpzblwlx.supabase.co
- `supabase_anon_key`: sb_publishable__oNWuVW8-W9HqoYW5RFxVw_Xe7EC0Ix

### 3. Deploy Mission Control

```bash
cd /root/.openclaw/workspace/mission-control-cole
./deploy.sh
```

### 4. Verify Activity

Check Supabase dashboard:
- **activity_log** should receive new rows every 2 minutes
- **heartbeat_pings** should receive new rows every 5 minutes
- **performance_metrics** should receive new rows every 3 minutes

## Activity Generation Schedule

| Service | Interval | Action |
|---------|----------|--------|
| Heartbeat Ping | 5 minutes | Write to `heartbeat_pings` |
| Activity Log | 2 minutes | Write to `activity_log` |
| Performance Metrics | 3 minutes | Write to `performance_metrics` |
| Dashboard Refresh | 30 seconds | Read from all tables |

**Result:** Constant database activity every 2-5 minutes prevents pause.

## Monitoring

### View Recent Activity (Supabase SQL Editor)
```sql
SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 20;
SELECT * FROM heartbeat_pings ORDER BY timestamp DESC LIMIT 10;
SELECT * FROM performance_metrics ORDER BY timestamp DESC LIMIT 20;
```

### Check Activity Summary
```sql
SELECT * FROM recent_activity_summary;
```

### Verify Last Heartbeat
```sql
SELECT 
  timestamp,
  status,
  active_sessions,
  total_tokens_today,
  uptime_seconds
FROM heartbeat_pings 
ORDER BY timestamp DESC 
LIMIT 1;
```

## Features Added to Mission Control

### Overview Page
- **Live Activity Feed** - Real-time OpenClaw actions
- Filters: All, Tools, Deploys, Crons
- Auto-refresh every 30 seconds
- Real-time subscriptions via Supabase Realtime

### Auto-Start
- Heartbeat service starts automatically 5 seconds after page load
- Stops on page unload
- Runs in background continuously

## Why This Prevents Pause

Supabase pauses projects with "insufficient activity for 7+ days."

**This system generates:**
- **~288 heartbeat pings per day** (every 5 min × 24 hrs)
- **~720 activity logs per day** (every 2 min × 24 hrs)
- **~480 performance metrics per day** (every 3 min × 24 hrs)

**Total:** ~1,488 database operations per day = **constant activity**

## Troubleshooting

### Heartbeat Not Running
Check browser console for:
```
🫀 Starting heartbeat service (ping every 5min)
💓 Heartbeat sent (uptime: XXXs)
```

### No Data in Supabase
1. Verify tables exist (run schema.sql)
2. Check RLS policies (should allow all operations)
3. Verify anon key is correct
4. Check browser console for errors

### Activity Feed Empty
1. Ensure heartbeat service is running
2. Check Supabase connection
3. Verify tables have data
4. Check browser console for API errors

## Manual Testing

```javascript
// In browser console:
import { logActivity, sendHeartbeat } from './src/utils/supabase';

// Test activity logging
await logActivity({
  action_type: 'test',
  action_name: 'Manual test',
  details: { test: true },
  status: 'success',
  user_id: 'brian'
});

// Test heartbeat
await sendHeartbeat({
  status: 'online',
  active_sessions: 1,
  total_tokens_today: 1000,
  uptime_seconds: 60,
  last_activity: new Date().toISOString(),
  metadata: {}
});
```

## Next Steps

1. ✅ Deploy to production
2. ✅ Verify heartbeat starts automatically
3. ✅ Monitor Supabase dashboard for activity
4. ⏳ Wait 7 days to confirm no pause notification
5. 🎯 Consider adding more features:
   - Cron job logs
   - Token usage tracking
   - Error monitoring
   - Cost analysis

## Files Modified/Created

```
mission-control-cole/
├── src/
│   ├── utils/supabase.ts (NEW)
│   ├── services/heartbeat.ts (NEW)
│   ├── components/activity/
│   │   ├── ActivityFeed.tsx (NEW)
│   │   └── ActivityFeed.css (NEW)
│   └── pages/Overview.tsx (MODIFIED)
├── supabase-schema.sql (NEW)
├── SUPABASE-ACTIVITY-SYSTEM.md (NEW)
└── package.json (MODIFIED - added @supabase/supabase-js)
```

## Maintenance

### Auto-Cleanup
The database includes an auto-cleanup function:
```sql
SELECT cleanup_old_activity();  -- Removes data >30 days
```

Schedule this to run weekly/monthly if needed.

### Adjust Intervals
Edit `src/services/heartbeat.ts` to change:
- Heartbeat interval (currently 5 min)
- Activity log interval (currently 2 min)
- Metrics interval (currently 3 min)

---

**Status:** ✅ Production-ready  
**Last Updated:** 2026-02-24  
**Maintainer:** Brian Ference + Cole
