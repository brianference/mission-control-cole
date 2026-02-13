# Settings Panel Specification

## Overview

The **Settings Gear Icon** (⚙️) in the top-right corner provides access to Mission Control's comprehensive configuration panel. It allows Brian to customize the dashboard experience, manage integrations, configure notifications, and control system-wide preferences.

---

## Design Principles

1. **Organized & Scannable** - Clear categories, logical grouping
2. **Progressive Disclosure** - Show simple options first, advanced settings behind toggles
3. **Instant Feedback** - Changes apply immediately (or show save indicator)
4. **Sensible Defaults** - Works great out of the box
5. **Dangerous Actions Protected** - Confirmations for destructive operations

---

## Settings Panel Layout

### Navigation Structure

```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Settings                             [×]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌─────────────────────────────┐│
│  │              │  │                             ││
│  │ 🎨 Appearance│  │   APPEARANCE                ││
│  │              │  │                             ││
│  │ 🔔 Notifications│   Theme: [Dark ▼]          ││
│  │              │  │   ○ Light  ● Dark  ○ Auto  ││
│  │ 🔗 Integration│   Accent Color:             ││
│  │              │  │   [Indigo] [Purple] [Blue] ││
│  │ 💰 Cost Mgmt │   ...                          ││
│  │              │  │                             ││
│  │ 🔐 Security  │  │                             ││
│  │              │  │                             ││
│  │ ℹ️ About     │  │                             ││
│  │              │  │                             ││
│  └──────────────┘  └─────────────────────────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Panel Behavior:**
- Opens as modal overlay (full-screen on mobile, 800px wide panel on desktop)
- Sidebar navigation on left, content panel on right
- Settings auto-save to localStorage (or backend API in future)
- Close button (×) or click outside to close

---

## Settings Categories

### 1. 🎨 **Appearance**

Customize the dashboard's visual appearance.

#### **Theme**
- **Options:** Light, Dark, Auto (system preference)
- **Default:** Dark
- **Note:** Auto mode respects OS dark mode setting

#### **Accent Color**
- **Presets:**
  - 🔵 Indigo (default) - `#8b9bff`
  - 🟣 Purple - `#9d6cc9`
  - 🔷 Blue - `#3b82f6`
  - 🟢 Green - `#34d399`
  - 🟠 Orange - `#f59e0b`
  - 🔴 Red - `#f87171`
- **Custom Color Picker** (advanced option)

#### **Font Size**
- **Slider:** Small → Medium (default) → Large → Extra Large
- **Range:** 14px - 20px base font size

#### **Compact Mode**
- **Toggle:** ☐ Enable compact mode
- **Effect:** Reduces padding/spacing for information density
- **Use Case:** High-res displays, power users

#### **Animations**
- **Toggle:** ☑️ Enable smooth animations
- **Fallback:** Respects `prefers-reduced-motion`

#### **Sidebar Behavior (Mobile)**
- **Options:** 
  - Push (default) - Pushes content when open
  - Overlay - Floats over content
  - Always Visible (tablet+)

---

### 2. 🔔 **Notifications**

Configure how and when you receive notifications.

#### **Delivery Channels**

**In-Dashboard Notifications**
- ☑️ Always enabled (core feature)

**Browser Push Notifications**
- ☐ Enable browser notifications
- **Granularity:**
  - ○ Critical alerts only
  - ○ Critical + Warnings
  - ○ All notifications

**Email Digest**
- ☐ Send daily email summary
- **Time:** [08:00] MST
- **Email:** brian@example.com (editable)
- **Include:**
  - ☑️ Critical alerts
  - ☑️ Cost summary
  - ☑️ Deployment activity
  - ☐ Application updates

**External Integrations** (requires setup)
- ☐ Telegram alerts → [Configure]
- ☐ Discord webhooks → [Configure]
- ☐ Slack integration → [Configure]

---

#### **Notification Types**

**Priority Filtering**
- ☑️ Critical Alerts (cannot disable)
- ☑️ Warnings
- ☑️ Informational
- ☐ Success confirmations

**Source Filtering**
- ☑️ System health checks
- ☑️ Cost tracking alerts
- ☑️ Deployment notifications
- ☑️ Application updates
- ☐ Calendar reminders
- ☐ Security events
- ☐ Third-party integrations

---

#### **Quiet Hours**

**Do Not Disturb Mode**
- ☐ Enable quiet hours
- **Time Range:** [22:00] - [08:00] MST
- **Behavior:**
  - ○ Critical alerts only
  - ○ No notifications at all
  - ● Critical + urgent warnings

**Weekend Mode**
- ☐ Reduce non-critical notifications on weekends

---

#### **Notification Behavior**

**Batching & Grouping**
- ☑️ Group similar notifications
- **Max per source per hour:** [slider: 1-10] (default: 3)

**Auto-Dismiss**
- ☑️ Auto-dismiss read notifications
- **After:** [dropdown: 1 day / 3 days / 7 days / Never] (default: 3 days)

**Sound Effects**
- ☐ Play sound for critical alerts
- **Sound:** [dropdown: Default / Bell / Chime / None]

---

### 3. 🔗 **Integrations**

Connect Mission Control to external services and APIs.

#### **Connected Apps**

**Current Integrations:**

1. **Python Kanban**
   - Status: ✅ Connected
   - URL: `https://python-kanban.pages.dev`
   - Last Sync: 2 minutes ago
   - [Refresh] [Disconnect]

2. **Second Brain**
   - Status: ✅ Connected
   - URL: `https://second-brain-cole.pages.dev`
   - Last Sync: 15 minutes ago
   - [Refresh] [Disconnect]

3. **Secret Vault**
   - Status: ✅ Connected
   - URL: `https://secret-vault-9r3.pages.dev`
   - Last Sync: 1 hour ago
   - [Refresh] [Disconnect]

4. **Tokyo Trip Planner**
   - Status: ✅ Connected
   - URL: `https://tokyo-osaka-trip-2026.netlify.app`
   - Last Sync: 3 hours ago
   - [Refresh] [Disconnect]

---

#### **Available Integrations**

**Monitoring & Analytics**
- ☐ **Uptime Robot** - Website uptime monitoring
  - [Connect with API Key]
- ☐ **Sentry** - Error tracking
  - [Connect with DSN]
- ☐ **Google Analytics** - Traffic analytics
  - [Authorize with Google]

**Development**
- ☐ **GitHub** - Repository activity, deployments
  - [Authorize with GitHub]
  - Webhooks: Push events, deployment status
- ☐ **Cloudflare** - Deployment notifications, analytics
  - [Connect with API Token]
- ☐ **Vercel** - Deployment status
  - [Connect with API Token]

**Communication**
- ☐ **Telegram Bot** - Push notifications to Telegram
  - [Setup Bot] → Instructions
- ☐ **Discord Webhook** - Push to Discord channel
  - Webhook URL: [input field]
  - [Test Webhook] [Save]
- ☐ **Slack** - Workspace notifications
  - [Add to Slack]

**Calendar & Tasks**
- ☐ **Google Calendar** - Event sync, reminders
  - [Authorize with Google]
- ☐ **Todoist** - Task sync (alternative to Kanban)
  - [Connect with API Key]

**Cost Tracking**
- ☑️ **OpenClaw API** - Built-in cost tracking
  - Auto-configured
- ☐ **Cloudflare Workers Analytics**
  - [Connect with Account ID]

---

#### **Webhooks (Advanced)**

**Custom Webhooks**
- Add custom webhook endpoints to receive Mission Control events
- Use cases: Custom integrations, IFTTT, Zapier

**Outgoing Webhooks:**

| Event | URL | Status | Actions |
|-------|-----|--------|---------|
| deployment.success | https://hooks.example.com/deploy | ✅ Active | [Edit] [Delete] |
| cost.spike | https://hooks.example.com/cost | ✅ Active | [Edit] [Delete] |

[+ Add Webhook]

**Incoming Webhooks:**
- Unique URL: `https://mission-control-cole.pages.dev/api/webhook/abc123xyz`
- [Regenerate] [Copy]
- Accepts JSON payloads, creates notifications

---

### 4. 💰 **Cost Management**

Configure cost tracking, budgets, and alerts.

#### **Budget Settings**

**Daily Budget**
- ☑️ Enable daily budget alert
- **Threshold:** $[50.00] USD
- **Alert at:** [80%] of budget

**Weekly Budget**
- ☑️ Enable weekly budget alert
- **Threshold:** $[300.00] USD
- **Alert at:** [90%] of budget

**Monthly Budget**
- ☑️ Enable monthly budget alert
- **Threshold:** $[1000.00] USD
- **Alert at:** [90%] of budget

---

#### **Spike Detection**

**Anomaly Detection**
- ☑️ Enable cost spike detection
- **Sensitivity:** [slider: Low → Medium (default) → High → Very High]
- **Trigger:** Spending exceeds [200%] of baseline

**Auto-Actions**
- ☐ Pause non-critical cron jobs on spike
- ☐ Send emergency alert (email + push)
- ☐ Auto-scale down workers (requires integration)

---

#### **Cost Optimization**

**Recommendations**
- ☑️ Show cost optimization suggestions
- **Frequency:** Weekly summary every Monday

**Auto-Optimize**
- ☐ Enable automatic optimizations (experimental)
- Examples: Reduce cron frequency, switch to cheaper models

**Reporting**
- ☑️ Weekly cost report (email)
- ☑️ Monthly cost summary
- **Recipients:** brian@example.com [+ Add]

---

#### **Provider Preferences**

**Default Model Selection**
- **Primary Model:** [dropdown: Claude Sonnet 4.5 / GPT-4 / Gemini Pro]
- **Fallback Model:** [dropdown: Claude Sonnet 3.5 / GPT-3.5]

**Cost Caps (per provider)**
| Provider | Daily Cap | Monthly Cap | Status |
|----------|-----------|-------------|--------|
| Anthropic | $30.00 | $500.00 | ✅ Active |
| OpenAI | $20.00 | $300.00 | ✅ Active |
| Google | $10.00 | $100.00 | ⏸️ Paused |

[Edit Caps]

---

### 5. 🔐 **Security & Privacy**

Configure security settings and privacy controls.

#### **Authentication**

**Session Management**
- **Current Session:** Desktop - Chrome (Phoenix, AZ)
- **Last Login:** Feb 12, 2026 at 22:15 MST
- **Active Sessions:** [1]
  - [View All Sessions] → List with [Revoke] option

**Password & Access**
- **Change Password:** [Change Password]
- **Two-Factor Authentication:**
  - ☐ Enable 2FA
  - [Setup 2FA] → QR code + recovery codes

**API Keys**
- **Mission Control API Key:** `mc_••••••••••••xyz` [Show] [Regenerate]
- **Webhook Secret:** `whsec_••••••••••••abc` [Show] [Regenerate]
- ⚠️ Warning: Regenerating keys will invalidate existing integrations

---

#### **Privacy**

**Data Collection**
- ☑️ Anonymous usage analytics (helps improve Mission Control)
- ☐ Share performance metrics with OpenClaw team
- ☑️ Local storage only (no cloud backup)

**Activity Logging**
- ☑️ Log user actions (for debugging)
- **Retention:** [dropdown: 7 days / 30 days / 90 days / Forever]
- [View Activity Log] [Clear Log]

**Third-Party Access**
- **Connected Apps:** 4 apps have read access
- [Manage App Permissions]

---

#### **Backup & Export**

**Data Export**
- [Export All Settings] → JSON file
- [Export Notification History] → JSONL file
- [Export Activity Log] → CSV file

**Backup**
- ☐ Auto-backup settings to GitHub Gist
- **Frequency:** Daily
- [Configure Backup]

**Import**
- [Import Settings from File]
- Supports: JSON settings exports

---

### 6. 🎯 **Dashboard**

Configure dashboard behavior and default views.

#### **Home Page**

**Default View**
- ○ Overview (all apps)
- ○ Cost Tracking
- ○ Ideas
- ○ Custom (select page)

**Pinned Sections**
- ☑️ System Health
- ☑️ Quick Stats
- ☑️ Recent Activity
- ☐ Cost Summary
- ☐ Upcoming Calendar Events

---

#### **App Cards**

**Visible Apps**
- ☑️ Python Kanban
- ☑️ Second Brain
- ☑️ Secret Vault
- ☑️ Tokyo Trip
- ☑️ Mission Control (meta)
- ☐ Custom App 1 [+ Add Custom App]

**Card Order**
- [Drag to reorder] (future enhancement)
- Currently: Alphabetical

**Card Layout**
- ○ Grid (default) - 2-3 columns
- ○ List - Single column, more details

---

#### **Activity Feed**

**Sources**
- ☑️ Deployments
- ☑️ Cost events
- ☑️ System health changes
- ☑️ Application updates
- ☐ Calendar events
- ☐ Task completions

**Auto-Refresh**
- ☑️ Enable auto-refresh
- **Interval:** [dropdown: 30s / 1m / 5m / 10m] (default: 1m)

**Item Limit**
- Show last [10] items (max: 50)

---

#### **Quick Actions**

**Enabled Quick Actions** (in sidebar or quick access bar)
- ☑️ Open Kanban
- ☑️ Open Second Brain
- ☑️ View Costs
- ☑️ Check Calendar
- ☐ Add Idea
- ☐ Create Task

---

### 7. ℹ️ **About**

Information about Mission Control and system status.

#### **Version Information**

**Mission Control Dashboard**
- **Version:** 1.2.0
- **Build:** 20260212-2215
- **Environment:** Production
- **Deployed:** Feb 12, 2026 at 21:45 MST
- **URL:** https://mission-control-cole.pages.dev

**Dependencies**
- React: 18.3.1
- TypeScript: 5.6.2
- Vite: 5.4.2
- [View All Dependencies]

---

#### **System Status**

**Health Checks**
- ✅ All systems operational
- **Uptime:** 99.97% (last 30 days)
- **Last Incident:** None
- [View Status Page]

**Performance**
- **Page Load:** 0.8s (excellent)
- **API Response:** 120ms avg
- **Lighthouse Score:** 98/100

---

#### **Resources**

**Documentation**
- [📖 User Guide] → Comprehensive guide
- [🔧 API Documentation] → For integrations
- [💡 Feature Requests] → Submit ideas
- [🐛 Report Bug] → GitHub issues

**Legal**
- [Privacy Policy]
- [Terms of Service]
- [License] (MIT)

**Credits**
- Built with ❤️ by Brian
- Powered by OpenClaw + Morpheus
- Icons: Lucide React
- Hosting: Cloudflare Pages

---

#### **Support**

**Get Help**
- [📧 Email Support] → brian@example.com
- [💬 Community Discord] → discord.gg/...
- [📝 GitHub Discussions] → github.com/...

**Diagnostic Tools**
- [Run System Check] → Checks all integrations
- [Test Notifications] → Send test notification
- [Clear Cache] → Reset local storage
- [Reset to Defaults] → ⚠️ Dangerous action

---

## Settings Panel UI Components

### Component Library

#### **Toggle Switch**
```
☑️ Enable feature
```

#### **Radio Buttons**
```
○ Option 1
● Option 2 (selected)
○ Option 3
```

#### **Dropdown**
```
Theme: [Dark ▼]
```

#### **Slider**
```
Font Size:  ●━━━━━━━━━━  Large
           Small          Extra Large
```

#### **Color Picker**
```
Accent Color: 🔵 🟣 🔷 🟢 🟠 🔴 [Custom...]
```

#### **Input Field**
```
Email: [brian@example.com]
```

#### **Button Variants**
- **Primary:** `[Save Changes]`
- **Secondary:** `[Cancel]`
- **Danger:** `[Delete Account]` (red, requires confirmation)

#### **Section Header**
```
APPEARANCE
────────────────
```

#### **Info Box**
```
┌────────────────────────────────────────┐
│ ℹ️ Tip: Enable compact mode for more   │
│   information density on large screens │
└────────────────────────────────────────┘
```

#### **Warning Box**
```
┌────────────────────────────────────────┐
│ ⚠️ Warning: Regenerating API keys will │
│   break existing integrations          │
└────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface UserSettings {
  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    accentColor: string;  // hex color
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    compactMode: boolean;
    animations: boolean;
    sidebarBehavior: 'push' | 'overlay' | 'visible';
  };
  
  // Notifications
  notifications: {
    channels: {
      inDashboard: boolean;
      browserPush: 'none' | 'critical' | 'critical-warnings' | 'all';
      emailDigest: boolean;
      emailTime: string;  // "08:00"
      emailAddress: string;
      telegram: boolean;
      discord: boolean;
      slack: boolean;
    };
    types: {
      critical: boolean;
      warnings: boolean;
      info: boolean;
      success: boolean;
    };
    sources: {
      healthChecks: boolean;
      costTracking: boolean;
      deployments: boolean;
      appUpdates: boolean;
      calendar: boolean;
      security: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string;  // "22:00"
      end: string;    // "08:00"
      mode: 'critical-only' | 'none' | 'critical-urgent';
    };
    weekendMode: boolean;
    batching: {
      enabled: boolean;
      maxPerSourcePerHour: number;
    };
    autoDismiss: {
      enabled: boolean;
      after: '1d' | '3d' | '7d' | 'never';
    };
    sound: 'default' | 'bell' | 'chime' | 'none';
  };
  
  // Integrations
  integrations: {
    apps: Array<{
      id: string;
      name: string;
      url: string;
      connected: boolean;
      lastSync?: Date;
    }>;
    webhooks: {
      outgoing: Array<{
        event: string;
        url: string;
        enabled: boolean;
      }>;
      incoming: {
        url: string;
        secret: string;
      };
    };
  };
  
  // Cost Management
  costManagement: {
    budgets: {
      daily: { enabled: boolean; amount: number; alertAt: number };
      weekly: { enabled: boolean; amount: number; alertAt: number };
      monthly: { enabled: boolean; amount: number; alertAt: number };
    };
    spikeDetection: {
      enabled: boolean;
      sensitivity: 'low' | 'medium' | 'high' | 'very-high';
      threshold: number;  // percentage
    };
    optimization: {
      showRecommendations: boolean;
      autoOptimize: boolean;
      weeklyReport: boolean;
      monthlyReport: boolean;
    };
    providerPreferences: {
      primaryModel: string;
      fallbackModel: string;
      caps: Record<string, { daily: number; monthly: number }>;
    };
  };
  
  // Security
  security: {
    twoFactorEnabled: boolean;
    apiKey: string;
    webhookSecret: string;
    activityLogRetention: '7d' | '30d' | '90d' | 'forever';
  };
  
  // Privacy
  privacy: {
    anonymousAnalytics: boolean;
    shareMetrics: boolean;
    localStorageOnly: boolean;
    autoBackup: boolean;
  };
  
  // Dashboard
  dashboard: {
    defaultView: string;  // page path
    pinnedSections: string[];
    visibleApps: string[];
    cardLayout: 'grid' | 'list';
    activityFeed: {
      sources: string[];
      autoRefresh: boolean;
      interval: '30s' | '1m' | '5m' | '10m';
      itemLimit: number;
    };
    quickActions: string[];
  };
}
```

---

## API Endpoints (Mock/Future)

### GET `/api/settings`
Fetch current user settings.

**Response:**
```json
{
  "settings": { ...UserSettings }
}
```

### PUT `/api/settings`
Update user settings (partial update).

**Body:**
```json
{
  "appearance": {
    "theme": "dark",
    "accentColor": "#8b9bff"
  }
}
```

### POST `/api/settings/reset`
Reset all settings to defaults.

### GET `/api/integrations`
List all available integrations.

### POST `/api/integrations/:id/connect`
Connect an integration.

**Body:** Integration-specific auth credentials.

### DELETE `/api/integrations/:id`
Disconnect an integration.

### POST `/api/webhooks/outgoing`
Add a new outgoing webhook.

### POST `/api/settings/export`
Export all settings as JSON file.

---

## Implementation Phases

### Phase 1: Core Settings UI (MVP)
- [x] Settings modal/panel structure
- [x] Sidebar navigation
- [x] Appearance section (theme, accent color)
- [x] About section (version, system info)
- [x] Save settings to localStorage

### Phase 2: Notifications Settings
- [ ] Full notification preferences UI
- [ ] Integration with notification system
- [ ] Quiet hours configuration
- [ ] Test notification button

### Phase 3: Integrations
- [ ] Connected apps list
- [ ] App connection/disconnection flow
- [ ] Webhook configuration UI
- [ ] Integration status indicators

### Phase 4: Cost Management
- [ ] Budget configuration
- [ ] Spike detection settings
- [ ] Provider preferences
- [ ] Cost caps management

### Phase 5: Advanced Features
- [ ] Security settings (2FA, API keys)
- [ ] Privacy controls
- [ ] Data export/import
- [ ] Auto-backup to GitHub Gist
- [ ] Dashboard customization (drag-drop cards)

### Phase 6: Backend Integration
- [ ] Settings API endpoints
- [ ] Sync settings across devices
- [ ] User authentication
- [ ] Real integration connections (GitHub, Telegram, etc.)

---

## Default Settings (Fresh Install)

```typescript
const defaultSettings: UserSettings = {
  appearance: {
    theme: 'dark',
    accentColor: '#8b9bff',  // Indigo
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    sidebarBehavior: 'push'
  },
  notifications: {
    channels: {
      inDashboard: true,
      browserPush: 'critical',
      emailDigest: false,
      emailTime: '08:00',
      emailAddress: '',
      telegram: false,
      discord: false,
      slack: false
    },
    types: {
      critical: true,
      warnings: true,
      info: true,
      success: false
    },
    sources: {
      healthChecks: true,
      costTracking: true,
      deployments: true,
      appUpdates: true,
      calendar: false,
      security: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      mode: 'critical-only'
    },
    weekendMode: false,
    batching: {
      enabled: true,
      maxPerSourcePerHour: 3
    },
    autoDismiss: {
      enabled: true,
      after: '3d'
    },
    sound: 'none'
  },
  integrations: {
    apps: [
      { id: 'python-kanban', name: 'Python Kanban', url: 'https://python-kanban.pages.dev', connected: true },
      { id: 'second-brain', name: 'Second Brain', url: 'https://second-brain-cole.pages.dev', connected: true },
      { id: 'secret-vault', name: 'Secret Vault', url: 'https://secret-vault-9r3.pages.dev', connected: true },
      { id: 'tokyo-trip', name: 'Tokyo Trip', url: 'https://tokyo-osaka-trip-2026.netlify.app', connected: true }
    ],
    webhooks: {
      outgoing: [],
      incoming: {
        url: '',
        secret: ''
      }
    }
  },
  costManagement: {
    budgets: {
      daily: { enabled: true, amount: 50, alertAt: 80 },
      weekly: { enabled: true, amount: 300, alertAt: 90 },
      monthly: { enabled: true, amount: 1000, alertAt: 90 }
    },
    spikeDetection: {
      enabled: true,
      sensitivity: 'medium',
      threshold: 200
    },
    optimization: {
      showRecommendations: true,
      autoOptimize: false,
      weeklyReport: true,
      monthlyReport: true
    },
    providerPreferences: {
      primaryModel: 'anthropic/claude-sonnet-4-5',
      fallbackModel: 'anthropic/claude-sonnet-3-5',
      caps: {
        'Anthropic': { daily: 30, monthly: 500 },
        'OpenAI': { daily: 20, monthly: 300 },
        'Google': { daily: 10, monthly: 100 }
      }
    }
  },
  security: {
    twoFactorEnabled: false,
    apiKey: '',  // Generated on first load
    webhookSecret: '',  // Generated on first load
    activityLogRetention: '30d'
  },
  privacy: {
    anonymousAnalytics: true,
    shareMetrics: false,
    localStorageOnly: true,
    autoBackup: false
  },
  dashboard: {
    defaultView: '/',
    pinnedSections: ['system-health', 'quick-stats', 'recent-activity'],
    visibleApps: ['python-kanban', 'second-brain', 'secret-vault', 'tokyo-trip', 'mission-control'],
    cardLayout: 'grid',
    activityFeed: {
      sources: ['deployments', 'cost-events', 'health-changes', 'app-updates'],
      autoRefresh: true,
      interval: '1m',
      itemLimit: 10
    },
    quickActions: ['open-kanban', 'open-brain', 'view-costs', 'check-calendar']
  }
};
```

---

## Design Mockups (Text-Based)

### Settings Icon (Topbar)
```
Normal:        ⚙️
On hover:      ⚙️ (slight rotation animation)
Settings open: ⚙️ (highlighted)
```

### Settings Panel (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                                    [×]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────┐  ┌──────────────────────────────────────────┐  │
│  │                │  │  APPEARANCE                              │  │
│  │  🎨 Appearance │  │                                          │  │
│  │                │  │  Theme                                   │  │
│  │  🔔 Notifs     │  │  ○ Light  ● Dark  ○ Auto (system)       │  │
│  │                │  │                                          │  │
│  │  🔗 Integrate  │  │  Accent Color                           │  │
│  │                │  │  [🔵] [🟣] [🔷] [🟢] [🟠] [🔴]          │  │
│  │  💰 Cost Mgmt  │  │   ↑ Indigo (selected)                   │  │
│  │                │  │                                          │  │
│  │  🔐 Security   │  │  Font Size                              │  │
│  │                │  │  Small  ●━━━━━  Large                   │  │
│  │  🎯 Dashboard  │  │                                          │  │
│  │                │  │  ☐ Compact mode                         │  │
│  │  ℹ️ About      │  │  ☑️ Smooth animations                   │  │
│  │                │  │                                          │  │
│  └────────────────┘  │  ──────────────────────────────────      │  │
│                      │                                          │  │
│                      │  Sidebar Behavior (Mobile)               │  │
│                      │  ● Push  ○ Overlay  ○ Always Visible    │  │
│                      │                                          │  │
│                      └──────────────────────────────────────────┘  │
│                                                                      │
│  Changes saved automatically                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile Settings View

```
┌─────────────────────────────────┐
│ ← Settings                  [×] │
├─────────────────────────────────┤
│                                 │
│  🎨 Appearance              >   │
│  🔔 Notifications           >   │
│  🔗 Integrations            >   │
│  💰 Cost Management         >   │
│  🔐 Security & Privacy      >   │
│  🎯 Dashboard               >   │
│  ℹ️ About                   >   │
│                                 │
└─────────────────────────────────┘

(Tap category → Full-screen panel with back button)
```

---

## Accessibility

- **Keyboard Navigation:**
  - `Tab` to navigate sections
  - `Enter/Space` to toggle switches
  - `Arrow keys` for radio buttons, sliders
  - `Esc` to close panel

- **Screen Readers:**
  - All controls properly labeled
  - Toggle state announced ("Theme: Dark, selected")
  - Section landmarks for navigation

- **Visual:**
  - High contrast mode support
  - Color-blind safe (not relying on color alone)
  - Focus indicators visible

- **Reduced Motion:**
  - Settings panel respects `prefers-reduced-motion`
  - Toggle animations setting takes effect immediately

---

## Validation & Error Handling

### Input Validation

- **Email:** Valid email format
- **Budget Amounts:** Positive numbers, max $10,000
- **Time Fields:** Valid 24-hour format (HH:MM)
- **URLs:** Valid HTTP/HTTPS URLs
- **API Keys:** Min 20 characters, alphanumeric

### Error States

**Invalid Input:**
```
Email: [invalid-email]
       ❌ Please enter a valid email address
```

**Integration Error:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Failed to connect to GitHub          │
│    Reason: Invalid API token            │
│    [Retry] [Documentation]              │
└─────────────────────────────────────────┘
```

**Save Error:**
```
┌─────────────────────────────────────────┐
│ ❌ Failed to save settings               │
│    Your changes were not saved.         │
│    [Retry] [Restore Defaults]           │
└─────────────────────────────────────────┘
```

---

## Confirmation Dialogs

### Dangerous Actions

**Reset to Defaults:**
```
┌─────────────────────────────────────────┐
│  ⚠️ Reset All Settings?                 │
│                                         │
│  This will restore all settings to      │
│  default values. This cannot be undone. │
│                                         │
│  [Cancel]  [Reset Settings]             │
└─────────────────────────────────────────┘
```

**Disconnect Integration:**
```
┌─────────────────────────────────────────┐
│  🔌 Disconnect Python Kanban?           │
│                                         │
│  You'll stop receiving updates from     │
│  this app. You can reconnect anytime.   │
│                                         │
│  [Cancel]  [Disconnect]                 │
└─────────────────────────────────────────┘
```

**Regenerate API Key:**
```
┌─────────────────────────────────────────┐
│  🔑 Regenerate API Key?                 │
│                                         │
│  This will invalidate your current key  │
│  and break existing integrations.       │
│                                         │
│  [Cancel]  [Regenerate]                 │
└─────────────────────────────────────────┘
```

---

## Performance Considerations

1. **Lazy Loading** - Load settings sections on-demand (code splitting)
2. **Debounced Saves** - Wait 500ms after last change before saving
3. **LocalStorage** - Cache settings locally to avoid API calls
4. **Optimistic Updates** - Update UI immediately, sync in background
5. **Minimal Re-renders** - Use React.memo for sections

---

## Success Metrics

- **Settings Usage:** % of users who open settings (target: >40%)
- **Customization Rate:** % of users who change default settings (target: >50%)
- **Integration Adoption:** Avg # of connected integrations per user (target: >2)
- **Preference Retention:** % of users who keep custom settings >1 month (target: >80%)

---

## Future Enhancements

1. **Profiles** - Switch between "Work" and "Personal" setting profiles
2. **Sync Across Devices** - Backend sync via user account
3. **Import/Export Templates** - Share setting configurations
4. **A/B Testing** - Built-in feature flags for experimenting
5. **Voice Control** - "Hey Brian, enable dark mode"
6. **Mobile App** - Native settings app (iOS/Android)
7. **Team Settings** - Multi-user organizations with shared configs
8. **AI Recommendations** - "We noticed you check costs often, enable daily digest?"

---

**End of Settings Specification** ✅
