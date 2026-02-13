import React, { useEffect, useState } from 'react';
import './ActiveAgents.css';

export interface Agent {
  id: string;
  name: string;
  task: string;
  status: 'running' | 'idle' | 'waiting' | 'error';
  progress?: number;
  startedAt?: Date;
  model?: string;
  tokensUsed?: number;
}

interface ActiveAgentsProps {
  maxAgents?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const ActiveAgents: React.FC<ActiveAgentsProps> = ({
  maxAgents = 5,
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      // Fetch agents list
      const response = await fetch('/agents.json');
      const agentList = await response.json();
      
      // Simulate active agents (in production, fetch from real API)
      const activeAgents: Agent[] = agentList
        .slice(0, 3)
        .map((agent: any, idx: number) => ({
          id: agent.name,
          name: agent.name,
          task: getSimulatedTask(agent.name),
          status: idx === 0 ? 'running' : idx === 1 ? 'idle' : 'waiting',
          progress: idx === 0 ? Math.floor(Math.random() * 100) : undefined,
          startedAt: idx === 0 ? new Date(Date.now() - Math.random() * 3600000) : undefined,
          model: 'Claude Sonnet 4.5',
          tokensUsed: idx === 0 ? Math.floor(Math.random() * 100000) : undefined,
        }));
      
      setAgents(activeAgents.slice(0, maxAgents));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setLoading(false);
    }
  };

  const getSimulatedTask = (agentName: string): string => {
    const tasks: Record<string, string[]> = {
      'coder': [
        'Implementing dashboard widgets',
        'Refactoring API endpoints',
        'Writing unit tests',
        'Reviewing code changes',
      ],
      'designer': [
        'Creating UI mockups',
        'Designing component library',
        'Optimizing visual hierarchy',
      ],
      'pm-orchestrator': [
        'Coordinating team tasks',
        'Planning sprint activities',
        'Reviewing project timeline',
      ],
      'idea-agent': [
        'Brainstorming features',
        'Analyzing user feedback',
        'Generating content ideas',
      ],
    };
    
    const agentTasks = tasks[agentName] || ['Processing tasks'];
    return agentTasks[Math.floor(Math.random() * agentTasks.length)];
  };

  useEffect(() => {
    fetchAgents();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAgents, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, maxAgents]);

  const getStatusIcon = (status: Agent['status']): string => {
    switch (status) {
      case 'running': return '🔄';
      case 'idle': return '💤';
      case 'waiting': return '⏸️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: Agent['status']): string => {
    switch (status) {
      case 'running': return 'agent-running';
      case 'idle': return 'agent-idle';
      case 'waiting': return 'agent-waiting';
      case 'error': return 'agent-error';
      default: return '';
    }
  };

  const getRunningTime = (startedAt?: Date): string => {
    if (!startedAt) return '';
    
    const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="active-agents-loading">
        <div className="spinner"></div>
        <p>Loading agents...</p>
      </div>
    );
  }

  const runningAgents = agents.filter(a => a.status === 'running');
  const idleAgents = agents.filter(a => a.status === 'idle');

  return (
    <div className="active-agents">
      <div className="agents-summary">
        <div className="summary-item">
          <span className="summary-value running">{runningAgents.length}</span>
          <span className="summary-label">Running</span>
        </div>
        <div className="summary-item">
          <span className="summary-value idle">{idleAgents.length}</span>
          <span className="summary-label">Idle</span>
        </div>
        <div className="summary-item">
          <span className="summary-value total">{agents.length}</span>
          <span className="summary-label">Total</span>
        </div>
      </div>

      <div className="agents-list">
        {agents.map((agent) => (
          <div key={agent.id} className={`agent-card ${getStatusColor(agent.status)}`}>
            <div className="agent-header">
              <div className="agent-info">
                <span className="agent-status-icon">{getStatusIcon(agent.status)}</span>
                <div>
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-model">{agent.model}</div>
                </div>
              </div>
              {agent.startedAt && (
                <div className="agent-runtime">
                  {getRunningTime(agent.startedAt)}
                </div>
              )}
            </div>

            <div className="agent-task">{agent.task}</div>

            {agent.progress !== undefined && (
              <div className="agent-progress">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
                <span className="progress-text">{agent.progress}%</span>
              </div>
            )}

            {agent.tokensUsed !== undefined && (
              <div className="agent-tokens">
                <span className="tokens-icon">🔢</span>
                <span>{agent.tokensUsed.toLocaleString()} tokens</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="agents-empty">
          <span className="empty-icon">🤖</span>
          <p>No active agents</p>
        </div>
      )}
    </div>
  );
};

export default ActiveAgents;
