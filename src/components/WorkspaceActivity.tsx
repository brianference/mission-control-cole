import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
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

interface WorkspaceActivityDay {
  date: string;
  commits: number;
  files: number;
}

interface WorkspaceActivityRepo {
  name: string;
  commits?: number;
}

interface WorkspaceActivityData {
  week?: WorkspaceActivityDay[];
  topRepos?: WorkspaceActivityRepo[];
}

const WorkspaceActivity: React.FC = () => {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [weekData, setWeekData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await fetch('/workspace-activity.json');
        if (response.ok) {
          const data: WorkspaceActivityData = await response.json();
          
          // Transform workspace-activity.json format to ActivityDay format
          // workspace-activity.json has: { week: [{date, commits, files}], topRepos: [...] }
          const transformedData: ActivityDay[] = data.week?.map((day: WorkspaceActivityDay) => {
            const dayDate = new Date(day.date);
            const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Extract repo names as projects
            const projects = data.topRepos?.slice(0, 3).map((r: WorkspaceActivityRepo) => r.name) || [];
            
            return {
              date: day.date,
              label: dayLabel,
              commits: day.commits || 0,
              files: day.files || 0,
              skills: [], // Skills would need to be added to generate-real-data.sh
              projects: day.commits > 0 ? projects : [],
              highlight: day.commits > 50 ? `${day.commits} commits!` : undefined
            };
          }) || [];
          
          setWeekData(transformedData);
          setError(null);
        } else {
          setWeekData([]);
          setError('No activity data. Run generate-real-data.sh');
        }
      } catch {
        setWeekData([]);
        setError('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <div className="workspace-activity">
        <div className="wa-header">
          <div className="wa-title">
            <span className="wa-icon">📊</span>
            <span>Workspace Activity</span>
          </div>
        </div>
        <div className="wa-loading">
          <RefreshCw className="spin" size={20} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || weekData.length === 0) {
    return (
      <div className="workspace-activity">
        <div className="wa-header">
          <div className="wa-title">
            <span className="wa-icon">📊</span>
            <span>Workspace Activity</span>
          </div>
        </div>
        <div className="wa-empty">
          <span>📭</span>
          <p>{error || 'No activity data'}</p>
          <code>./generate-real-data.sh</code>
        </div>
      </div>
    );
  }

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
                    height: `${Math.min(100, (day.commits / (weekSummary.heaviestDay.commits || 1)) * 100)}%`,
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

          {weekSummary.heaviestDay.commits > 0 && (
            <div className="wa-highlight">
              🔥 Peak: {weekSummary.heaviestDay.label} ({weekSummary.heaviestDay.commits} commits)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceActivity;
