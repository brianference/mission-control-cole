import React, { useState, useEffect } from 'react';
import WorkspaceActivity from '../components/WorkspaceActivity';
import './Agents.css';

interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  type: string;
  canSpawn?: string[];
}

interface ActiveSession {
  agentId: string;
  sessionKey: string;
  displayName: string;
  model: string;
  totalTokens: number;
  updatedAt: number;
  status: string;
}

interface SessionsData {
  lastUpdated: string;
  sessions: ActiveSession[];
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load agents from JSON file (real config data)
    Promise.all([
      fetch('/agents.json').then(res => res.json()),
      fetch('/active-sessions.json').then(res => res.json()).catch(() => ({ sessions: [] }))
    ])
      .then(([agentsData, sessionsData]: [Agent[], SessionsData]) => {
        setAgents(agentsData);
        setFilteredAgents(agentsData);
        setActiveSessions(sessionsData.sessions || []);
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
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchTerm, agents]);

  // Check if agent has active session
  const getAgentStatus = (agentId: string): { isActive: boolean; session?: ActiveSession } => {
    const session = activeSessions.find(s => s.agentId === agentId);
    if (session) {
      // Consider active if updated in last 30 minutes
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      const isActive = session.updatedAt > thirtyMinAgo;
      return { isActive, session };
    }
    return { isActive: false };
  };

  // Get icon based on agent name or role
  const getAgentIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('coder') || lowerName.includes('developer')) return '👨‍💻';
    if (lowerName.includes('designer') || lowerName.includes('morpheus')) return '🎨';
    if (lowerName.includes('pm') || lowerName.includes('orchestrator')) return '📋';
    if (lowerName.includes('test') || lowerName.includes('validator')) return '🧪';
    if (lowerName.includes('idea')) return '💡';
    if (lowerName.includes('scholarship')) return '🎓';
    if (lowerName.includes('visual')) return '👁️';
    if (lowerName.includes('candi')) return '🍬';
    return '🤖';
  };

  // Format model name for display
  const formatModelName = (model: string): string => {
    if (model.includes('minimax')) return 'Minimax M2.1';
    if (model.includes('opus-4-6')) return 'Claude Opus 4.6';
    if (model.includes('opus-4-5')) return 'Claude Opus 4.5';
    if (model.includes('sonnet')) return 'Claude Sonnet';
    if (model.includes('haiku')) return 'Claude Haiku';
    if (model.includes('gemini')) return 'Gemini';
    if (model.includes('gpt')) return 'GPT-5.2';
    return model.split('/').pop() || model;
  };

  // Get cost tier badge
  const getCostTier = (model: string): { label: string; className: string } => {
    if (model.includes('minimax') || model.includes('haiku')) {
      return { label: '💰 Low Cost', className: 'cost-low' };
    }
    if (model.includes('sonnet') || model.includes('gemini')) {
      return { label: '💵 Medium', className: 'cost-medium' };
    }
    if (model.includes('opus') || model.includes('gpt')) {
      return { label: '💎 Premium', className: 'cost-high' };
    }
    return { label: '❓ Unknown', className: 'cost-unknown' };
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

  const activeCount = agents.filter(a => getAgentStatus(a.id).isActive).length;

  return (
    <div className="agents-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Agents</h1>
          <p className="page-subtitle">
            {agents.length} agents configured • {activeCount} active now
          </p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-box card">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search agents by name, description, or model..."
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
          {filteredAgents.map((agent) => {
            const { isActive, session } = getAgentStatus(agent.id);
            const costTier = getCostTier(agent.model);
            
            return (
              <div key={agent.id} className={`agent-card card ${isActive ? 'agent-active' : ''}`}>
                <div className="agent-header">
                  <div className="agent-title-group">
                    <span className="agent-icon">{getAgentIcon(agent.name)}</span>
                    <h3 className="agent-name">{agent.name}</h3>
                  </div>
                  <span 
                    className={`status-dot ${isActive ? 'online' : 'offline'}`} 
                    title={isActive ? 'Active' : 'Idle'}
                  ></span>
                </div>
                
                <div className="agent-description">
                  {agent.description}
                </div>

                <div className="agent-model">
                  <span className="model-label">Model:</span>
                  <span className="model-value">{formatModelName(agent.model)}</span>
                  <span className={`cost-badge ${costTier.className}`}>{costTier.label}</span>
                </div>

                {agent.canSpawn && agent.canSpawn.length > 0 && (
                  <div className="agent-spawns">
                    <span className="spawns-label">Can spawn:</span>
                    <span className="spawns-value">{agent.canSpawn.length} agents</span>
                  </div>
                )}

                <div className="agent-footer">
                  <div className="agent-type">
                    <span className="type-badge">{agent.type}</span>
                  </div>
                  <div className="agent-stats">
                    <div className="stat-item">
                      <span className={`stat-value ${isActive ? 'status-active' : 'status-idle'}`}>
                        {isActive ? 'Active' : 'Idle'}
                      </span>
                      <span className="stat-label">Status</span>
                    </div>
                    {session && (
                      <div className="stat-item">
                        <span className="stat-value">{(session.totalTokens / 1000).toFixed(0)}K</span>
                        <span className="stat-label">Tokens</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
