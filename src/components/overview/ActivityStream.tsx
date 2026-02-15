import React, { useEffect, useState } from 'react';
import './ActivityStream.css';

export interface Activity {
  id: string;
  type: 'deployment' | 'agent' | 'system' | 'cron' | 'error';
  icon: string;
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: {
    agent?: string;
    cost?: number;
    duration?: number;
    status?: 'success' | 'error' | 'warning' | 'running';
  };
}

interface ActivityStreamProps {
  maxItems?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ActivityStream: React.FC<ActivityStreamProps> = ({
  maxItems = 10,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      // Fetch real activity data from OpenClaw sessions
      const response = await fetch('/activity-stream.json');
      const activityData = await response.json();
      
      // Transform to Activity format if needed
      const mappedActivities: Activity[] = activityData.map((activity: any) => ({
        id: activity.id,
        type: activity.type as Activity['type'],
        icon: activity.icon,
        title: activity.title,
        description: activity.description,
        timestamp: new Date(activity.timestamp),
        metadata: activity.metadata,
      }));
      
      setActivities(mappedActivities.slice(0, maxItems));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    if (autoRefresh) {
      const interval = setInterval(fetchActivities, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, maxItems]);

  const getTimeAgo = (timestamp: Date): string => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'success': return 'status-success';
      case 'error': return 'status-error';
      case 'warning': return 'status-warning';
      case 'running': return 'status-running';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="activity-stream-loading">
        <div className="spinner"></div>
        <p>Loading activities...</p>
      </div>
    );
  }

  return (
    <div className="activity-stream">
      {activities.map((activity, index) => (
        <React.Fragment key={activity.id}>
          <div className={`activity-item ${getStatusColor(activity.metadata?.status)}`}>
            <span className="activity-icon">{activity.icon}</span>
            <div className="activity-content">
              <div className="activity-title">{activity.title}</div>
              {activity.description && (
                <div className="activity-description">{activity.description}</div>
              )}
              {activity.metadata?.cost && (
                <div className="activity-meta">
                  <span className="activity-cost">
                    ${activity.metadata.cost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
          </div>
          {index < activities.length - 1 && <div className="activity-divider"></div>}
        </React.Fragment>
      ))}
      
      {activities.length === 0 && (
        <div className="activity-empty">
          <span className="empty-icon">📭</span>
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default ActivityStream;
