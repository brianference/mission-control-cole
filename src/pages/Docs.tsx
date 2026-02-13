import React from 'react';
import { useParams } from 'react-router-dom';
import './CommonPages.css';

const Docs: React.FC = () => {
  const { section } = useParams();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">📄</span>
            Documentation {section && `• ${section}`}
          </h1>
          <p className="page-subtitle">Project documentation and knowledge base</p>
        </div>
        <button className="btn-primary">+ New Doc</button>
      </header>

      <div className="docs-grid">
        <div className="doc-section card hover-lift">
          <div className="doc-section-icon">🚀</div>
          <h3 className="doc-section-title">Projects</h3>
          <p className="doc-section-description">
            Documentation for all active and archived projects
          </p>
          <div className="doc-section-stats">
            <span>24 projects</span>
            <span>•</span>
            <span>Updated 2h ago</span>
          </div>
        </div>

        <div className="doc-section card hover-lift">
          <div className="doc-section-icon">🎯</div>
          <h3 className="doc-section-title">Skills</h3>
          <p className="doc-section-description">
            Agent capabilities and integration guides
          </p>
          <div className="doc-section-stats">
            <span>18 skills</span>
            <span>•</span>
            <span>Updated 1d ago</span>
          </div>
        </div>

        <div className="doc-section card hover-lift">
          <div className="doc-section-icon">🤖</div>
          <h3 className="doc-section-title">Agents</h3>
          <p className="doc-section-description">
            Agent documentation and configuration
          </p>
          <div className="doc-section-stats">
            <span>12 agents</span>
            <span>•</span>
            <span>Updated 3h ago</span>
          </div>
        </div>

        <div className="doc-section card hover-lift">
          <div className="doc-section-icon">⚙️</div>
          <h3 className="doc-section-title">Configuration</h3>
          <p className="doc-section-description">
            System configuration and environment setup
          </p>
          <div className="doc-section-stats">
            <span>6 configs</span>
            <span>•</span>
            <span>Updated 5d ago</span>
          </div>
        </div>
      </div>

      <div className="recent-docs">
        <h3 className="section-title">Recent Updates</h3>
        
        <div className="doc-item card hover-lift">
          <div className="doc-item-icon">📝</div>
          <div className="doc-item-content">
            <h4 className="doc-item-title">Mission Control Dashboard Spec</h4>
            <p className="doc-item-path">/projects/mission-control/</p>
          </div>
          <div className="doc-item-meta">
            <span className="doc-item-time">2 hours ago</span>
            <span className="badge-success">Updated</span>
          </div>
        </div>

        <div className="doc-item card hover-lift">
          <div className="doc-item-icon">🤖</div>
          <div className="doc-item-content">
            <h4 className="doc-item-title">Designer Agent Guide</h4>
            <p className="doc-item-path">/agents/morpheus/</p>
          </div>
          <div className="doc-item-meta">
            <span className="doc-item-time">1 day ago</span>
            <span className="badge-info">New</span>
          </div>
        </div>

        <div className="doc-item card hover-lift">
          <div className="doc-item-icon">🎯</div>
          <div className="doc-item-content">
            <h4 className="doc-item-title">Browser Control Skill</h4>
            <p className="doc-item-path">/skills/browser/</p>
          </div>
          <div className="doc-item-meta">
            <span className="doc-item-time">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
