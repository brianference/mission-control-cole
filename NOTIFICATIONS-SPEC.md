# Notifications System Specification

## Overview

The **Notifications Bell** (🔔) in the top-right corner serves as Mission Control's central alert and activity hub. It aggregates real-time updates from all monitored apps, systems, and services, providing Brian with actionable intelligence without overwhelming him.

---

## Design Principles

1. **Signal over Noise** - Only show notifications that matter
2. **Actionable** - Every notification should enable quick action or resolution
3. **Contextual** - Provide enough context to make decisions without clicking through
4. **Non-Intrusive** - Respect focus time; batch low-priority items
5. **Real-Time** - Critical alerts appear instantly; others batch intelligently

---

## Notification Categories

### 1. 🚨 **Critical Alerts** (Red)
**Priority:** Immediate attention required  
**Auto-dismiss:** Never (must be acknowledged)

- **System Down** - Any monitored app becomes unreachable
- **Cost Spike** - Spending exceeds 200% of daily average
- **Deployment Failed** - Build or deployment error
- **Security Alert** - Unauthorized access attempt, API key compromise
- **Data Loss Risk** - Backup failure, database corruption warning

**Actions:**
- View Details → Jump to relevant dashboard section
- Acknowledge → Mark as handled
- Quick Fix → Common remediation actions (restart service, rollback deployment)

---

### 2. ⚠️ **Warnings** (Orange)
**Priority:** Important, but not urgent  
**Auto-dismiss:** 7 days if unacknowledged

- **Cost Threshold** - Approaching daily/weekly budget (80%+)
- **Performance Degradation** - Response time >2x baseline
- **Resource Utilization** - CPU/memory >85% for 10+ min
- **Certificate Expiring** - SSL cert expires in <30 days
- **Dependency Update Available** - Critical security patch
- **Unusual Activity** - Traffic spike, login from new location

**Actions:**
- View Trends → Chart/graph of the metric
- Snooze (1h, 4h, 1d) → Temporarily dismiss
- Mark Resolved → Archive notification

---

### 3. ℹ️ **Info** (Blue)
**Priority:** Nice to know  
**Auto-dismiss:** 3 days if unread

- **Deployment Success** - New version deployed
- **Backup Completed** - Scheduled backup finished
- **Task Milestone** - Kanban board milestone reached
- **Calendar Reminder** - Event starting in 1 hour
- **App Update Available** - Non-critical dependency update
- **Weekly Summary** - Stats digest every Monday 9am

**Actions:**
- View Details → Link to relevant page
- Dismiss → Remove from list

---

### 4. ✅ **Success** (Green)
**Priority:** Confirmation/reassurance  
**Auto-dismiss:** 24 hours

- **Optimization Applied** - Cost reduction measure succeeded
- **Issue Auto-Resolved** - System self-healed
- **Goal Achieved** - Project milestone completed
- **Performance Improvement** - Metric improved significantly

**Actions:**
- Celebrate 🎉 → Dismiss with confetti animation
- Share → Copy to clipboard for sharing

---

## Notification Panel UI

### Header
```
┌─────────────────────────────────────────────┐
│ 🔔 Notifications                    [⚙️ 🗑️] │
├─────────────────────────────────────────────┤
│ Tabs: All (8) | Critical (2) | Unread (5)   │
└─────────────────────────────────────────────┘
```

**Header Actions:**
- ⚙️ **Settings** → Notification preferences (quick link to Settings > Notifications)
- 🗑️ **Clear All Read** → Archive all acknowledged/read notifications

---

### Notification Item Structure

```
┌─────────────────────────────────────────────┐
│ [🔴] Cost Spike Detected                    │
│                                         2m   │
│ OpenClaw spent $47.32 in the last hour     │
│ (215% above baseline)                      │
│                                             │
│ [View Costs] [Acknowledge] [•••]           │
└─────────────────────────────────────────────┘
```

**Components:**
- **Status Indicator** - Color-coded dot/icon (🔴🟠🔵🟢)
- **Title** - Bold, scannable headline
- **Timestamp** - Relative time (2m, 1h, 3d)
- **Body** - 1-2 line context with key metrics
- **Actions** - Primary + secondary action buttons
- **Overflow Menu (•••)** - Snooze, delete, share, mark unread

---

### Notification States

1. **Unread** - Bold text, blue dot indicator
2. **Read** - Normal text, no indicator
3. **Snoozed** - Hidden temporarily, shows snooze timer badge
4. **Archived** - Moved to "Archive" tab, searchable

---

### Grouping & Batching

**Smart Grouping:**
- Multiple notifications from same source within 10 min → Collapse into one
- Example: "3 deployments succeeded" instead of 3 separate items

**Batching Rules:**
- **Critical:** Never batch, always show immediately
- **Warning:** Batch if >3 similar notifications in 5 min
- **Info/Success:** Batch aggressively (max 1 notification per source per hour)

---

### Empty States

**All Clear:**
```
    🌟
  All caught up!
  No new notifications
```

**Filtered View Empty:**
```
    ✨
  No critical alerts
  Everything running smoothly
```

---

## Notification Sources

### Core System Monitoring
- **Health Checks** - Ping all apps every 5 min, report downtime
- **Performance Metrics** - Track response times, error rates
- **Resource Usage** - CPU, memory, disk, network

### Cost Tracking
- **Real-Time Spending** - Monitor OpenClaw API costs
- **Budget Alerts** - Daily/weekly thresholds
- **Spike Detection** - Detect anomalies in spending patterns
- **Optimization Opportunities** - Suggest cost-saving actions

### Deployments
- **Build Status** - Success/failure of CI/CD pipelines
- **Deployment Events** - New versions going live
- **Rollback Triggers** - Auto-rollback on error spike

### Applications
- **Python Kanban** - Task milestones, sprint completions
- **Second Brain** - New memory entries, weekly review reminders
- **Secret Vault** - Backup status, password expiry warnings
- **Tokyo Trip** - Countdown to trip, itinerary updates

### Calendar Integration
- **Upcoming Events** - 1 hour before events
- **Overdue Tasks** - Daily digest of overdue items

### Security & Access
- **Login Activity** - New device logins
- **API Key Usage** - Unusual activity on API keys
- **Failed Auth Attempts** - Brute force detection

---

## Badge Behavior

### Bell Icon Badge
- **Count** - Shows total unread notifications (max display: 99+)
- **Priority Indicator** - Red pulse animation if any critical alerts
- **Color Coding:**
  - Red: Has critical alerts
  - Orange: Has warnings only
  - Blue: Has info only
  - None: All clear

---

## Notification Delivery Channels

1. **In-Dashboard** (Primary)
   - Bell icon badge
   - Notification panel

2. **Browser Notifications** (Optional, user setting)
   - Critical alerts only by default
   - Configurable in Settings

3. **Email Digest** (Optional, user setting)
   - Daily summary at 8am
   - Immediate email for critical alerts

4. **Telegram/Discord** (Future enhancement)
   - Push critical alerts to chat
   - Requires integration setup in Settings

---

## Data Model

```typescript
interface Notification {
  id: string;                    // Unique identifier
  type: 'critical' | 'warning' | 'info' | 'success';
  source: string;                // 'cost-tracking', 'deployment', 'health-check', etc.
  title: string;                 // Headline
  body: string;                  // Description (supports markdown)
  timestamp: Date;               // When notification was created
  read: boolean;                 // Read status
  acknowledged: boolean;         // User acknowledged (for critical)
  snoozedUntil?: Date;           // If snoozed
  expiresAt?: Date;              // Auto-dismiss date
  icon?: string;                 // Emoji or icon name
  metadata?: {                   // Source-specific data
    appId?: string;
    metricValue?: number;
    threshold?: number;
    url?: string;
    [key: string]: any;
  };
  actions: NotificationAction[]; // Action buttons
}

interface NotificationAction {
  label: string;                 // Button text
  type: 'primary' | 'secondary' | 'danger';
  action: 'navigate' | 'api-call' | 'dismiss' | 'external-link';
  target?: string;               // URL or API endpoint
  icon?: string;
}
```

---

## API Endpoints (Mock/Future)

### GET `/api/notifications`
**Query Params:**
- `type`: Filter by type (critical, warning, info, success)
- `source`: Filter by source (cost-tracking, deployment, etc.)
- `unread`: Boolean, only unread
- `limit`: Number of results
- `offset`: Pagination offset

**Response:**
```json
{
  "notifications": [...],
  "total": 42,
  "unreadCount": 8,
  "criticalCount": 2
}
```

### POST `/api/notifications/:id/read`
Mark notification as read.

### POST `/api/notifications/:id/acknowledge`
Mark critical notification as acknowledged.

### POST `/api/notifications/:id/snooze`
**Body:** `{ "until": "2026-02-13T10:00:00Z" }`

### DELETE `/api/notifications/:id`
Archive/delete notification.

### POST `/api/notifications/clear-read`
Archive all read notifications.

---

## Settings Integration

**Notification Preferences** (in Settings > Notifications):

1. **Delivery Channels**
   - ☑️ In-dashboard notifications
   - ☑️ Browser push notifications (Critical only / All / None)
   - ☐ Email digest (Daily / Weekly / Never)
   - ☐ Telegram alerts (requires setup)

2. **Notification Types**
   - ☑️ Critical Alerts
   - ☑️ Warnings
   - ☑️ Informational
   - ☐ Success confirmations (can disable if too noisy)

3. **Sources**
   - ☑️ System health checks
   - ☑️ Cost tracking alerts
   - ☑️ Deployment notifications
   - ☑️ Application updates
   - ☐ Calendar reminders
   - ☐ Security events

4. **Quiet Hours**
   - 🌙 Enable Do Not Disturb
   - Time range: 22:00 - 08:00 (MST)
   - Critical alerts only during quiet hours

5. **Batching**
   - Group similar notifications: ☑️
   - Max notifications per source per hour: [slider: 1-10]

---

## Implementation Phases

### Phase 1: Core Infrastructure (MVP)
- [x] Notification data model
- [x] In-memory notification store (useState)
- [x] Bell icon with badge
- [x] Notification panel UI
- [x] Basic notification items (title, body, timestamp)
- [x] Mark as read functionality
- [x] Filter by type (All, Critical, Unread)

### Phase 2: Actions & Interactivity
- [ ] Action buttons (primary, secondary)
- [ ] Snooze functionality
- [ ] Archive/delete
- [ ] Keyboard navigation (j/k to navigate, Enter to open)
- [ ] Empty states

### Phase 3: Real Data Integration
- [ ] Cost tracking alerts (integrate with CostTracking page)
- [ ] Deployment notifications (mock for now)
- [ ] Health check system (ping apps, detect downtime)
- [ ] Activity feed → notification conversion

### Phase 4: Advanced Features
- [ ] Browser push notifications (Web Push API)
- [ ] Email digest system
- [ ] Smart grouping/batching
- [ ] Notification preferences (Settings integration)
- [ ] Search notifications
- [ ] Notification history/archive

### Phase 5: External Integrations
- [ ] Telegram bot integration
- [ ] Discord webhooks
- [ ] Calendar sync (Google Calendar API)
- [ ] GitHub deployments integration

---

## Mock Data (for Development)

```typescript
const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'critical',
    source: 'cost-tracking',
    title: 'Cost Spike Detected',
    body: 'OpenClaw spent $47.32 in the last hour (215% above baseline)',
    timestamp: new Date('2026-02-12T22:34:00'),
    read: false,
    acknowledged: false,
    icon: '🚨',
    metadata: {
      currentSpend: 47.32,
      baseline: 22.00,
      percentageIncrease: 215
    },
    actions: [
      { label: 'View Costs', type: 'primary', action: 'navigate', target: '/costs' },
      { label: 'Acknowledge', type: 'secondary', action: 'dismiss' }
    ]
  },
  {
    id: 'notif-002',
    type: 'warning',
    source: 'health-check',
    title: 'Python Kanban Slow Response',
    body: 'Average response time: 3.2s (baseline: 0.8s)',
    timestamp: new Date('2026-02-12T22:15:00'),
    read: false,
    acknowledged: false,
    icon: '⚠️',
    metadata: {
      appId: 'python-kanban',
      responseTime: 3200,
      baseline: 800
    },
    actions: [
      { label: 'View Status', type: 'primary', action: 'navigate', target: '/#python-kanban' },
      { label: 'Snooze 1h', type: 'secondary', action: 'dismiss' }
    ]
  },
  {
    id: 'notif-003',
    type: 'success',
    source: 'deployment',
    title: 'Mission Control Deployed',
    body: 'Version 1.2.0 deployed successfully to production',
    timestamp: new Date('2026-02-12T21:45:00'),
    read: true,
    acknowledged: true,
    icon: '✅',
    metadata: {
      version: '1.2.0',
      environment: 'production'
    },
    actions: [
      { label: 'View Changes', type: 'primary', action: 'external-link', target: 'https://github.com/...' }
    ]
  },
  {
    id: 'notif-004',
    type: 'info',
    source: 'calendar',
    title: 'Tokyo Trip Planning Session',
    body: 'Starts in 45 minutes',
    timestamp: new Date('2026-02-12T22:00:00'),
    read: false,
    acknowledged: false,
    icon: '📅',
    metadata: {
      eventId: 'cal-123',
      startsAt: '2026-02-12T23:00:00'
    },
    actions: [
      { label: 'View Calendar', type: 'primary', action: 'navigate', target: '/calendar' },
      { label: 'Dismiss', type: 'secondary', action: 'dismiss' }
    ]
  },
  {
    id: 'notif-005',
    type: 'info',
    source: 'kanban',
    title: '3 Tasks Moved to Done',
    body: '"Fix navbar", "Add cost charts", "Deploy to Cloudflare"',
    timestamp: new Date('2026-02-12T20:30:00'),
    read: true,
    acknowledged: true,
    icon: '✅',
    metadata: {
      taskCount: 3,
      boardId: 'python-kanban'
    },
    actions: [
      { label: 'View Board', type: 'primary', action: 'external-link', target: 'https://python-kanban.pages.dev' }
    ]
  }
];
```

---

## Design Mockups (Text-Based)

### Bell Icon (Topbar)
```
Normal state:       🔔
With badge:         🔔³  (blue badge, top-right)
Critical alert:     🔔²  (red badge, pulsing)
```

### Notification Panel (Dropdown)

```
┌────────────────────────────────────────────────────┐
│ 🔔 Notifications                       [⚙️] [🗑️]   │
├────────────────────────────────────────────────────┤
│ ┌────┬──────┬────────┬─────────┐                  │
│ │All │Critical│Warning│ Unread │                  │
│ │(8) │  (2)  │  (3)  │  (5)   │                  │
│ └────┴──────┴────────┴─────────┘                  │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ 🚨 Cost Spike Detected              2m  [•] │  │
│ │ OpenClaw spent $47.32 in the last hour      │  │
│ │ (215% above baseline)                       │  │
│ │                                              │  │
│ │ [View Costs]  [Acknowledge]                 │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ⚠️ Python Kanban Slow Response     15m  [•] │  │
│ │ Average response time: 3.2s (baseline: 0.8s)│  │
│ │                                              │  │
│ │ [View Status]  [Snooze 1h]                  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ 📅 Tokyo Trip Planning Session     1h  [•]  │  │
│ │ Starts in 45 minutes                        │  │
│ │                                              │  │
│ │ [View Calendar]  [Dismiss]                  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ ✅ Mission Control Deployed        3h       │  │
│ │ Version 1.2.0 deployed successfully         │  │
│ │                                              │  │
│ │ [View Changes]                              │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│                [Load More (4 older)]               │
└────────────────────────────────────────────────────┘
```

---

## Accessibility

- **Keyboard Navigation:**
  - `Tab` to focus bell icon
  - `Enter/Space` to open panel
  - `j/k` to navigate notifications
  - `Enter` to trigger primary action
  - `Esc` to close panel

- **Screen Readers:**
  - Bell icon announces unread count: "Notifications, 5 unread, 2 critical"
  - Each notification read in full with context
  - Action buttons clearly labeled

- **Visual:**
  - Color is not sole indicator (icons + text)
  - High contrast mode support
  - Focus indicators visible

- **Reduced Motion:**
  - Disable pulsing badge animation
  - Smooth panel transitions → instant

---

## Performance Considerations

1. **Virtual Scrolling** - Render only visible notifications if list >50 items
2. **Debounced Updates** - Batch notification additions to avoid re-renders
3. **Local Storage** - Cache read/unread state to persist across sessions
4. **WebSocket (Future)** - Real-time notification delivery without polling
5. **Service Worker** - Background sync for offline notification queuing

---

## Success Metrics

- **Engagement:** % of notifications acted upon (target: >60%)
- **Time to Action:** Average time from notification to resolution (target: <5 min for critical)
- **Noise Ratio:** % of notifications dismissed without action (target: <20%)
- **False Positives:** Critical alerts that weren't actually critical (target: <5%)
- **User Satisfaction:** Weekly survey rating (target: 4.5/5)

---

## Future Enhancements

1. **AI-Powered Prioritization** - Learn from user behavior to auto-prioritize
2. **Smart Summaries** - "You have 3 deployment notifications, all successful"
3. **Voice Notifications** - "Hey Brian, critical cost alert" (OpenClaw TTS)
4. **Notification Templates** - User-defined custom notifications
5. **Integration Hub** - Connect any webhook/API as notification source
6. **Mobile App** - Native push notifications via MobileClaw

---

**End of Notifications Specification** ✅
