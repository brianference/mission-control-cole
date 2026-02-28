# Mission Control Usage Tracking Upgrade Plan

**Created:** 2026-02-27  
**Goal:** Integrate OpenClaw's `interactions.db` tracking system into Mission Control  
**Principle:** Real data only, no mock data

---

## Current State

**Mission Control:**
- Scans JSONL session files (`/root/.openclaw/agents/*/sessions/*.jsonl`)
- Aggregates data into `public/usage-data.json`
- Basic cost tracking by model
- Updated hourly via cron

**Limitations:**
- No per-call granularity
- No request/response bodies
- No API failure tracking
- Manual cost estimates only
- No thinking token tracking
- Can't analyze individual calls

---

## Target State (from Screenshots)

**OpenClaw Architecture:**
1. **interactions.db** - SQLite database with full call logs
   - Tables:
     - `llm_calls`: provider, model, caller, prompt, response, token counts, duration, cost estimate, status
     - `api_calls`: service, endpoint, method, request/response bodies, status code, duration

2. **Model Usage JSONL** - Backup log (`~/.openclaw/logs/model-usage.jsonl`)

3. **Usage Dashboard** - CLI tool (`tools/usage-dashboard.js`)
   - Query by model, date range, task type
   - Cost breakdowns
   - System health / API failure rates

4. **Integration Points:**
   - Cost Estimator
   - System Health / API Failure tracking
   - Gateway Usage Sync

---

## Implementation Plan

### Phase 1: Verify Data Sources (Today)

**Goal:** Check if `interactions.db` exists and is being populated

**Tasks:**
1. Check for SQLite database:
   ```bash
   find /root/.openclaw -name "interactions.db" -ls
   sqlite3 /root/.openclaw/data/interactions.db ".tables"
   ```

2. Check for JSONL logs:
   ```bash
   ls -la /root/.openclaw/logs/model-usage.jsonl
   ```

3. Check if LLM wrapper is writing to database:
   ```bash
   find /root/.openclaw -path "*/shared/llm-router.js" -exec head -50 {} \;
   ```

**Outcome:** Determine if tracking is already running or needs setup

---

### Phase 2: SQLite Database Integration (Week 1)

**Goal:** Read from `interactions.db` if it exists, or create it

**A. Database Schema:**
```sql
CREATE TABLE IF NOT EXISTS llm_calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  caller TEXT,
  session_id TEXT,
  task_type TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  thinking_tokens INTEGER,
  total_tokens INTEGER,
  duration_ms INTEGER,
  cost_estimate REAL,
  status TEXT,
  prompt_preview TEXT,
  response_preview TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON llm_calls(timestamp);
CREATE INDEX idx_model ON llm_calls(model);
CREATE INDEX idx_caller ON llm_calls(caller);
CREATE INDEX idx_session ON llm_calls(session_id);
```

**B. New Script: `scripts/query-interactions-db.js`**
```javascript
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = '/root/.openclaw/data/interactions.db';

export function queryUsageByModel(startDate, endDate) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      model,
      COUNT(*) as calls,
      SUM(prompt_tokens) as input_tokens,
      SUM(completion_tokens) as output_tokens,
      SUM(thinking_tokens) as thinking_tokens,
      SUM(cost_estimate) as total_cost
    FROM llm_calls
    WHERE timestamp BETWEEN ? AND ?
    GROUP BY model
    ORDER BY total_cost DESC
  `).all(startDate, endDate);
  
  db.close();
  return rows;
}

export function queryUsageByDay(days = 7) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      DATE(timestamp) as date,
      SUM(cost_estimate) as cost,
      SUM(total_tokens) as tokens,
      COUNT(*) as requests
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(timestamp)
    ORDER BY date
  `).all(days);
  
  db.close();
  return rows;
}

export function queryTopModels(limit = 10) {
  const db = new Database(DB_PATH, { readonly: true });
  
  const rows = db.prepare(`
    SELECT 
      model,
      COUNT(*) as calls,
      SUM(prompt_tokens) as input_tokens,
      SUM(completion_tokens) as output_tokens,
      ROUND(SUM(cost_estimate), 2) as cost
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-30 days')
    GROUP BY model
    ORDER BY cost DESC
    LIMIT ?
  `).all(limit);
  
  db.close();
  return rows;
}
```

**C. Update `collect-usage-data.js`:**
- Try reading from `interactions.db` first
- Fall back to JSONL parsing if DB doesn't exist
- Combine both sources if needed

---

### Phase 3: Enhanced Dashboard UI (Week 1)

**Goal:** Display detailed cost breakdowns in Mission Control

**A. New Sections:**

1. **Per-Model Breakdown** (Already exists, enhance with):
   - Thinking tokens column (shown separately)
   - Calls count
   - Average cost per call
   - Input/output token ratio

2. **Provider Breakdown** (NEW):
   - Anthropic (Claude models)
   - OpenAI (GPT models)
   - Google (Gemini models)
   - Cost by provider

3. **Task Type Breakdown** (NEW):
   - Coding: $X
   - Automation: $Y
   - Design: $Z
   - General: $W

4. **API Failure Tracking** (NEW):
   - Rate limit hits
   - 429 errors
   - 500 errors
   - Failed requests by provider

**B. New Components:**

**`src/components/ProviderBreakdown.jsx`:**
```jsx
export default function ProviderBreakdown({ data }) {
  const providers = groupByProvider(data);
  
  return (
    <div className="glass-card">
      <h2>Cost by Provider</h2>
      <div className="provider-grid">
        {providers.map(p => (
          <div key={p.name} className="provider-card">
            <h3>{p.name}</h3>
            <div className="metric">
              <span className="value">${p.cost.toFixed(2)}</span>
              <span className="label">{p.calls} calls</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`src/components/TaskTypeBreakdown.jsx`:**
```jsx
export default function TaskTypeBreakdown({ data }) {
  const tasks = groupByTaskType(data);
  
  return (
    <div className="glass-card">
      <h2>Cost by Task Type</h2>
      <div className="task-chart">
        {tasks.map(t => (
          <div key={t.type} className="task-bar">
            <span className="label">{t.type}</span>
            <div className="bar" style={{ width: `${t.percentage}%` }}>
              ${t.cost.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**`src/components/APIHealthMonitor.jsx`:**
```jsx
export default function APIHealthMonitor({ failures }) {
  return (
    <div className="glass-card">
      <h2>API Health</h2>
      <div className="health-grid">
        <div className="metric">
          <span className="value">{failures.rateLimit}</span>
          <span className="label">Rate Limits</span>
        </div>
        <div className="metric">
          <span className="value">{failures.serverError}</span>
          <span className="label">Server Errors</span>
        </div>
        <div className="metric success-rate">
          <span className="value">{failures.successRate}%</span>
          <span className="label">Success Rate</span>
        </div>
      </div>
    </div>
  );
}
```

---

### Phase 4: Thinking Token Tracking (Week 1)

**Goal:** Track thinking tokens separately (currently untracked per screenshot)

**Problem:** Thinking tokens "don't have cost tracked because they're going through the OAuth subscription"

**Solution:**
1. Track thinking tokens separately in database
2. Display in UI but mark as "included in subscription"
3. Show total thinking token usage for capacity planning

**Implementation:**
```javascript
// In query-interactions-db.js
export function getThinkingTokenStats() {
  const db = new Database(DB_PATH, { readonly: true });
  
  const row = db.prepare(`
    SELECT 
      SUM(thinking_tokens) as total_thinking,
      COUNT(CASE WHEN thinking_tokens > 0 THEN 1 END) as calls_with_thinking,
      MAX(thinking_tokens) as max_thinking_tokens,
      AVG(thinking_tokens) as avg_thinking_tokens
    FROM llm_calls
    WHERE timestamp >= DATE('now', '-30 days')
  `).get();
  
  db.close();
  return row;
}
```

**UI Display:**
```
Opus thinking (SDK) | 2,010 calls | 1.2M input | 246K output | - (subscription)
                                                    ↑ thinking tokens shown here
```

---

### Phase 5: Real-Time Updates (Week 2)

**Goal:** Live usage tracking without page refresh

**A. WebSocket or Polling:**
- Option 1: Poll `/api/usage/latest` every 30 seconds
- Option 2: WebSocket connection for live updates
- **Recommendation:** Polling (simpler, no WebSocket infra needed)

**B. Live Cost Counter:**
```jsx
export default function LiveCostTracker() {
  const [todayCost, setTodayCost] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetch('/api/usage/today').then(r => r.json());
      setTodayCost(data.cost);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="live-cost">
      <span className="label">Today:</span>
      <span className="value animate-pulse">${todayCost.toFixed(2)}</span>
    </div>
  );
}
```

---

### Phase 6: Cost Alerts (Week 2)

**Goal:** Alert when daily/weekly costs exceed thresholds

**A. Alert Rules:**
```json
{
  "alerts": {
    "dailyLimit": 50,
    "weeklyLimit": 200,
    "perModelDailyLimit": {
      "opus-4.6": 30,
      "sonnet-4.5": 20
    },
    "failureRateThreshold": 5
  }
}
```

**B. Alert System:**
```javascript
export function checkCostAlerts(usage, budget) {
  const alerts = [];
  
  if (usage.today > budget.dailyLimit) {
    alerts.push({
      type: 'daily-exceeded',
      severity: 'critical',
      message: `Daily cost $${usage.today} exceeds limit $${budget.dailyLimit}`
    });
  }
  
  if (usage.thisWeek > budget.weeklyLimit) {
    alerts.push({
      type: 'weekly-exceeded',
      severity: 'warning',
      message: `Weekly cost $${usage.thisWeek} exceeds limit $${budget.weeklyLimit}`
    });
  }
  
  return alerts;
}
```

**C. UI Alert Banner:**
```jsx
{alerts.map(alert => (
  <div className={`alert alert-${alert.severity}`}>
    ⚠️ {alert.message}
  </div>
))}
```

---

## Integration Checklist

### Week 1: Database & UI
- [ ] Verify `interactions.db` exists or create schema
- [ ] Install `better-sqlite3`: `npm install better-sqlite3`
- [ ] Create `scripts/query-interactions-db.js`
- [ ] Update `collect-usage-data.js` to use DB
- [ ] Add ProviderBreakdown component
- [ ] Add TaskTypeBreakdown component
- [ ] Add APIHealthMonitor component
- [ ] Add thinking token display
- [ ] Test with real data only

### Week 2: Real-Time & Alerts
- [ ] Implement `/api/usage/latest` endpoint
- [ ] Add LiveCostTracker component
- [ ] Create alert rules config
- [ ] Implement alert checking logic
- [ ] Add alert UI banner
- [ ] Test alert triggers

### Week 3: Polish & Deploy
- [ ] Add charts (Chart.js or Recharts)
- [ ] Mobile responsive design
- [ ] Export CSV functionality
- [ ] Deploy to Cloudflare Pages
- [ ] Screenshot proof on all 3 platforms
- [ ] Documentation

---

## Data Flow Diagram

```
┌─────────────┐
│  LLM Call   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ shared/llm-router.js │ ← OpenClaw's LLM wrapper
└──────┬───────────────┘
       │
       ├───────────────────┐
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Provider API │    │ interactions.db  │ ← SQLite database
└──────────────┘    └──────┬───────────┘
                           │
                    ┌──────┴──────┬──────────────┬────────────┐
                    ▼             ▼              ▼            ▼
           ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
           │   Mission   │  │   Cost   │  │  Health  │  │ Gateway │
           │   Control   │  │Estimator │  │ Monitor  │  │  Sync   │
           │  Dashboard  │  └──────────┘  └──────────┘  └─────────┘
           └─────────────┘
                  │
                  ▼
           ┌──────────────────┐
           │   Browser UI     │
           │ - Provider view  │
           │ - Task type view │
           │ - Health monitor │
           │ - Cost alerts    │
           └──────────────────┘
```

---

## Real Data Sources

**Primary:** `/root/.openclaw/data/interactions.db` (if exists)  
**Secondary:** `/root/.openclaw/agents/*/sessions/*.jsonl` (current)  
**Backup:** `/root/.openclaw/logs/model-usage.jsonl` (JSONL log)

**Never:**
- ❌ Mock data
- ❌ Fake costs
- ❌ Test placeholders

**Always:**
- ✅ Query real database
- ✅ Parse actual session logs
- ✅ Use documented API pricing
- ✅ Test with production data

---

## Success Metrics

**Week 1:**
- [ ] Dashboard shows provider breakdown with real costs
- [ ] Thinking tokens displayed (marked as subscription)
- [ ] API failure rate visible
- [ ] Database queries return real data

**Week 2:**
- [ ] Live cost updates every 30 seconds
- [ ] Alerts trigger on budget thresholds
- [ ] Task type breakdown shows real usage

**Week 3:**
- [ ] Deployed to production
- [ ] Screenshots verified on all 3 platforms
- [ ] No mock data in UI
- [ ] Documentation complete

---

## Next Steps

**Immediate (Today):**
1. Check if `interactions.db` exists
2. Verify schema if it does
3. Test SQLite query performance
4. Install `better-sqlite3` package

**This Week:**
1. Build database query layer
2. Add provider breakdown UI
3. Add task type breakdown UI
4. Add API health monitor
5. Deploy and test

**This Month:**
1. Real-time updates
2. Cost alerts
3. Export functionality
4. Mobile optimization

---

**Status:** 📋 Ready to implement  
**Priority:** High (cost visibility = cost control)  
**Owner:** Cole  
**Estimated Time:** 2-3 weeks for full implementation
