import React, { useState, useEffect } from 'react';
import ActivityStream from '../components/overview/ActivityStream';
import ActiveAgents from '../components/overview/ActiveAgents';
import TokenUsage from '../components/overview/TokenUsage';
import BudgetMeter from '../components/overview/BudgetMeter';
import BudgetSettings from '../components/settings/BudgetSettings';
import KanbanWidget from '../components/overview/KanbanWidget';
import './Overview.css';

const Overview: React.FC = () => {
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [currentSpend, setCurrentSpend] = useState({ daily: 0, weekly: 0, monthly: 0 });

  useEffect(() => {
    // Load current spending from usage data
    fetch('/usage-data.json')
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Calculate daily (today's spend)
        const todayData = data.daily?.find((d: any) => d.date === todayStr);
        const dailySpend = todayData?.cost || 0;
        
        // Calculate weekly (last 7 days)
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weeklySpend = data.daily
          ?.filter((d: any) => new Date(d.date) >= weekAgo)
          .reduce((sum: number, d: any) => sum + d.cost, 0) || 0;
        
        // Monthly from summary
        const monthlySpend = data.summary?.monthTotal || 0;
        
        setCurrentSpend({
          daily: dailySpend,
          weekly: weeklySpend,
          monthly: monthlySpend
        });
      })
      .catch(err => console.error('Failed to load usage data:', err));
  }, []);

  const handleBudgetSave = (config: any) => {
    console.log('Budget config saved:', config);
    // Config is saved to localStorage in the BudgetSettings component
  };

  return (
    <div className="overview-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Welcome back, Brian</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </header>

      {/* Budget Meter - Top of page */}
      <BudgetMeter 
        currentSpend={currentSpend}
        onSettingsClick={() => setShowBudgetSettings(true)}
      />

      {/* Budget Settings Modal */}
      <BudgetSettings
        isOpen={showBudgetSettings}
        onClose={() => setShowBudgetSettings(false)}
        onSave={handleBudgetSave}
      />

      <section className="system-health-section">
        <h2 className="section-title">Cost Optimization</h2>
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">💰 Monthly Savings</span>
            </div>
            <div className="stat-value" style={{ color: '#34d399' }}>$729.50</div>
            <div className="stat-secondary">Total optimizations</div>
            <div className="stat-status excellent">53% Reduction</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">⚡ Session Optimization</span>
            </div>
            <div className="stat-value" style={{ color: '#818cf8' }}>$112.50</div>
            <div className="stat-secondary">per month</div>
            <div className="stat-trend positive">▼ 33% cost reduction</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">⏰ Cron Optimization</span>
            </div>
            <div className="stat-value" style={{ color: '#14b8a6' }}>$617.00</div>
            <div className="stat-secondary">per month</div>
            <div className="stat-trend positive">▼ 36% cost reduction</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">📈 Annual Projection</span>
            </div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>$8,754</div>
            <div className="stat-secondary">yearly savings</div>
            <div className="stat-status excellent">Optimized</div>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <span style={{ fontWeight: 600, color: '#34d399' }}>Key Optimizations Applied</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem', fontSize: '0.875rem', color: '#d1d5db' }}>
            <div>• Morning briefing → Haiku (-82%)</div>
            <div>• Memory flush → Haiku (-85%)</div>
            <div>• Security scans fixed (-88%)</div>
            <div>• Auto-Assign: 30min → 45min</div>
            <div>• Ralph Loop: 30min → 60min</div>
            <div>• Simple checks → Haiku (-83%)</div>
          </div>
        </div>
      </section>

      <section className="apps-section">
        <h2 className="section-title">Your Applications</h2>
        <div className="apps-grid">
          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">📋</span>
                <h3 className="app-name">Python Kanban</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">121</div>
              <div className="metric-label">Total Tasks</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">69</div>
                <div className="quick-stat-label">Backlog</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">17</div>
                <div className="quick-stat-label">In Progress</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">8</div>
                <div className="quick-stat-label">Done</div>
              </div>
            </div>

            <div className="app-footer">
              <a href="https://python-kanban.pages.dev" target="_blank" rel="noopener noreferrer" className="btn-primary">Open Board</a>
            </div>
          </div>

          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">🧠</span>
                <h3 className="app-name">Second Brain</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">Memory</div>
              <div className="metric-label">Knowledge Base</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">∞</div>
                <div className="quick-stat-label">Entries</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">24/7</div>
                <div className="quick-stat-label">Available</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">AI</div>
                <div className="quick-stat-label">Powered</div>
              </div>
            </div>

            <div className="app-footer">
              <a href="https://second-brain-cole.pages.dev" target="_blank" rel="noopener noreferrer" className="btn-primary">Open Brain</a>
            </div>
          </div>

          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">🔐</span>
                <h3 className="app-name">Secret Vault</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">Secure</div>
              <div className="metric-label">Password Manager</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">🔒</div>
                <div className="quick-stat-label">Encrypted</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">Safe</div>
                <div className="quick-stat-label">Protected</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">24/7</div>
                <div className="quick-stat-label">Access</div>
              </div>
            </div>

            <div className="app-footer">
              <a href="https://secret-vault-9r3.pages.dev" target="_blank" rel="noopener noreferrer" className="btn-primary">Open Vault</a>
            </div>
          </div>

          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">🗾</span>
                <h3 className="app-name">Tokyo Trip</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">2026</div>
              <div className="metric-label">Tokyo & Osaka</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">149</div>
                <div className="quick-stat-label">Locations</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">📍</div>
                <div className="quick-stat-label">Interactive Map</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">🗓️</div>
                <div className="quick-stat-label">Timeline</div>
              </div>
            </div>

            <div className="app-footer">
              <a href="https://tokyo-osaka-trip-2026.netlify.app" target="_blank" rel="noopener noreferrer" className="btn-primary">View Itinerary</a>
            </div>
          </div>

          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">🎯</span>
                <h3 className="app-name">Mission Control</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">Central</div>
              <div className="metric-label">Command Hub</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">5</div>
                <div className="quick-stat-label">Apps</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">Live</div>
                <div className="quick-stat-label">Status</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">📊</div>
                <div className="quick-stat-label">Dashboard</div>
              </div>
            </div>

            <div className="app-footer">
              <a href="https://mission-control-cole.pages.dev" target="_blank" rel="noopener noreferrer" className="btn-primary">Open Dashboard</a>
            </div>
          </div>
        </div>
      </section>

      <div className="grid-2col">
        {/* Activity Stream */}
        <section className="activity-section">
          <h2 className="section-title">📡 Live Activity Stream</h2>
          <div className="card">
            <ActivityStream maxItems={8} autoRefresh={true} />
          </div>
        </section>

        {/* Right Column: Agents & Token Usage */}
        <div className="right-column">
          {/* Active Agents */}
          <section className="agents-section">
            <h2 className="section-title">🤖 Active Agents</h2>
            <div className="card">
              <ActiveAgents maxAgents={3} autoRefresh={true} />
            </div>
          </section>

          {/* Token Usage */}
          <section className="token-usage-section">
            <h2 className="section-title">🔢 Token Usage</h2>
            <div className="card">
              <TokenUsage autoRefresh={true} />
            </div>
          </section>

          {/* Kanban Board Widget */}
          <section className="kanban-section">
            <h2 className="section-title">📋 Project Board</h2>
            <KanbanWidget />
          </section>
        </div>
      </div>

      <section className="system-health-section">
        <h2 className="section-title">System Health</h2>
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">CPU Usage</span>
            </div>
            <div className="stat-value">23%</div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: '23%' }}></div>
            </div>
            <div className="stat-status excellent">Excellent</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">Memory</span>
            </div>
            <div className="stat-value">8.2 GB</div>
            <div className="stat-secondary">of 16 GB</div>
            <div className="stat-progress">
              <div className="progress-bar" style={{ width: '51%' }}></div>
            </div>
            <div className="stat-status normal">Normal</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">Network I/O</span>
            </div>
            <div className="stat-value">
              <div>▲ 142 Mb/s</div>
              <div>▼ 68 Mb/s</div>
            </div>
            <div className="stat-status normal">High Activity</div>
          </div>

          <div className="stat-card card">
            <div className="stat-header">
              <span className="stat-label">Active Requests</span>
            </div>
            <div className="stat-value">1,247</div>
            <div className="stat-secondary">per minute</div>
            <div className="stat-trend positive">▲ 12% trend</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
