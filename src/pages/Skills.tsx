import React, { useState, useEffect } from 'react';
import './Skills.css';

interface Skill {
  name: string;
  description: string;
  type: string;
}

const Skills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load skills from JSON file
    fetch('/skills.json')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setFilteredSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load skills:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Filter skills based on search term
    if (searchTerm.trim() === '') {
      setFilteredSkills(skills);
    } else {
      const filtered = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    }
  }, [searchTerm, skills]);

  // Get icon based on skill name or type
  const getSkillIcon = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('browser') || lowerName.includes('web')) return '🌐';
    if (lowerName.includes('android') || lowerName.includes('mobile')) return '📱';
    if (lowerName.includes('camera') || lowerName.includes('photo')) return '📷';
    if (lowerName.includes('twitter') || lowerName.includes('bird')) return '🐦';
    if (lowerName.includes('email') || lowerName.includes('mail')) return '📧';
    if (lowerName.includes('calendar')) return '📅';
    if (lowerName.includes('voice') || lowerName.includes('audio')) return '🎤';
    if (lowerName.includes('video')) return '🎥';
    if (lowerName.includes('database') || lowerName.includes('storage')) return '💾';
    if (lowerName.includes('search')) return '🔍';
    if (lowerName.includes('analytics')) return '📊';
    if (lowerName.includes('security') || lowerName.includes('auth')) return '🔐';
    if (lowerName.includes('automation') || lowerName.includes('workflow')) return '⚙️';
    if (lowerName.includes('agent') || lowerName.includes('orchestrat')) return '🤖';
    if (lowerName.includes('accessibility')) return '♿';
    return '⚡'; // Default icon
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

  return (
    <div className="skills-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Skills</h1>
          <p className="page-subtitle">
            {skills.length} available capabilities
          </p>
        </div>
      </header>

      <div className="search-section">
        <div className="search-box card">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search skills by name or description..."
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
        <div className="search-results">
          Showing {filteredSkills.length} of {skills.length} skills
        </div>
      </div>

      <section className="skills-grid-section">
        <div className="skills-grid">
          {filteredSkills.map((skill, index) => (
            <div key={index} className="skill-card card">
              <div className="skill-header">
                <div className="skill-title-group">
                  <span className="skill-icon">{getSkillIcon(skill.name)}</span>
                  <h3 className="skill-name">{skill.name}</h3>
                </div>
                <span className="status-dot online" title="Active"></span>
              </div>
              
              <div className="skill-description">
                {skill.description || 'No description available'}
              </div>

              <div className="skill-footer">
                <div className="skill-type">
                  <span className="type-badge">{skill.type}</span>
                </div>
              </div>
            </div>
          ))}
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
