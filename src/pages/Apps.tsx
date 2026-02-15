
import React, { useState, useEffect } from 'react';
import { ExternalLink, Power,Terminal, GitBranch } from 'lucide-react';
import './Apps.css';

interface App {
  name: string;
  status: 'online' | 'offline';
  lastDeploy: string;
  url: string;
  metrics: {
    cpu: string;
    memory: string;
  };
}

const Apps: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/apps.json')
      .then(res => res.json())
      .then(data => {
        setApps(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load apps:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="apps-page">
        <header className="page-header">
          <h1 className="page-title gradient-text">Apps</h1>
        </header>
        <div className="loading-state">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="apps-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Applications</h1>
          <p className="page-subtitle">{apps.length} applications monitored</p>
        </div>
      </header>
      <section className="apps-grid-section">
        <div className="apps-grid">
          {apps.map((app, index) => (
            <div key={index} className="app-card card">
              <div className="app-header">
                <div className="app-title-group">
                  <span className={`status-dot ${app.status}`} title={app.status}></span>
                  <h3 className="app-name">{app.name}</h3>
                </div>
                <a href={app.url} target="_blank" rel="noopener noreferrer" className="app-link">
                  <ExternalLink size={18} />
                </a>
              </div>
              <div className="app-body">
                <div className="app-metric">
                  <span>CPU</span>
                  <span>{app.metrics.cpu}</span>
                </div>
                <div className="app-metric">
                  <span>Memory</span>
                  <span>{app.metrics.memory}</span>
                </div>
                <div className="app-last-deploy">
                  <span>Last Deploy</span>
                  <span>{new Date(app.lastDeploy).toLocaleString()}</span>
                </div>
              </div>
              <div className="app-footer">
                <button className="quick-action-btn"><Power size={16} /> Restart</button>
                <button className="quick-action-btn"><Terminal size={16} /> Logs</button>
                <button className="quick-action-btn"><GitBranch size={16} /> Deploy</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Apps;
