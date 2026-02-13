import React from 'react';
import './CommonPages.css';

const Ideas: React.FC = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">💡</span>
            Ideas
          </h1>
          <p className="page-subtitle">Brainstorm and manage your ideas</p>
        </div>
        <button className="btn-primary">+ New Idea</button>
      </header>

      <div className="page-grid">
        <div className="idea-card card hover-lift">
          <div className="idea-header">
            <span className="idea-badge new">New</span>
            <span className="idea-time">2 hours ago</span>
          </div>
          <h3 className="idea-title">Mission Control Dashboard</h3>
          <p className="idea-description">
            Central hub for all applications with live stats and glassmorphism design
          </p>
          <div className="idea-tags">
            <span className="tag">dashboard</span>
            <span className="tag">ui/ux</span>
            <span className="tag">priority-high</span>
          </div>
        </div>

        <div className="idea-card card hover-lift">
          <div className="idea-header">
            <span className="idea-badge in-progress">In Progress</span>
            <span className="idea-time">1 day ago</span>
          </div>
          <h3 className="idea-title">AI Content Generator</h3>
          <p className="idea-description">
            Automated content creation for @swordtruth using Claude and GPT-4
          </p>
          <div className="idea-tags">
            <span className="tag">ai</span>
            <span className="tag">content</span>
          </div>
        </div>

        <div className="idea-card card hover-lift">
          <div className="idea-header">
            <span className="idea-badge">Idea</span>
            <span className="idea-time">3 days ago</span>
          </div>
          <h3 className="idea-title">Personal Knowledge Graph</h3>
          <p className="idea-description">
            Visual representation of all memories and connections using D3.js
          </p>
          <div className="idea-tags">
            <span className="tag">memory</span>
            <span className="tag">visualization</span>
          </div>
        </div>

        <div className="idea-card card hover-lift">
          <div className="idea-header">
            <span className="idea-badge">Idea</span>
            <span className="idea-time">1 week ago</span>
          </div>
          <h3 className="idea-title">Agent Collaboration Platform</h3>
          <p className="idea-description">
            Allow multiple agents to work together on complex tasks with shared context
          </p>
          <div className="idea-tags">
            <span className="tag">agents</span>
            <span className="tag">collaboration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ideas;
