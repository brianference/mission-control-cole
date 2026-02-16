import React, { useState, useEffect } from 'react';
import MemoryViewer from '../components/docs/MemoryViewer';
// FileExplorer replaced with inline grid for real data
import './CommonPages.css';
import './Docs.css';

interface FileItem {
  name: string;
  path: string;
  size: number;
  modified: string;
  type?: string;
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch REAL data from generated JSON files
    Promise.all([
      fetch('/docs.json').then(res => res.json()),
      fetch('/memories.json').then(res => res.json()).catch(() => [])
    ])
      .then(([docsData, memoriesData]) => {
        setFiles(docsData);
        
        // If no memories.json, show empty state (real data would come from API)
        if (memoriesData.length > 0) {
          setMemories(memoriesData);
        } else {
          // Placeholder - memories require runtime API access
          setMemories([]);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load docs:', err);
        setError('Failed to load documentation');
        setLoading(false);
      });
  }, []);

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file);
    // Show file metadata (actual content would require server-side access)
    const sizeKB = (file.size / 1024).toFixed(1);
    const modified = new Date(file.modified).toLocaleString();
    setFileContent(`# ${file.name}

**Path:** ${file.path}
**Size:** ${sizeKB} KB
**Modified:** ${modified}
**Type:** ${file.type || 'unknown'}

---

*File preview requires server-side access to workspace files.*
*This dashboard displays metadata from real workspace scans.*`);
  };

  const closePreview = () => {
    setSelectedFile(null);
    setFileContent('');
  };

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file type icon
  const getFileIcon = (file: FileItem): string => {
    if (file.type === 'config') return '⚙️';
    if (file.type === 'memory') return '📝';
    if (file.name.endsWith('.md')) return '📄';
    return '📁';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">📄 Documentation</h1>
          <p className="page-subtitle">Loading real workspace data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">📄 Documentation</h1>
          <p className="page-subtitle error">{error}</p>
        </div>
      </div>
    );
  }

  // Separate files by type
  const configFiles = files.filter(f => f.type === 'config');
  const memoryFiles = files.filter(f => f.type === 'memory');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          📄 Documentation & Knowledge Base
        </h1>
        <p className="page-subtitle">
          Real workspace files from /root/.openclaw/workspace
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
        <div className="docs-content">
          {/* Config Files */}
          <div className="glass-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ⚙️ Configuration Files ({configFiles.length})
            </h2>
            <div className="file-grid">
              {configFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="file-card" 
                  onClick={() => handleFileSelect(file)}
                >
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">{formatSize(file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Files */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📝 Memory Files ({memoryFiles.length})
            </h2>
            <div className="file-grid">
              {memoryFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="file-card" 
                  onClick={() => handleFileSelect(file)}
                >
                  <span className="file-icon">{getFileIcon(file)}</span>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-meta">
                      {formatSize(file.size)} • {new Date(file.modified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Memories Tab */}
      {activeTab === 'memories' && (
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🧠 Knowledge & Memories
          </h2>
          {memories.length > 0 ? (
            <MemoryViewer memories={memories} />
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🧠</span>
              <p>Memory data requires runtime API access to mem0/Supermemory.</p>
              <p className="text-sm text-muted">Use the OpenClaw memory tools to search and browse memories.</p>
            </div>
          )}
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
