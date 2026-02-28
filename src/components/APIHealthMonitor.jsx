export default function APIHealthMonitor({ health }) {
  if (!health) {
    return (
      <div className="glass-card">
        <h2 className="text-xl font-semibold mb-4">API Health (7 days)</h2>
        <p className="text-text-secondary">No health data available</p>
      </div>
    );
  }

  const successRate = health.success_rate || 100;
  const isHealthy = successRate >= 98;
  const isWarning = successRate >= 95 && successRate < 98;
  const isCritical = successRate < 95;

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">API Health (7 days)</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className={`text-3xl font-bold ${isHealthy ? 'text-green-500' : isWarning ? 'text-yellow-500' : 'text-red-500'}`}>
            {successRate.toFixed(1)}%
          </div>
          <div className="text-sm text-text-secondary mt-1">Success Rate</div>
          <div className={`status-indicator mt-2 ${isHealthy ? 'bg-green-500/20 text-green-500' : isWarning ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
            {isHealthy ? '✓ Healthy' : isWarning ? '⚠ Warning' : '✗ Critical'}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-text-primary">
            {health.total_calls.toLocaleString()}
          </div>
          <div className="text-sm text-text-secondary mt-1">Total Calls</div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-yellow-500">
            {health.rate_limits || 0}
          </div>
          <div className="text-sm text-text-secondary mt-1">Rate Limits</div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-red-500">
            {health.errors || 0}
          </div>
          <div className="text-sm text-text-secondary mt-1">Errors</div>
        </div>
      </div>
      
      {(health.rate_limits > 0 || health.errors > 0) && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-500">
            ⚠️ {health.rate_limits} rate limit(s) and {health.errors} error(s) detected in the last 7 days
          </p>
        </div>
      )}
    </div>
  );
}
