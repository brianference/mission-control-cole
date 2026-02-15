import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './TopBar.css';
import NotificationBell from 'components/notifications/NotificationBell';
import SettingsPanel from 'components/settings/SettingsPanel';

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

  const closeAllPanels = () => {
    setShowUserMenu(false);
    setShowSettings(false);
  };

  const toggleUserMenu = () => {
    setShowSettings(false);
    setShowUserMenu(!showUserMenu);
  };

  const toggleSettings = () => {
    setShowUserMenu(false);
    setShowSettings(!showSettings);
  };

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideSettings = settingsContainerRef.current?.contains(target);
      const clickedInsideUserMenu = userMenuContainerRef.current?.contains(target);

      if (clickedInsideSettings || clickedInsideUserMenu) return;

      if (showUserMenu || showSettings) {
        closeAllPanels();
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [showUserMenu, showSettings]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showUserMenu || showSettings) closeAllPanels();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showUserMenu, showSettings]);

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
          <Link to="/" className="brand-link">
            <span className="brand-icon" aria-hidden="true">🚀</span>
            <h1 className="brand-title">Mission Control</h1>
          </Link>
        </div>
      </div>

      <div className="topbar-right">
        <NotificationBell />

        <div className="topbar-panel-container" ref={settingsContainerRef}>
          <button
            className={`topbar-icon-btn ${showSettings ? 'is-open' : ''}`}
            aria-label="Settings"
            aria-expanded={showSettings}
            aria-controls="settings-panel"
            title="Settings"
            onClick={toggleSettings}
          >
            <span className="icon">⚙️</span>
          </button>
        </div>

        <div className="user-menu-container" ref={userMenuContainerRef}>
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
              <Link to="/profile" className="menu-item" onClick={closeAllPanels}>
                <span>👤</span> Profile
              </Link>
              <Link to="/settings" className="menu-item" onClick={closeAllPanels}>
                <span>⚙️</span> Settings
              </Link>
              <div className="menu-divider" />
              <button className="menu-item" type="button">
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      {showSettings && <SettingsPanel onClose={toggleSettings} />}
    </header>
  );
};

export default TopBar;
