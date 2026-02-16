# Mission Control Real Data Sprint

**Priority:** CRITICAL
**Deadline:** Morning 2026-02-16

## Objective
Replace ALL mock data in Mission Control with real OpenClaw data sources.

## Tasks

### 1. ActivityStream.tsx (overview folder)
- Replace mock events with real Gateway API activity
- Source: OpenClaw gateway events, agent sessions
- Show real: agent runs, completions, errors, deployments

### 2. ActiveAgents.tsx (overview folder)  
- Replace mock agents with sessions_list API data
- Show real: active sessions, status, duration, model
- Auto-refresh every 30 seconds

### 3. CostTracking.tsx (cost folder)
- Replace mock costs with real token usage
- Source: session_status, usage metrics
- Show real: tokens, cost per model, trends

## Commandment #32
NEVER use mock/fake data. ALL data must be real.

## Deploy When Done
```bash
cd /root/.openclaw/workspace/mission-control-cole
npm run build
curl -X POST "https://api.cloudflare.com/client/v4/accounts/dd01b432f0329f87bb1cc1a3fad590ee/pages/projects/mission-control-cole/deployments" \
  -H "Authorization: Bearer $NewCloudFlareAccountToken"
```

## Success Criteria
- [ ] ActivityStream shows real events (not mock)
- [ ] ActiveAgents shows real sessions (not mock)
- [ ] CostTracking shows real usage (not mock)
- [ ] Deployed to https://mission-control-cole.pages.dev
- [ ] Screenshot proof sent to Telegram
