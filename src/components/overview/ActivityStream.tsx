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
      // In production, this would fetch from real API
      // For now, generate mock real-time data based on usage-data.json
      const response = await fetch('/usage-data.json');
      const usageData = await response.json();
      
      // Transform usage data into activities
      const recentActivities: Activity[] = [];
      
      // Add recent daily activities
      if (usageData.daily && usageData.daily.length > 0) {
        const latestDay = usageData.daily[usageData.daily.length - 1];
        
        // System activity
        recentActivities.push({
          id: `sys-${Date.now()}`,
          type: 'system',
          icon: '🖥️',
          title: 'Daily usage processed',
          description: `${latestDay.requests.toLocaleString()} API requests`,
          timestamp: new Date(latestDay.date),
          metadata: {
            cost: latestDay.cost,
            status: 'success',
          },
        });
      }
      
      // Add agent activities from models
      if (usageData.models && usageData.models.length > 0) {
        usageData.models.slice(0, 3).forEach((model: any, idx: number) => {
          recentActivities.push({
            id: `agent-${idx}`,
            type: 'agent',
            icon: '🤖',
            title: `${model.name} completed tasks`,
            description: `${model.requests.toLocaleString()} requests processed`,
            timestamp: new Date(Date.now() - idx * 3600000), // Stagger by hours
            metadata: {
              agent: model.name,
              cost: model.cost,
              status: 'success',
            },
          });
        });
      }
      
      // Add deployment activity
      recentActivities.push({
        id: 'deploy-1',
        type: 'deployment',
        icon: '🚀',
        title: 'Mission Control deployed',
        description: 'Status: Success',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        metadata: {
          status: 'success',
        },
      });
      
      // Add cron job activity
      recentActivities.push({
        id: 'cron-1',
        type: 'cron',
        icon: '⏰',
        title: 'Auto-Assign completed',
        description: 'Processed Kanban tasks',
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        metadata: {
          status: 'success',
          duration: 2345,
        },
      });
      
      // Sort by timestamp (newest first)
      recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setActivities(recentActivities.slice(0, maxItems));
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
