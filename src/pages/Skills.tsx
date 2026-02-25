import React, { useState, useEffect } from 'react';
import './Skills.css';

interface Skill {
  id: string;
  name: string;
  description: string;
  type: string;
  source: string;
  usageCount: number;
}

type SortMode = 'usage' | 'alpha' | 'type';

const Skills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('usage');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/skills.json')
      .then(res => res.json())
      .then((data: Skill[]) => {
        // Already sorted by usage from generator; store as-is
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load skills:', err);
        setLoading(false);
      });
  }, []);

  const getSorted = (list: Skill[], mode: SortMode): Skill[] => {
    const copy = [...list];
    if (mode === 'usage') {
      copy.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0) || a.name.localeCompare(b.name));
    } else if (mode === 'alpha') {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else if (mode === 'type') {
      copy.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }
    return copy;
  };

  useEffect(() => {
    let base = skills;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      base = skills.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilteredSkills(getSorted(base, sortMode));
  }, [searchTerm, skills, sortMode]);

  const getSkillIcon = (name: string, type: string): string => {
    const n = name.toLowerCase();
    if (n.includes('browser') || n.includes('web')) return '🌐';
    if (n.includes('android') || n.includes('mobile') || n.includes('expo')) return '📱';
    if (n.includes('camera') || n.includes('photo') || n.includes('screenshot')) return '📷';
    if (n.includes('twitter') || n.includes('bird') || n.includes('x-')) return '🐦';
    if (n.includes('email') || n.includes('mail') || n.includes('mailgun')) return '📧';
    if (n.includes('calendar')) return '📅';
    if (n.includes('voice') || n.includes('audio') || n.includes('phone')) return '🎤';
    if (n.includes('video') || n.includes('youtube') || n.includes('yt-')) return '🎥';
    if (n.includes('database') || n.includes('postgres') || n.includes('supabase')) return '💾';
    if (n.includes('search') || n.includes('serpapi') || n.includes('places')) return '🔍';
    if (n.includes('analytics') || n.includes('tracking')) return '📊';
    if (n.includes('security') || n.includes('pentest') || n.includes('zero-trust')) return '🔐';
    if (n.includes('agent') || n.includes('orchestr') || n.includes('ralph')) return '🤖';
    if (n.includes('deploy') || n.includes('cloudflare') || n.includes('vercel')) return '🚀';
    if (n.includes('memory')) return '🧠';
    if (n.includes('flight') || n.includes('travel') || n.includes('airbnb')) return '✈️';
    if (n.includes('restaurant') || n.includes('food')) return '🍽️';
    if (n.includes('linkedin')) return '💼';
    if (n.includes('accessibility')) return '♿';
    if (n.includes('design') || n.includes('modern')) return '🎨';
    if (n.includes('coder') || n.includes('coding')) return '💻';
    if (n.includes('weather')) return '🌤️';
    if (n.includes('image')) return '🖼️';
    if (n.includes('tiktok')) return '🎵';
    if (type === 'security') return '🔐';
    if (type === 'deployment') return '🚀';
    if (type === 'social') return '💬';
    if (type === 'agent') return '🤖';
    return '⚡';
  };

  const getSourceBadge = (source: string) => {
    if (source === 'workspace') return { label: 'custom', cls: 'source-custom' };
    return { label: 'built-in', cls: 'source-builtin' };
  };

  if (loading) {
    return (
      <div className="skills-page">
        <header className="page-header">
          <h1 className="page-title gradient-text">Skills</h1>
        </header>
        <div className="loading-state">Loading skills...</div>
      </div>
    );
  }

  const topUsed = skills.filter(s => (s.usageCount ?? 0) > 0).length;

  return (
    <div className="skills-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Skills</h1>
          <p className="page-subtitle">
            {skills.length} skills · {topUsed} with usage data
          </p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-box card">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search skills by name, description, or type..."
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
        <div className="search-controls">
          <span className="search-results">
            Showing {filteredSkills.length} of {skills.length} skills
          </span>
          <div className="sort-buttons">
            <span className="sort-label">Sort:</span>
            {(['usage', 'alpha', 'type'] as SortMode[]).map(mode => (
              <button
                key={mode}
                className={`sort-btn ${sortMode === mode ? 'active' : ''}`}
                onClick={() => setSortMode(mode)}
              >
                {mode === 'usage' ? '🔥 Most Used' : mode === 'alpha' ? 'A–Z' : '📂 Type'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="skills-grid-section">
        <div className="skills-grid">
          {filteredSkills.map((skill) => {
            const src = getSourceBadge(skill.source);
            const usage = skill.usageCount ?? 0;
            return (
              <div key={skill.id} className="skill-card card">
                <div className="skill-header">
                  <div className="skill-title-group">
                    <span className="skill-icon">{getSkillIcon(skill.name, skill.type)}</span>
                    <h3 className="skill-name">{skill.name}</h3>
                  </div>
                  <div className="skill-badges">
                    {usage > 0 && (
                      <span className="usage-badge" title={`Used ${usage} times`}>
                        🔥 {usage}
                      </span>
                    )}
                    <span className={`source-badge ${src.cls}`}>{src.label}</span>
                  </div>
                </div>

                <div className="skill-description">
                  {skill.description || 'No description available'}
                </div>

                <div className="skill-footer">
                  <span className="type-badge">{skill.type}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="empty-state card">
            <span className="empty-icon">🔍</span>
            <h3>No skills found</h3>
            <p>Try adjusting your search term</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Skills;
