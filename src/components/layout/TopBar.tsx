import React, { useState } from 'react';
import './TopBar.css';

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <button
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
        >
          ☰
        </button>
        <div className="topbar-brand">
          <span className="brand-icon" aria-hidden="true">🚀</span>
          <h1 className="brand-title">Mission Control</h1>
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <span className="icon">🔔</span>
          <span className="notification-badge">3</span>
        </button>

        <button
          className="topbar-icon-btn"
          aria-label="Settings"
          title="Settings"
        >
          <span className="icon">⚙️</span>
        </button>

        <div className="user-menu-container">
          <button
            className="user-menu-button"
            onClick={toggleUserMenu}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            <div className="user-avatar">
              <span>B</span>
            </div>
            <span className="user-name">Brian</span>
            <span className="chevron">▼</span>
          </button>

          {showUserMenu && (
            <div className="user-menu-dropdown">
              <a href="/profile" className="menu-item">
                <span>👤</span> Profile
              </a>
              <a href="/settings" className="menu-item">
                <span>⚙️</span> Settings
              </a>
              <div className="menu-divider" />
              <button className="menu-item">
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
