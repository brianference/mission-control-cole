import React from 'react';
import { useParams } from 'react-router-dom';
import './CommonPages.css';

const Content: React.FC = () => {
  const { section } = useParams();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">📝</span>
            Content {section && `• ${section}`}
          </h1>
          <p className="page-subtitle">Manage your content creation pipeline</p>
        </div>
        <button className="btn-primary">+ New Draft</button>
      </header>

      <div className="stats-row">
        <div className="stat-mini card">
          <div className="stat-mini-label">Pending Drafts</div>
          <div className="stat-mini-value">7</div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-label">Scheduled</div>
          <div className="stat-mini-value">12</div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-label">Published (30d)</div>
          <div className="stat-mini-value">45</div>
        </div>
        <div className="stat-mini card">
          <div className="stat-mini-label">Total Reach</div>
          <div className="stat-mini-value">128K</div>
        </div>
      </div>

      <div className="content-list">
        <div className="content-item card hover-lift">
          <div className="content-header">
            <div>
              <h3 className="content-title">The Future of AI Agents</h3>
              <p className="content-meta">Draft • @swordtruth • 2 hours ago</p>
            </div>
            <span className="badge-warning">Pending Review</span>
          </div>
          <p className="content-excerpt">
            Exploring how autonomous AI agents will transform software development...
          </p>
          <div className="content-footer">
            <button className="btn-secondary">Edit</button>
            <button className="btn-primary">Publish</button>
          </div>
        </div>

        <div className="content-item card hover-lift">
          <div className="content-header">
            <div>
              <h3 className="content-title">Building Glassmorphic UIs</h3>
              <p className="content-meta">Scheduled • Twitter • Tomorrow 9:00 AM</p>
            </div>
            <span className="badge-info">Scheduled</span>
          </div>
          <p className="content-excerpt">
            A deep dive into modern glassmorphism design patterns...
          </p>
          <div className="content-footer">
            <button className="btn-secondary">Reschedule</button>
            <button className="btn-secondary">Edit</button>
          </div>
        </div>

        <div className="content-item card hover-lift">
          <div className="content-header">
            <div>
              <h3 className="content-title">Memory Systems for Developers</h3>
              <p className="content-meta">Published • Blog • 2 days ago</p>
            </div>
            <span className="badge-success">Published</span>
          </div>
          <p className="content-excerpt">
            How to build a second brain using mem0 and supermemory...
          </p>
          <div className="content-footer">
            <span className="content-stat">👁️ 1.2K views</span>
            <span className="content-stat">💬 24 comments</span>
            <span className="content-stat">❤️ 156 likes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
