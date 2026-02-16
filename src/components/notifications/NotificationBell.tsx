import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

export interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'model' | 'agent' | 'cron' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  action?: () => void;
}

interface UsageData {
  daily: Array<{
    date: string;
    cost: number;
    requests?: number;
    byModel?: Record<string, { cost: number; requests: number }>;
    byProvider?: Record<string, { cost: number; requests: number }>;
  }>;
  models: Array<{ name: string; cost: number; requests: number }>;
  providers: Array<{ name: string; cost: number; requests: number }>;
  summary?: { weekTotal: number; monthTotal: number };
}

const NOTIFICATION_SOURCES = {
  localStorage: 'missionControlNotifications',
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate recommendations from REAL usage data
  const generateRecommendationNotifications = useCallback(async (): Promise<Notification[]> => {
    try {
      const response = await fetch('/usage-data.json');
      const data: UsageData = await response.json();
      const now = new Date();
      const recs: Notification[] = [];

      // Get recent data
      const recentDays = data.daily.slice(-7);
      const todayData = data.daily[data.daily.length - 1];

      // === MODEL COST OPTIMIZATION NOTIFICATIONS ===
      const opusUsage = data.models.find(m => m.name.includes('opus'));
      if (opusUsage && opusUsage.cost > 100) {
        recs.push({
          id: `rec-model-opus-${now.getTime()}`,
          type: 'warning',
          category: 'model',
          title: '🧠 Model Cost Optimization',
          message: `Opus usage: $${opusUsage.cost.toFixed(2)} (${opusUsage.requests} requests). Consider Sonnet for routine tasks.`,
          timestamp: now,
          read: false,
          link: '/costs'
        });
      }

      // Check for Sonnet overuse
      const sonnetUsage = data.models.find(m => m.name.includes('sonnet'));
      const haikuUsage = data.models.find(m => m.name.includes('haiku'));
      if (sonnetUsage && haikuUsage && sonnetUsage.requests > haikuUsage.requests * 3) {
        recs.push({
          id: `rec-model-sonnet-${now.getTime()}`,
          type: 'info',
          category: 'model',
          title: '🧠 Model Balance',
          message: `Sonnet: ${sonnetUsage.requests} vs Haiku: ${haikuUsage.requests} requests. Route simple tasks to Haiku.`,
          timestamp: now,
          read: false,
          link: '/costs'
        });
      }

      // === AGENT OPTIMIZATION NOTIFICATIONS ===
      const avgDailyCost = recentDays.reduce((sum, d) => sum + d.cost, 0) / recentDays.length;
      if (todayData && todayData.cost > avgDailyCost * 1.3) {
        recs.push({
          id: `rec-agent-spike-${now.getTime()}`,
          type: 'warning',
          category: 'agent',
          title: '🤖 Agent Cost Alert',
          message: `Today's cost ($${todayData.cost.toFixed(2)}) is ${Math.round((todayData.cost / avgDailyCost - 1) * 100)}% above average.`,
          timestamp: now,
          read: false,
          link: '/agents'
        });
      }

      // Check request efficiency
      const totalRequests = recentDays.reduce((sum, d) => sum + (d.requests || 0), 0);
      const totalCost = recentDays.reduce((sum, d) => sum + d.cost, 0);
      if (totalRequests > 0 && (totalCost / totalRequests) > 0.08) {
        recs.push({
          id: `rec-agent-efficiency-${now.getTime()}`,
          type: 'info',
          category: 'agent',
          title: '🤖 Agent Efficiency',
          message: `Cost per request: $${(totalCost / totalRequests).toFixed(3)}. Batch operations to reduce overhead.`,
          timestamp: now,
          read: false,
          link: '/agents'
        });
      }

      // === CRON/HEARTBEAT OPTIMIZATION NOTIFICATIONS ===
      const anthropicProvider = data.providers.find(p => p.name === 'anthropic');
      const totalProviderCost = data.providers.reduce((sum, p) => sum + p.cost, 0);
      if (anthropicProvider && totalProviderCost > 0) {
        const anthropicPercent = (anthropicProvider.cost / totalProviderCost) * 100;
        if (anthropicPercent > 85) {
          recs.push({
            id: `rec-cron-provider-${now.getTime()}`,
            type: 'info',
            category: 'cron',
            title: '⏰ Provider Diversity',
            message: `${anthropicPercent.toFixed(0)}% spend on Anthropic. Use Minimax/Gemini for crons.`,
            timestamp: now,
            read: false,
            link: '/costs'
          });
        }
      }

      // Check for cron consolidation opportunity
      const avgRequests = recentDays.reduce((sum, d) => sum + (d.requests || 0), 0) / 7;
      if (avgRequests > 1500) {
        recs.push({
          id: `rec-cron-consolidate-${now.getTime()}`,
          type: 'info',
          category: 'cron',
          title: '⏰ Cron Optimization',
          message: `~${Math.round(avgRequests)} requests/day. Review cron intervals for consolidation.`,
          timestamp: now,
          read: false,
          link: '/costs'
        });
      }

      return recs;
    } catch (err) {
      console.error('Failed to generate recommendation notifications:', err);
      return [];
    }
  }, []);

  // Load notifications from localStorage + generate real recommendations
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load persisted notifications
      const stored = localStorage.getItem(NOTIFICATION_SOURCES.localStorage);
      let persistedNotifications: Notification[] = [];
      if (stored) {
        const parsed = JSON.parse(stored);
        persistedNotifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }

      // Generate fresh recommendation notifications from REAL data
      const recommendationNotifications = await generateRecommendationNotifications();

      // Merge: keep persisted system notifications, add fresh recommendations
      const systemNotifications = persistedNotifications.filter(n => n.category === 'system');
      const allNotifications = [...recommendationNotifications, ...systemNotifications];

      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(allNotifications);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [generateRecommendationNotifications]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((updatedNotifications: Notification[]) => {
    try {
      // Only persist system notifications (recommendations regenerate from data)
      const systemOnly = updatedNotifications.filter(n => n.category === 'system');
      localStorage.setItem(
        NOTIFICATION_SOURCES.localStorage,
        JSON.stringify(systemOnly)
      );
    } catch (err) {
      console.error('Error saving notifications:', err);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadNotifications();
    
    // Listen for custom notification events
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      setNotifications(prev => {
        const updated = [event.detail, ...prev];
        saveNotifications(updated);
        return updated;
      });
    };
    
    window.addEventListener('mission-control-notification', handleNewNotification as EventListener);
    
    // Refresh recommendations every 5 minutes
    const refreshInterval = setInterval(loadNotifications, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('mission-control-notification', handleNewNotification as EventListener);
      clearInterval(refreshInterval);
    };
  }, [loadNotifications, saveNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const togglePanel = () => setIsOpen(!isOpen);

  const handleNotificationClick = (notification: Notification) => {
    const updated = notifications.map((n) =>
      n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    saveNotifications(updated);

    if (notification.action) {
      notification.action();
    } else if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'model': return '🧠';
      case 'agent': return '🤖';
      case 'cron': return '⏰';
      case 'system': return '⚙️';
    }
  };

  const getTypeClass = (type: Notification['type']) => {
    return `notification-item notification-${type}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button
        className="topbar-icon-btn notification-bell"
        onClick={togglePanel}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <span className="icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-panel">
            <div className="notification-header">
              <h3>🔔 Optimization Alerts</h3>
              <div className="notification-actions">
                <button onClick={markAllRead} title="Mark all read" disabled={unreadCount === 0}>
                  ✓
                </button>
                <button onClick={clearAll} title="Clear all" disabled={notifications.length === 0}>
                  🗑️
                </button>
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-empty">
                  <span>⏳</span>
                  <p>Analyzing usage data...</p>
                </div>
              ) : error ? (
                <div className="notification-empty notification-error">
                  <span>❌</span>
                  <p>{error}</p>
                  <button onClick={loadNotifications}>Retry</button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span>✅</span>
                  <p>No optimizations needed</p>
                  <p className="notification-empty-hint">
                    Usage patterns look efficient!
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${getTypeClass(notification.type)} ${notification.read ? 'read' : 'unread'} ${notification.link || notification.action ? 'clickable' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    <span className="notification-icon">
                      {getCategoryIcon(notification.category)}
                    </span>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTime(notification.timestamp)}
                      </div>
                    </div>
                    {notification.link && (
                      <span className="notification-arrow">→</span>
                    )}
                    <button
                      className="notification-delete"
                      onClick={(e) => deleteNotification(notification.id, e)}
                      title="Dismiss"
                      aria-label="Dismiss notification"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to create and dispatch notifications from anywhere in the app
export const sendNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const fullNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false,
  };
  
  window.dispatchEvent(
    new CustomEvent('mission-control-notification', {
      detail: fullNotification,
    })
  );
  
  return fullNotification;
};

export default NotificationBell;
