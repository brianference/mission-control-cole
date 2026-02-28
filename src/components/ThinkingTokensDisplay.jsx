export default function ThinkingTokensDisplay({ thinking }) {
  if (!thinking || thinking.total_thinking === 0) {
    return null;
  }

  return (
    <div className="glass-card bg-accent/5 border-accent/20">
      <h2 className="text-xl font-semibold mb-4">Extended Thinking Usage</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="text-2xl font-bold text-accent">
            {(thinking.total_thinking / 1000000).toFixed(2)}M
          </div>
          <div className="text-sm text-text-secondary mt-1">Total Thinking Tokens</div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-text-primary">
            {thinking.calls_with_thinking.toLocaleString()}
          </div>
          <div className="text-sm text-text-secondary mt-1">Calls with Thinking</div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-text-primary">
            {(thinking.max_thinking_tokens / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-text-secondary mt-1">Max Tokens</div>
        </div>
        
        <div className="metric-card">
          <div className="text-2xl font-bold text-text-primary">
            {(thinking.avg_thinking_tokens / 1000).toFixed(1)}K
          </div>
          <div className="text-sm text-text-secondary mt-1">Avg per Call</div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
        <p className="text-sm text-text-secondary">
          💡 <span className="text-accent font-medium">Thinking tokens</span> are included in your API subscription and don't incur additional charges.
          They're used for extended reasoning in complex tasks.
        </p>
      </div>
    </div>
  );
}
