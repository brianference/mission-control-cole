# Mock Data Replacement Tasks

**Created:** 2026-02-15  
**Directive:** Brian - "Do not ever use mock data unless I tell you to"

## Mission Control Files Needing Real Data

### High Priority (User-Facing)

- [ ] **NotificationBell.tsx** ✅ FIXED 2026-02-15
  - Changed from mock to localStorage + event system
  - Ready to connect to OpenClaw API events
  - Notifications are now clickable with navigation

- [ ] **ActivityStream.tsx**
  - Current: Hardcoded activity items
  - Needed: Real OpenClaw session events, deployment logs
  - Source: OpenClaw Gateway API

- [ ] **ActiveAgents.tsx**
  - Current: Hardcoded agent statuses
  - Needed: Real agent session data from sessions_list
  - Source: OpenClaw sessions API

- [ ] **CostTracking.tsx**
  - Current: Mock cost data
  - Needed: Real token usage from OpenClaw
  - Source: OpenClaw usage API / logs

### Medium Priority

- [ ] **Logs.tsx**
  - Current: Sample log entries
  - Needed: Real OpenClaw logs
  - Source: Session logs, gateway logs

- [ ] **Docs.tsx**
  - Current: Sample documentation
  - Needed: Real docs from /usr/lib/node_modules/openclaw/docs
  - Source: File system

### Low Priority (Utility)

- [ ] **mockSessionData.ts**
  - Remove entirely once all components use real data
  - Track which components still depend on it

## Data Sources to Integrate

1. **OpenClaw Gateway API**
   - Sessions list and status
   - Agent status
   - Token usage
   - Logs

2. **Cloudflare API**
   - Deployment status
   - Build logs
   - Analytics

3. **GitHub API**
   - Repository activity
   - Commit history
   - PR status

4. **localStorage**
   - User preferences
   - Notification state
   - UI settings

## Implementation Notes

- Use `sendNotification()` helper to push real notifications from any component
- All notifications must have `link` property for clickable navigation
- Show empty states, never fake data
- Loading states required during API fetches
