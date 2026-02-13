# Implementation Guide: Notifications & Settings

## Overview

This guide provides actionable steps for implementing the Notifications Bell and Settings Gear features in Mission Control, based on the detailed specifications in `NOTIFICATIONS-SPEC.md` and `SETTINGS-SPEC.md`.

---

## Quick Start: What to Build First

### **Phase 1: Core Infrastructure** (1-2 hours)
1. **Notifications Panel** - Basic UI skeleton
2. **Settings Panel** - Basic UI skeleton
3. **Data Models** - TypeScript interfaces
4. **Mock Data** - Sample notifications for testing

### **Phase 2: Functionality** (2-3 hours)
5. **Notification System** - Badge, panel, mark as read
6. **Settings Tabs** - Appearance, About sections
7. **LocalStorage** - Persist settings

### **Phase 3: Polish** (1-2 hours)
8. **Styling** - Match Mission Control theme
9. **Animations** - Smooth transitions
10. **Responsive** - Mobile-friendly

---

## File Structure

Create the following new files:

```
src/
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx          # Bell icon with badge
│   │   ├── NotificationPanel.tsx         # Dropdown panel
│   │   ├── NotificationItem.tsx          # Individual notification
│   │   └── NotificationPanel.css
│   ├── settings/
│   │   ├── SettingsPanel.tsx             # Main settings modal
│   │   ├── SettingsSidebar.tsx           # Left navigation
│   │   ├── sections/
│   │   │   ├── AppearanceSettings.tsx
│   │   │   ├── NotificationSettings.tsx
│   │   │   ├── IntegrationSettings.tsx
│   │   │   ├── CostSettings.tsx
│   │   │   ├── SecuritySettings.tsx
│   │   │   ├── DashboardSettings.tsx
│   │   │   └── AboutSettings.tsx
│   │   └── SettingsPanel.css
├── hooks/
│   ├── useNotifications.ts               # Notification state management
│   └── useSettings.ts                    # Settings state management
├── types/
│   ├── notifications.ts                  # Notification types
│   └── settings.ts                       # Settings types
└── utils/
    ├── mockNotifications.ts              # Mock notification data
    └── defaultSettings.ts                # Default settings object
```

---

## Step-by-Step Implementation

### Step 1: Create Type Definitions

**File: `src/types/notifications.ts`**

```typescript
export type NotificationType = 'critical' | 'warning' | 'info' | 'success';

export interface NotificationAction {
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: 'navigate' | 'api-call' | 'dismiss' | 'external-link';
  target?: string;
  icon?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  source: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  acknowledged: boolean;
  snoozedUntil?: Date;
  expiresAt?: Date;
  icon?: string;
  metadata?: Record<string, any>;
  actions: NotificationAction[];
}
```

**File: `src/types/settings.ts`**

```typescript
export interface UserSettings {
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    compactMode: boolean;
    animations: boolean;
    sidebarBehavior: 'push' | 'overlay' | 'visible';
  };
  // ... (see SETTINGS-SPEC.md for full interface)
}
```

---

### Step 2: Create Mock Data

**File: `src/utils/mockNotifications.ts`**

```typescript
import { Notification } from '../types/notifications';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'critical',
    source: 'cost-tracking',
    title: 'Cost Spike Detected',
    body: 'OpenClaw spent $47.32 in the last hour (215% above baseline)',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
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
  // Add more from NOTIFICATIONS-SPEC.md
];
```

**File: `src/utils/defaultSettings.ts`**

```typescript
import { UserSettings } from '../types/settings';

export const defaultSettings: UserSettings = {
  appearance: {
    theme: 'dark',
    accentColor: '#8b9bff',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    sidebarBehavior: 'push'
  },
  // ... (see SETTINGS-SPEC.md for full defaults)
};
```

---

### Step 3: Create Custom Hooks

**File: `src/hooks/useNotifications.ts`**

```typescript
import { useState, useEffect } from 'react';
import { Notification } from '../types/notifications';
import { mockNotifications } from '../utils/mockNotifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load from localStorage or use mock data
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
    } else {
      setNotifications(mockNotifications);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const acknowledge = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, acknowledged: true } : n)
    );
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.type === 'critical' && !n.acknowledged).length;
  const hasCritical = criticalCount > 0;

  return {
    notifications,
    unreadCount,
    criticalCount,
    hasCritical,
    markAsRead,
    acknowledge,
    dismiss,
    clearAllRead
  };
}
```

**File: `src/hooks/useSettings.ts`**

```typescript
import { useState, useEffect } from 'react';
import { UserSettings } from '../types/settings';
import { defaultSettings } from '../utils/defaultSettings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('userSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }, 500); // 500ms debounce

    return () => clearTimeout(timeout);
  }, [settings]);

  const updateSettings = (partial: Partial<UserSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...partial
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    resetToDefaults
  };
}
```

---

### Step 4: Build Notification Components

**File: `src/components/notifications/NotificationBell.tsx`**

```typescript
import React, { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationPanel.css';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, hasCritical } = useNotifications();

  return (
    <div className="notification-bell-container">
      <button
        className={`topbar-icon-btn ${hasCritical ? 'critical' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications, ${unreadCount} unread${hasCritical ? ', has critical alerts' : ''}`}
        title="Notifications"
      >
        <span className="icon">🔔</span>
        {unreadCount > 0 && (
          <span className={`notification-badge ${hasCritical ? 'critical' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
```

**File: `src/components/notifications/NotificationPanel.tsx`**

```typescript
import React, { useState } from 'react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import './NotificationPanel.css';

interface NotificationPanelProps {
  onClose: () => void;
}

type TabType = 'all' | 'critical' | 'unread';

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const { notifications, unreadCount, criticalCount, clearAllRead } = useNotifications();

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'critical') return n.type === 'critical';
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div className="notification-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="notification-panel">
        {/* Header */}
        <div className="notification-header">
          <h3>🔔 Notifications</h3>
          <div className="notification-header-actions">
            <button className="icon-btn" title="Notification Settings">
              ⚙️
            </button>
            <button
              className="icon-btn"
              onClick={clearAllRead}
              title="Clear All Read"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="notification-tabs">
          <button
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`tab ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            Critical ({criticalCount})
          </button>
          <button
            className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="notification-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {activeTab === 'all' ? '🌟' : '✨'}
              </div>
              <div className="empty-text">
                {activeTab === 'all'
                  ? 'All caught up!'
                  : activeTab === 'critical'
                  ? 'No critical alerts'
                  : 'No unread notifications'}
              </div>
              <div className="empty-subtext">
                {activeTab === 'all'
                  ? 'No new notifications'
                  : 'Everything running smoothly'}
              </div>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
```

**File: `src/components/notifications/NotificationItem.tsx`**

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../../types/notifications';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead, acknowledge, dismiss } = useNotifications();

  const getTypeClass = () => {
    switch (notification.type) {
      case 'critical': return 'critical';
      case 'warning': return 'warning';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  const getRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleAction = (action: any) => {
    markAsRead(notification.id);

    switch (action.action) {
      case 'navigate':
        navigate(action.target);
        break;
      case 'external-link':
        window.open(action.target, '_blank');
        break;
      case 'dismiss':
        if (notification.type === 'critical') {
          acknowledge(notification.id);
        } else {
          dismiss(notification.id);
        }
        break;
    }
  };

  return (
    <div
      className={`notification-item ${getTypeClass()} ${!notification.read ? 'unread' : ''}`}
      onClick={() => !notification.read && markAsRead(notification.id)}
    >
      <div className="notification-item-header">
        <div className="notification-title">
          {notification.icon && <span className="notification-icon">{notification.icon}</span>}
          <span>{notification.title}</span>
        </div>
        <div className="notification-time">{getRelativeTime(notification.timestamp)}</div>
      </div>

      <div className="notification-body">{notification.body}</div>

      {notification.actions.length > 0 && (
        <div className="notification-actions">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              className={`notification-action-btn ${action.type}`}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
```

---

### Step 5: Build Settings Components

**File: `src/components/settings/SettingsPanel.tsx`**

```typescript
import React, { useState } from 'react';
import SettingsSidebar from './SettingsSidebar';
import AppearanceSettings from './sections/AppearanceSettings';
import AboutSettings from './sections/AboutSettings';
// Import other sections as you build them
import { useSettings } from '../../hooks/useSettings';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsSection = 'appearance' | 'notifications' | 'integrations' | 'cost' | 'security' | 'dashboard' | 'about';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const { settings, updateSettings, resetToDefaults } = useSettings();

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSettings settings={settings} updateSettings={updateSettings} />;
      case 'about':
        return <AboutSettings />;
      // Add other sections
      default:
        return <div>Section under construction</div>;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="settings-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="settings-panel">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className="settings-main">
            {renderSection()}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
```

**File: `src/components/settings/sections/AppearanceSettings.tsx`**

```typescript
import React from 'react';
import { UserSettings } from '../../../types/settings';

interface AppearanceSettingsProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

const ACCENT_COLORS = [
  { name: 'Indigo', color: '#8b9bff', icon: '🔵' },
  { name: 'Purple', color: '#9d6cc9', icon: '🟣' },
  { name: 'Blue', color: '#3b82f6', icon: '🔷' },
  { name: 'Green', color: '#34d399', icon: '🟢' },
  { name: 'Orange', color: '#f59e0b', icon: '🟠' },
  { name: 'Red', color: '#f87171', icon: '🔴' },
];

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, updateSettings }) => {
  const updateAppearance = (key: string, value: any) => {
    updateSettings({
      appearance: {
        ...settings.appearance,
        [key]: value
      }
    });
  };

  return (
    <div className="settings-section">
      <h3>APPEARANCE</h3>

      {/* Theme */}
      <div className="setting-group">
        <label className="setting-label">Theme</label>
        <div className="radio-group">
          {['light', 'dark', 'auto'].map(theme => (
            <label key={theme} className="radio-label">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.appearance.theme === theme}
                onChange={(e) => updateAppearance('theme', e.target.value)}
              />
              <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="setting-group">
        <label className="setting-label">Accent Color</label>
        <div className="color-picker">
          {ACCENT_COLORS.map(({ name, color, icon }) => (
            <button
              key={color}
              className={`color-option ${settings.appearance.accentColor === color ? 'selected' : ''}`}
              onClick={() => updateAppearance('accentColor', color)}
              title={name}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="setting-group">
        <label className="setting-label">Font Size</label>
        <input
          type="range"
          min="0"
          max="3"
          value={['small', 'medium', 'large', 'xlarge'].indexOf(settings.appearance.fontSize)}
          onChange={(e) => {
            const sizes = ['small', 'medium', 'large', 'xlarge'];
            updateAppearance('fontSize', sizes[parseInt(e.target.value)]);
          }}
        />
        <div className="range-labels">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      {/* Toggles */}
      <div className="setting-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.appearance.compactMode}
            onChange={(e) => updateAppearance('compactMode', e.target.checked)}
          />
          <span>Compact mode</span>
        </label>
      </div>

      <div className="setting-group">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={settings.appearance.animations}
            onChange={(e) => updateAppearance('animations', e.target.checked)}
          />
          <span>Smooth animations</span>
        </label>
      </div>
    </div>
  );
};

export default AppearanceSettings;
```

---

### Step 6: Update TopBar Component

**File: `src/components/layout/TopBar.tsx`** (Update existing)

```typescript
import React, { useState } from 'react';
import NotificationBell from '../notifications/NotificationBell';
import SettingsPanel from '../settings/SettingsPanel';
import './TopBar.css';

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <button className="mobile-menu-button" onClick={onMenuClick}>
          ☰
        </button>
        <div className="topbar-brand">
          <span className="brand-icon">🚀</span>
          <h1 className="brand-title">Mission Control</h1>
        </div>
      </div>

      <div className="topbar-right">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Settings Gear */}
        <button
          className="topbar-icon-btn"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
          title="Settings"
        >
          <span className="icon">⚙️</span>
        </button>

        {/* User Menu (existing) */}
        <div className="user-menu-container">
          {/* ... existing user menu code ... */}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </header>
  );
};

export default TopBar;
```

---

### Step 7: Add CSS Styling

**File: `src/components/notifications/NotificationPanel.css`**

```css
/* Notification Bell Badge */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent-primary, #818cf8);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.notification-badge.critical {
  background: var(--status-critical, #f87171);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Notification Panel */
.notification-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.notification-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 420px;
  max-height: 600px;
  background: var(--glass-bg, rgba(17, 24, 39, 0.9));
  border: 1px solid var(--glass-border, rgba(129, 140, 248, 0.3));
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.notification-header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Tabs */
.notification-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
}

.notification-tabs .tab {
  flex: 1;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #9ca3af);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-tabs .tab.active {
  background: var(--accent-primary, #818cf8);
  color: white;
}

/* Notification List */
.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.notification-item {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid transparent;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.notification-item.unread {
  background: rgba(129, 140, 248, 0.1);
  border-left-color: var(--accent-primary, #818cf8);
}

.notification-item.critical {
  border-left-color: var(--status-critical, #f87171);
}

.notification-item.warning {
  border-left-color: var(--status-warning, #f59e0b);
}

.notification-item.success {
  border-left-color: var(--status-excellent, #34d399);
}

.notification-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.notification-time {
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
}

.notification-body {
  font-size: 13px;
  color: var(--text-secondary, #d1d5db);
  line-height: 1.4;
  margin-bottom: 12px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.notification-action-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-action-btn.primary {
  background: var(--accent-primary, #818cf8);
  color: white;
}

.notification-action-btn.primary:hover {
  background: var(--accent-primary-hover, #6d7eeb);
}

.notification-action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary, white);
}

.notification-action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, white);
  margin-bottom: 4px;
}

.empty-subtext {
  font-size: 14px;
  color: var(--text-secondary, #9ca3af);
}

/* Mobile Responsive */
@media (max-width: 767px) {
  .notification-panel {
    right: 10px;
    left: 10px;
    width: auto;
  }
}
```

**File: `src/components/settings/SettingsPanel.css`**

```css
/* Settings Panel */
.settings-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.settings-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: var(--glass-bg, rgba(17, 24, 39, 0.95));
  border: 1px solid var(--glass-border, rgba(129, 140, 248, 0.3));
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
}

.settings-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.settings-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Settings Sidebar */
.settings-sidebar {
  width: 200px;
  border-right: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
  padding: 16px 0;
  overflow-y: auto;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  color: var(--text-secondary, #9ca3af);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.settings-nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary, white);
}

.settings-nav-item.active {
  background: rgba(129, 140, 248, 0.1);
  border-left-color: var(--accent-primary, #818cf8);
  color: var(--accent-primary, #818cf8);
}

/* Settings Main Content */
.settings-main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.settings-section h3 {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary, #9ca3af);
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-primary, white);
}

/* Radio Buttons */
.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary, #d1d5db);
}

.radio-label input[type="radio"] {
  accent-color: var(--accent-primary, #818cf8);
}

/* Color Picker */
.color-picker {
  display: flex;
  gap: 12px;
}

.color-option {
  font-size: 28px;
  background: none;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--accent-primary, #818cf8);
  background: rgba(129, 140, 248, 0.1);
}

/* Range Slider */
input[type="range"] {
  width: 100%;
  accent-color: var(--accent-primary, #818cf8);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
  margin-top: 4px;
}

/* Toggle Switch */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary, white);
}

.toggle-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary, #818cf8);
  cursor: pointer;
}

/* Mobile Responsive */
@media (max-width: 767px) {
  .settings-panel {
    width: 100%;
    max-width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    top: 0;
    left: 0;
    transform: none;
  }

  .settings-content {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.1));
    padding: 8px 0;
  }

  .settings-nav-item {
    border-left: none;
    border-bottom: 3px solid transparent;
  }

  .settings-nav-item.active {
    border-bottom-color: var(--accent-primary, #818cf8);
  }
}
```

---

## Testing Checklist

### Notifications
- [ ] Bell icon displays unread count
- [ ] Badge turns red and pulses for critical alerts
- [ ] Clicking bell opens/closes panel
- [ ] Tabs filter notifications correctly
- [ ] Mark as read works
- [ ] Acknowledge works for critical
- [ ] Action buttons navigate correctly
- [ ] Clear all read removes read notifications
- [ ] Empty states display correctly
- [ ] Relative timestamps update
- [ ] Mobile responsive

### Settings
- [ ] Gear icon opens panel
- [ ] Close button/backdrop closes panel
- [ ] Sidebar navigation switches sections
- [ ] Theme selection works
- [ ] Accent color changes apply
- [ ] Font size slider works
- [ ] Toggles save to localStorage
- [ ] Settings persist across page refresh
- [ ] Mobile responsive (full-screen modal)
- [ ] Reset to defaults confirmation

---

## Next Steps: Real Data Integration

### Phase 1: Cost Tracking Integration
1. Create cost monitoring service
2. Detect spikes in real-time
3. Generate critical notifications when thresholds exceeded

### Phase 2: Health Monitoring
1. Ping all apps every 5 minutes
2. Generate warnings for slow response times
3. Generate critical alerts for downtime

### Phase 3: Deployment Tracking
1. Connect to GitHub/Cloudflare webhooks
2. Generate notifications on deploy success/failure

### Phase 4: Backend API
1. Build REST API for settings/notifications
2. Replace localStorage with database
3. Support multiple users

---

## Tips for Implementation

1. **Start Small** - Build notification bell → panel → settings in order
2. **Use Mock Data** - Test UI with mockNotifications.ts before real data
3. **Test Responsively** - Check mobile view at every step
4. **Save Often** - localStorage persistence is crucial for UX
5. **Accessibility** - Test keyboard navigation (Tab, Enter, Esc)
6. **Performance** - Use React.memo for NotificationItem if list >50 items

---

**End of Implementation Guide** 🚀
