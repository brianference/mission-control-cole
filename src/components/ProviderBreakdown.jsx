export default function ProviderBreakdown({ providers }) {
  if (!providers || providers.length === 0) {
    return (
      <div className="glass-card">
        <h2 className="text-xl font-semibold mb-4">Cost by Provider</h2>
        <p className="text-text-secondary">No provider data available</p>
      </div>
    );
  }

  const total = providers.reduce((sum, p) => sum + (p.cost || 0), 0);

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">Cost by Provider</h2>
      
      <div className="space-y-4">
        {providers.map(provider => {
          const percentage = total > 0 ? (provider.cost / total * 100) : 0;
          
          return (
            <div key={provider.provider} className="provider-item">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium text-text-primary capitalize">
                    {provider.provider}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {provider.calls.toLocaleString()} calls • {(provider.total_tokens / 1000000).toFixed(1)}M tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">
                    ${provider.cost.toFixed(2)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              {provider.thinking_tokens > 0 && (
                <p className="text-xs text-text-secondary mt-2">
                  + {(provider.thinking_tokens / 1000).toFixed(0)}K thinking tokens
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between">
          <span className="font-medium">Total</span>
          <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
