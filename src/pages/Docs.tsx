import React, { useState, useEffect } from 'react';
import FileExplorer from '../components/docs/FileExplorer';
import MemoryViewer from '../components/docs/MemoryViewer';
import './CommonPages.css';
import './Docs.css';

interface FileItem {
  name: string;
  path: string;
  size: number;
  modified: string;
  preview?: string;
}

interface Memory {
  id: string;
  content: string;
  source: 'mem0' | 'supermemory';
  timestamp: string;
  tags?: string[];
  project?: string;
}

const Docs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'files' | 'memories'>('files');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate mock file data (in production, scan workspace directory)
    const mockFiles: FileItem[] = [
      {
        name: 'IMPLEMENTATION-PLAN.md',
        path: '/workspace-coder/IMPLEMENTATION-PLAN.md',
        size: 7130,
        modified: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        name: 'CRON-COST-SUMMARY.md',
        path: '/workspace-coder/CRON-COST-SUMMARY.md',
        size: 4892,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        name: 'AGENT.md',
        path: '/workspace/agents/coder/AGENT.md',
        size: 15420,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        name: 'AGENTS.md',
        path: '/workspace/agents/coder/AGENTS.md',
        size: 8234,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
      {
        name: 'TOOLS.md',
        path: '/workspace/agents/coder/TOOLS.md',
        size: 12567,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      },
      {
        name: 'README.md',
        path: '/workspace-coder/mission-control-dashboard/README.md',
        size: 3421,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
      {
        name: 'HYBRID-SEARCH-IMPLEMENTATION.md',
        path: '/workspace-coder/HYBRID-SEARCH-IMPLEMENTATION.md',
        size: 9876,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      },
      {
        name: 'SOUL.md',
        path: '/workspace/agents/coder/SOUL.md',
        size: 5432,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      },
      {
        name: 'USER.md',
        path: '/workspace/agents/coder/USER.md',
        size: 2341,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      },
      {
        name: 'MEMORY.md',
        path: '/workspace/agents/coder/MEMORY.md',
        size: 18765,
        modified: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
    ];

    setFiles(mockFiles);

    // Generate mock memory data (in production, fetch from mem0/Supermemory APIs)
    const mockMemories: Memory[] = [
      {
        id: 'mem-1',
        content: 'Mission Control dashboard deployed to https://mission-control-cole.pages.dev - includes cost tracking, calendar, and content management features.',
        source: 'mem0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        tags: ['deployment', 'mission-control'],
        project: 'Mission Control',
      },
      {
        id: 'mem-2',
        content: 'US-128: Enhanced cost tracking with advanced analytics - includes top 10 tables, spike detection, tool call analysis, and cron job breakdown.',
        source: 'mem0',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        tags: ['feature', 'cost-tracking', 'us-128'],
        project: 'Mission Control',
      },
      {
        id: 'mem-3',
        content: 'Hybrid search implementation (US-122) - BM25 + semantic search with 4x improvement for exact matches. Located in memory_hybrid_search.py',
        source: 'supermemory',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        tags: ['search', 'optimization', 'us-122'],
        project: 'Search',
      },
      {
        id: 'mem-4',
        content: 'Cron job optimization opportunity: Auto-Assign Agents runs 48x/day at $1,063/month. Recommend reducing to 24x/day for 50% cost savings.',
        source: 'mem0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        tags: ['optimization', 'cron', 'cost'],
        project: 'System',
      },
      {
        id: 'mem-5',
        content: 'Cross-encoder reranking (US-123) eliminates false positives in semantic search. Uses sentence-transformers with 50ms overhead for 20 candidates.',
        source: 'supermemory',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        tags: ['search', 'reranking', 'us-123'],
        project: 'Search',
      },
      {
        id: 'mem-6',
        content: 'Designer Agent (Morpheus) spawned for UX spec generation. Creates DESIGN-SPEC.md with component breakdown, interactions, and responsive layouts.',
        source: 'mem0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        tags: ['agent', 'design', 'morpheus'],
        project: 'Agents',
      },
      {
        id: 'mem-7',
        content: 'Telegram integration uses inline buttons for interactive UX. Supports reactions in MINIMAL mode (1 per 5-10 exchanges guideline).',
        source: 'mem0',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        tags: ['telegram', 'integration', 'ux'],
        project: 'Communication',
      },
      {
        id: 'mem-8',
        content: 'NETLIFY_AUTH_TOKEN stored in /root/.openclaw/.env - use for deployment automation. Never use netlify login (CLI auth issues).',
        source: 'supermemory',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        tags: ['deployment', 'auth', 'netlify'],
        project: 'Infrastructure',
      },
    ];

    setMemories(mockMemories);
    setLoading(false);
  }, []);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    // In production, fetch actual file content
    setFileContent(`# ${file.name}\n\nFile path: ${file.path}\nSize: ${file.size} bytes\n\n[File preview would be loaded here]`);
  };

  const closePreview = () => {
    setSelectedFile(null);
    setFileContent('');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">📄 Documentation</h1>
          <p className="page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          📄 Documentation & Knowledge Base
        </h1>
        <p className="page-subtitle">
          Browse workspace files and search memories
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="docs-tabs">
        <button
          className={`docs-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          📁 Files ({files.length})
        </button>
        <button
          className={`docs-tab ${activeTab === 'memories' ? 'active' : ''}`}
          onClick={() => setActiveTab('memories')}
        >
          🧠 Memories ({memories.length})
        </button>
      </div>

      {/* Files Tab */}
      {activeTab === 'files' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📁 Workspace Markdown Files
          </h2>
          <FileExplorer files={files} onFileSelect={handleFileSelect} />
        </div>
      )}

      {/* Memories Tab */}
      {activeTab === 'memories' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🧠 Knowledge & Memories
          </h2>
          <MemoryViewer memories={memories} />
        </div>
      )}

      {/* File Preview Modal */}
      {selectedFile && (
        <div className="file-preview-modal" onClick={closePreview}>
          <div className="file-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-header">
              <div>
                <h3 className="file-preview-title">{selectedFile.name}</h3>
                <p className="file-preview-path">{selectedFile.path}</p>
              </div>
              <button className="close-btn" onClick={closePreview}>×</button>
            </div>
            <div className="file-preview-body">
              <pre>{fileContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docs;
