import React, { useEffect, useState } from 'react';
import { getRecentActivity, ActivityLog, supabase } from '../../utils/supabase';
import './ActivityFeed.css';

const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadActivities();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityLog, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadActivities = async () => {
    const data = await getRecentActivity(50);
    setActivities(data);
    setLoading(false);
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.action_type === filter);

  const getActionIcon = (type: string) => {
    const icons: Record<string, string> = {
      tool_call: '🔧',
      deployment: '🚀',
      session_start: '💬',
      cron_run: '⏰',
      heartbeat: '💓',
      error: '❌',
    };
    return icons[type] || '📝';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: '#10b981',
      error: '#ef4444',
      pending: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h2>🔥 Live Activity Feed</h2>
        <div className="activity-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'tool_call' ? 'active' : ''}
            onClick={() => setFilter('tool_call')}
          >
            Tools
          </button>
          <button
            className={filter === 'deployment' ? 'active' : ''}
            onClick={() => setFilter('deployment')}
          >
            Deploys
          </button>
          <button
            className={filter === 'cron_run' ? 'active' : ''}
            onClick={() => setFilter('cron_run')}
          >
            Crons
          </button>
        </div>
      </div>

      {loading ? (
        <div className="activity-loading">Loading activity...</div>
      ) : (
        <div className="activity-list">
          {filteredActivities.length === 0 ? (
            <div className="activity-empty">No recent activity</div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {getActionIcon(activity.action_type)}
                </div>
                <div className="activity-content">
                  <div className="activity-name">{activity.action_name}</div>
                  <div className="activity-details">
                    {activity.action_type} • {activity.user_id}
                  </div>
                  {activity.details && Object.keys(activity.details).length > 0 && (
                    <div className="activity-meta">
                      {JSON.stringify(activity.details, null, 2).slice(0, 100)}
                      {JSON.stringify(activity.details).length > 100 && '...'}
                    </div>
                  )}
                </div>
                <div className="activity-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(activity.status) }}
                  >
                    {activity.status}
                  </span>
                  <span className="activity-time">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
