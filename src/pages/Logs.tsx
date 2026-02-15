
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Search } from 'lucide-react';
import './Logs.css';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  app: string;
  message: string;
}

const generateMockLog = (): LogEntry => {
    const levels: LogLevel[] = ['info', 'warn', 'error', 'debug'];
    const apps = ['auth-service', 'api-gateway', 'frontend', 'data-pipeline'];
    const messages = [
      'User logged in successfully',
      'Failed to connect to database',
      'API endpoint /users returned 200',
      'High memory usage detected',
      'Starting background job',
      'Invalid token received'
    ];
    return {
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      app: apps[Math.floor(Math.random() * apps.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    };
  };

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setLogs(prevLogs => [...prevLogs, generateMockLog()]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);
  
  const filteredLogs = logs.filter(log => {
    const levelMatch = levelFilter === 'all' || log.level === levelFilter;
    const searchMatch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        log.app.toLowerCase().includes(searchTerm.toLowerCase());
    return levelMatch && searchMatch;
  });

  return (
    <div className="logs-page">
      <header className="page-header">
        <h1 className="page-title gradient-text">Real-Time Logs</h1>
      </header>
      <div className="logs-toolbar card">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as any)}>
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
        </select>
        <button onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="logs-container card" ref={logContainerRef}>
        {filteredLogs.map((log, index) => (
          <div key={index} className={`log-entry ${log.level}`}>
            <span className="log-timestamp">{log.timestamp}</span>
            <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
            <span className="log-app">[{log.app}]</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Logs;
