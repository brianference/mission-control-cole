import React, { useState } from 'react';
import './MemoryViewer.css';

interface Memory {
  id: string;
  content: string;
  source: 'mem0' | 'supermemory';
  timestamp: string;
  tags?: string[];
  project?: string;
}

interface MemoryViewerProps {
  memories: Memory[];
  onSearch?: (query: string) => void;
}

const MemoryViewer: React.FC<MemoryViewerProps> = ({ memories, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'mem0' | 'supermemory'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const projects = Array.from(new Set(memories.map(m => m.project).filter(Boolean))) as string[];

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = !searchQuery || 
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSource = filterSource === 'all' || memory.source === filterSource;
    const matchesProject = filterProject === 'all' || memory.project === filterProject;
    
    return matchesSearch && matchesSource && matchesProject;
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="memory-viewer">
      <div className="memory-header">
        <input
          type="text"
          className="memory-search"
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        <div className="memory-filters">
          <select
            className="filter-select"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as any)}
          >
            <option value="all">All Sources</option>
            <option value="mem0">Mem0</option>
            <option value="supermemory">Supermemory</option>
          </select>
          
          {projects.length > 0 && (
            <select
              className="filter-select"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="memory-count">
        {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
      </div>

      <div className="memory-list">
        {filteredMemories.length === 0 ? (
          <div className="no-memories">
            <span className="text-2xl">🧠</span>
            <p>No memories found</p>
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <div key={memory.id} className="memory-item">
              <div className="memory-source-badge" data-source={memory.source}>
                {memory.source === 'mem0' ? '🧠 Mem0' : '💭 Supermemory'}
              </div>
              
              <div className="memory-content">
                {memory.content}
              </div>
              
              {memory.tags && memory.tags.length > 0 && (
                <div className="memory-tags">
                  {memory.tags.map((tag, index) => (
                    <span key={index} className="memory-tag">#{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="memory-footer">
                {memory.project && (
                  <span className="memory-project">📁 {memory.project}</span>
                )}
                <span className="memory-timestamp">{formatDate(memory.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoryViewer;
