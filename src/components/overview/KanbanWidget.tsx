import React, { useEffect, useState } from 'react';
import './KanbanWidget.css';

interface KanbanCounts {
  total: number;
  'in-progress': number;
  'next-up': number;
  done: number;
  blocked: number;
  backlog: number;
}

interface QuickWin {
  id: number;
  title: string;
  priority: 'critical' | 'high' | 'med' | 'low';
  col: string;
  tag: string;
  storyNumber: string;
}

interface KanbanSummaryData {
  lastUpdated: string;
  counts: KanbanCounts;
  colCounts: Record<string, number>;
  quickWins: QuickWin[];
}

const priorityColor: Record<string, string> = {
  critical: '#f87171',
  high: '#fbbf24',
  med: '#60a5fa',
  low: '#9ca3af',
};

const KanbanWidget: React.FC = () => {
  const [data, setData] = useState<KanbanSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/kanban-summary.json')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="kanban-widget">
        <div className="kanban-widget-header">
          <span>📋 Kanban Board</span>
          <div className="kanban-loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="kanban-widget">
        <div className="kanban-widget-header">
          <span>📋 Kanban Board</span>
        </div>
        <div className="kanban-error">Failed to load kanban data</div>
      </div>
    );
  }

  const { counts, quickWins } = data;
  // Merge "in-progress" and "progress" columns
  const inProgress = (counts['in-progress'] || 0) + (data.colCounts['progress'] || 0);
  const unknown = data.colCounts['unknown'] || 0;

  return (
    <div className="kanban-widget">
      <div className="kanban-widget-header">
        <div className="kanban-title">
          <span className="kanban-icon">📋</span>
          <span>Kanban Board</span>
          <span className="kanban-total-badge">{counts.total}</span>
        </div>
        <a
          href="https://python-kanban.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="kanban-open-btn"
        >
          Open Board ↗
        </a>
      </div>

      {/* Column Count Grid */}
      <div className="kanban-counts-grid">
        <div className="kanban-count-cell kanban-in-progress">
          <div className="kanban-count-value">{inProgress}</div>
          <div className="kanban-count-label">🔄 In Progress</div>
        </div>
        <div className="kanban-count-cell kanban-next-up">
          <div className="kanban-count-value">{counts['next-up']}</div>
          <div className="kanban-count-label">⏭ Next Up</div>
        </div>
        <div className="kanban-count-cell kanban-done">
          <div className="kanban-count-value">{counts.done}</div>
          <div className="kanban-count-label">✅ Done</div>
        </div>
        <div className="kanban-count-cell kanban-blocked">
          <div className="kanban-count-value">{counts.blocked || 0}</div>
          <div className="kanban-count-label">🚫 Blocked</div>
        </div>
        <div className="kanban-count-cell kanban-backlog">
          <div className="kanban-count-value">{counts.backlog + unknown}</div>
          <div className="kanban-count-label">📦 Backlog</div>
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins && quickWins.length > 0 && (
        <div className="kanban-quick-wins">
          <div className="kanban-section-title">⚡ Quick Wins</div>
          <div className="kanban-wins-list">
            {quickWins.slice(0, 3).map((win, idx) => (
              <div key={win.id || idx} className="kanban-win-item">
                <span
                  className="kanban-priority-dot"
                  style={{ background: priorityColor[win.priority] || '#9ca3af' }}
                  title={win.priority}
                />
                <span className="kanban-win-title">{win.title}</span>
                <span className="kanban-win-col">{win.col}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="kanban-widget-footer">
        Updated {new Date(data.lastUpdated).toLocaleTimeString()}
        <a
          href="https://python-kanban.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="kanban-footer-link"
        >
          View full board →
        </a>
      </div>
    </div>
  );
};

export default KanbanWidget;
