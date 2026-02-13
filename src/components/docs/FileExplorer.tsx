import React, { useState } from 'react';
import './FileExplorer.css';

interface FileItem {
  name: string;
  path: string;
  size: number;
  modified: string;
  preview?: string;
}

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect?: (file: FileItem) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'modified') {
      comparison = new Date(a.modified).getTime() - new Date(b.modified).getTime();
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    if (diffHours < 24 * 7) return `${Math.floor(diffHours / 24)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSort = (key: 'name' | 'modified' | 'size') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <input
          type="text"
          className="file-search"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="file-count">
          {sortedFiles.length} {sortedFiles.length === 1 ? 'file' : 'files'}
        </div>
      </div>

      <div className="file-sort-controls">
        <button
          className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => handleSort('name')}
        >
          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-btn ${sortBy === 'modified' ? 'active' : ''}`}
          onClick={() => handleSort('modified')}
        >
          Modified {sortBy === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button
          className={`sort-btn ${sortBy === 'size' ? 'active' : ''}`}
          onClick={() => handleSort('size')}
        >
          Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="file-list">
        {sortedFiles.length === 0 ? (
          <div className="no-files">
            <span className="text-2xl">📭</span>
            <p>No files found</p>
          </div>
        ) : (
          sortedFiles.map((file, index) => (
            <div
              key={index}
              className="file-item"
              onClick={() => onFileSelect && onFileSelect(file)}
            >
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-path">{file.path}</div>
              </div>
              <div className="file-meta">
                <div className="file-modified">{formatDate(file.modified)}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
