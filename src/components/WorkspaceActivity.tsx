import React, { useState } from 'react';
import './WorkspaceActivity.css';

interface ActivityDay {
  date: string;
  label: string;
  commits: number;
  files: number;
  skills: string[];
  projects: string[];
  highlight?: string;
}

const WorkspaceActivity: React.FC = () => {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  // In production, fetch from /workspace-activity.json
  const weekData: ActivityDay[] = [
    {
      date: '2026-02-15',
      label: 'Today',
      commits: 3,
      files: 25,
      skills: ['cloudflare-pages-deploy', 'memory-optimization', 'phone-calls-bland'],
      projects: ['mission-control', 'lena-scholarships'],
      highlight: 'Cloudflare deploy fix'
    },
    {
      date: '2026-02-14',
      label: 'Sat',
      commits: 2,
      files: 8,
      skills: ['emergency-rate-limit'],
      projects: ['tokyo-trip'],
    },
    {
      date: '2026-02-13',
      label: 'Fri',
      commits: 1,
      files: 2,
      skills: [],
      projects: [],
    },
    {
      date: '2026-02-12',
      label: 'Thu',
      commits: 42,
      files: 30,
      skills: ['humanizer', 'last30days', 'markdown-optimization'],
      projects: ['mission-control', 'tokyo-trip'],
      highlight: 'Heavy dev day'
    },
    {
      date: '2026-02-11',
      label: 'Wed',
      commits: 5,
      files: 6,
      skills: ['supermemory-integration'],
      projects: [],
    },
    {
      date: '2026-02-10',
      label: 'Tue',
      commits: 4,
      files: 6,
      skills: ['percy-visual-testing', 'agent-task-chunking'],
      projects: [],
    },
    {
      date: '2026-02-09',
      label: 'Mon',
      commits: 3,
      files: 5,
      skills: ['no-bs-debugging', 'screenshot-proof-workflow'],
      projects: [],
    },
  ];

  const weekSummary = {
    totalCommits: weekData.reduce((s, d) => s + d.commits, 0),
    totalFiles: weekData.reduce((s, d) => s + d.files, 0),
    uniqueSkills: [...new Set(weekData.flatMap(d => d.skills))].length,
    uniqueProjects: [...new Set(weekData.flatMap(d => d.projects))].length,
    heaviestDay: weekData.reduce((max, d) => d.commits > max.commits ? d : max, weekData[0]),
  };

  const today = weekData[0];

  return (
    <div className="workspace-activity">
      <div className="wa-header">
        <div className="wa-title">
          <span className="wa-icon">📊</span>
          <span>Workspace Activity</span>
        </div>
        <div className="wa-toggle">
          <button 
            className={`wa-btn ${view === 'daily' ? 'active' : ''}`}
            onClick={() => setView('daily')}
          >
            Day
          </button>
          <button 
            className={`wa-btn ${view === 'weekly' ? 'active' : ''}`}
            onClick={() => setView('weekly')}
          >
            Week
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <div className="wa-daily">
          <div className="wa-stats-row">
            <div className="wa-stat">
              <span className="wa-stat-value">{today.commits}</span>
              <span className="wa-stat-label">Commits</span>
            </div>
            <div className="wa-stat">
              <span className="wa-stat-value">{today.files}</span>
              <span className="wa-stat-label">Files</span>
            </div>
            <div className="wa-stat">
              <span className="wa-stat-value">{today.skills.length}</span>
              <span className="wa-stat-label">Skills</span>
            </div>
            <div className="wa-stat">
              <span className="wa-stat-value">{today.projects.length}</span>
              <span className="wa-stat-label">Projects</span>
            </div>
          </div>

          {today.skills.length > 0 && (
            <div className="wa-tags">
              <span className="wa-tags-label">Skills:</span>
              {today.skills.slice(0, 3).map((s, i) => (
                <span key={i} className="wa-tag skill">{s}</span>
              ))}
              {today.skills.length > 3 && (
                <span className="wa-tag more">+{today.skills.length - 3}</span>
              )}
            </div>
          )}

          {today.projects.length > 0 && (
            <div className="wa-tags">
              <span className="wa-tags-label">Projects:</span>
              {today.projects.map((p, i) => (
                <span key={i} className="wa-tag project">{p}</span>
              ))}
            </div>
          )}

          {today.highlight && (
            <div className="wa-highlight">⚡ {today.highlight}</div>
          )}
        </div>
      ) : (
        <div className="wa-weekly">
          <div className="wa-stats-row">
            <div className="wa-stat">
              <span className="wa-stat-value">{weekSummary.totalCommits}</span>
              <span className="wa-stat-label">Commits</span>
            </div>
            <div className="wa-stat">
              <span className="wa-stat-value">{weekSummary.uniqueSkills}</span>
              <span className="wa-stat-label">Skills</span>
            </div>
            <div className="wa-stat">
              <span className="wa-stat-value">{weekSummary.uniqueProjects}</span>
              <span className="wa-stat-label">Projects</span>
            </div>
          </div>

          <div className="wa-week-chart">
            {weekData.map((day, i) => (
              <div key={i} className="wa-day-bar">
                <div 
                  className="wa-bar" 
                  style={{ 
                    height: `${Math.min(100, (day.commits / weekSummary.heaviestDay.commits) * 100)}%`,
                    background: day.date === weekSummary.heaviestDay.date 
                      ? 'linear-gradient(180deg, #818cf8, #6366f1)' 
                      : 'linear-gradient(180deg, #14b8a6, #0d9488)'
                  }}
                  title={`${day.commits} commits`}
                />
                <span className="wa-day-label">{day.label}</span>
              </div>
            ))}
          </div>

          <div className="wa-highlight">
            🔥 Peak: {weekSummary.heaviestDay.label} ({weekSummary.heaviestDay.commits} commits)
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceActivity;
