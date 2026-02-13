import React from 'react';
import './Overview.css';

const Overview: React.FC = () => {
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

      <section className="apps-section">
        <h2 className="section-title">Your Applications</h2>
        <div className="apps-grid">
          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">🔧</span>
                <h3 className="app-name">OpenClaw</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">1,247</div>
              <div className="metric-label">Active Sessions</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">142</div>
                <div className="quick-stat-label">Agents</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">98.7%</div>
                <div className="quick-stat-label">Uptime</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">12.4K</div>
                <div className="quick-stat-label">Messages</div>
              </div>
            </div>

            <div className="app-footer">
              <button className="btn-primary">Deploy</button>
              <a href="#" className="link-secondary">View Details →</a>
            </div>
          </div>

          <div className="app-card card">
            <div className="app-header">
              <div className="app-title-group">
                <span className="app-icon">📱</span>
                <h3 className="app-name">MobileClaw</h3>
              </div>
              <span className="status-dot online" title="Operational"></span>
            </div>
            
            <div className="app-metric">
              <div className="metric-value">3,421</div>
              <div className="metric-label">Total Users</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">142</div>
                <div className="quick-stat-label">Active</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">87%</div>
                <div className="quick-stat-label">Retention</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">24K</div>
                <div className="quick-stat-label">Sessions</div>
              </div>
            </div>

            <div className="app-footer">
              <button className="btn-primary">Update</button>
              <a href="#" className="link-secondary">View Details →</a>
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
              <div className="metric-value">847</div>
              <div className="metric-label">Vault Entries</div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat">
                <div className="quick-stat-value">98%</div>
                <div className="quick-stat-label">Encrypted</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">2.1 MB</div>
                <div className="quick-stat-label">Size</div>
              </div>
              <div className="quick-stat">
                <div className="quick-stat-value">14d</div>
                <div className="quick-stat-label">Last Backup</div>
              </div>
            </div>

            <div className="app-footer">
              <button className="btn-primary">Backup</button>
              <a href="#" className="link-secondary">View Details →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="activity-section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-feed card">
          <div className="activity-item">
            <span className="activity-icon">🔧</span>
            <div className="activity-content">
              <div className="activity-title">OpenClaw deployed v2.1.3</div>
              <div className="activity-description">Status: Success</div>
            </div>
            <div className="activity-time">2m</div>
          </div>
          
          <div className="activity-divider"></div>
          
          <div className="activity-item">
            <span className="activity-icon">📱</span>
            <div className="activity-content">
              <div className="activity-title">MobileClaw update</div>
              <div className="activity-description">3 new users</div>
            </div>
            <div className="activity-time">15m</div>
          </div>
          
          <div className="activity-divider"></div>
          
          <div className="activity-item">
            <span className="activity-icon">🔐</span>
            <div className="activity-content">
              <div className="activity-title">Secret Vault backup completed</div>
              <div className="activity-description">847 entries backed up</div>
            </div>
            <div className="activity-time">1h</div>
          </div>
          
          <div className="activity-divider"></div>
          
          <div className="activity-item">
            <span className="activity-icon">🖥️</span>
            <div className="activity-content">
              <div className="activity-title">Server health check</div>
              <div className="activity-description">All systems OK</div>
            </div>
            <div className="activity-time">3h</div>
          </div>

          <div className="activity-footer">
            <a href="#" className="link-primary">View All Activity →</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
