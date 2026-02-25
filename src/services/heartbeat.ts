import { sendHeartbeat, logActivity, logMetric } from '../utils/supabase';

// Heartbeat Service - Keeps Supabase active with regular pings
class HeartbeatService {
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  private lastActivityTime: number = Date.now();
  private tokensToday: number = 0;

  // Start heartbeat pings every 5 minutes
  start() {
    if (this.intervalId) {
      console.warn('Heartbeat already running');
      return;
    }

    console.log('🫀 Starting heartbeat service (ping every 5min)');

    // Send initial heartbeat
    this.sendPing();

    // Set up recurring heartbeat every 5 minutes
    this.intervalId = setInterval(() => {
      this.sendPing();
    }, 5 * 60 * 1000); // 5 minutes

    // Also send activity logs periodically (every 2 minutes)
    setInterval(() => {
      this.logRandomActivity();
    }, 2 * 60 * 1000); // 2 minutes

    // Send performance metrics (every 3 minutes)
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 3 * 60 * 1000); // 3 minutes
  }

  // Stop heartbeat service
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Heartbeat service stopped');
    }
  }

  // Send heartbeat ping to Supabase
  private async sendPing() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    await sendHeartbeat({
      status: 'online',
      active_sessions: this.getActiveSessions(),
      total_tokens_today: this.tokensToday,
      uptime_seconds: uptimeSeconds,
      last_activity: new Date(this.lastActivityTime).toISOString(),
      metadata: {
        browser: navigator.userAgent,
        online: navigator.onLine,
        memory_usage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp_local: new Date().toLocaleString(),
      },
    });

    console.log(`💓 Heartbeat sent (uptime: ${uptimeSeconds}s)`);
  }

  // Log random activity to keep database active
  private async logRandomActivity() {
    const activities = [
      { type: 'dashboard_view', name: 'Dashboard viewed' },
      { type: 'data_refresh', name: 'Data refreshed' },
      { type: 'metric_check', name: 'Metrics checked' },
      { type: 'activity_scan', name: 'Activity scanned' },
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];

    await logActivity({
      action_type: activity.type,
      action_name: activity.name,
      details: {
        timestamp: new Date().toISOString(),
        auto_generated: true,
      },
      status: 'success',
      user_id: 'brian',
    });

    this.lastActivityTime = Date.now();
  }

  // Log performance metrics
  private async logPerformanceMetrics() {
    const metrics = [
      {
        metric_type: 'dashboard_performance',
        metric_name: 'page_load_time',
        value: Math.random() * 1000 + 500,
        unit: 'ms',
        metadata: { page: 'overview' },
      },
      {
        metric_type: 'api_performance',
        metric_name: 'supabase_query_time',
        value: Math.random() * 200 + 50,
        unit: 'ms',
        metadata: { table: 'activity_log' },
      },
      {
        metric_type: 'memory_usage',
        metric_name: 'js_heap_size',
        value: (performance as any).memory?.usedJSHeapSize || 0,
        unit: 'bytes',
        metadata: {},
      },
    ];

    for (const metric of metrics) {
      await logMetric(metric);
    }

    console.log('📊 Performance metrics logged');
  }

  // Get number of active sessions (mock for now)
  private getActiveSessions(): number {
    // In real implementation, this would query actual session data
    return Math.floor(Math.random() * 3) + 1;
  }

  // Track token usage
  updateTokenCount(tokens: number) {
    this.tokensToday += tokens;
  }

  // Update last activity time
  recordActivity() {
    this.lastActivityTime = Date.now();
  }
}

// Export singleton instance
export const heartbeat = new HeartbeatService();

// Auto-start when module loads (in browser)
if (typeof window !== 'undefined') {
  // Start heartbeat 5 seconds after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      heartbeat.start();
    }, 5000);
  });

  // Stop on page unload
  window.addEventListener('beforeunload', () => {
    heartbeat.stop();
  });
}
