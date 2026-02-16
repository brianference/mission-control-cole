import React, { useState, useEffect } from 'react';
import WorkspaceActivity from '../components/WorkspaceActivity';
import './Agents.css';

interface Agent {
  name: string;
  description: string;
  type: string;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load agents from JSON file
    fetch('/agents.json')
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        setFilteredAgents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load agents:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filter agents based on search term
    if (searchTerm.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchTerm, agents]);

  // Get icon based on agent name or role
  const getAgentIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('coder') || lowerName.includes('developer')) return '👨‍💻';
    if (lowerName.includes('designer')) return '🎨';
    if (lowerName.includes('pm') || lowerName.includes('orchestrator')) return '📋';
    if (lowerName.includes('test') || lowerName.includes('validator')) return '🧪';
    if (lowerName.includes('idea')) return '💡';
    if (lowerName.includes('scholarship')) return '🎓';
    if (lowerName.includes('visual')) return '👁️';
    return '🤖'; // Default robot icon
  };

  if (loading) {
    return (
      <div className="agents-page">
        <header className="page-header">
          <h1 className="page-title gradient-text">Agents</h1>
        </header>
        <div className="loading-state">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="agents-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Agents</h1>
          <p className="page-subtitle">
            {agents.length} autonomous agents ready to assist
          </p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-box card">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search agents by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-results">
          Showing {filteredAgents.length} of {agents.length} agents
        </div>
      </div>

      {/* Workspace Activity Summary */}
      <WorkspaceActivity />

      <section className="agents-grid-section">
        <div className="agents-grid">
          {filteredAgents.map((agent, index) => (
            <div key={index} className="agent-card card">
              <div className="agent-header">
                <div className="agent-title-group">
                  <span className="agent-icon">{getAgentIcon(agent.name)}</span>
                  <h3 className="agent-name">{agent.name}</h3>
                </div>
                <span className="status-dot online" title="Active"></span>
              </div>
              
              <div className="agent-description">
                {agent.description || 'No description available'}
              </div>

              <div className="agent-footer">
                <div className="agent-type">
                  <span className="type-badge">{agent.type}</span>
                </div>
                <div className="agent-stats">
                  <div className="stat-item">
                    <span className="stat-value">Active</span>
                    <span className="stat-label">Status</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAgents.length === 0 && (
          <div className="empty-state card">
            <span className="empty-icon">🔍</span>
            <h3>No agents found</h3>
            <p>Try adjusting your search term</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Agents;
