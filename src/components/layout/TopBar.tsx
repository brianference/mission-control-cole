import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './TopBar.css';

interface TopBarProps {
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const settingsContainerRef = useRef<HTMLDivElement>(null);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

  const closeAllPanels = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowSettings(false);
  };

  const toggleUserMenu = () => {
    // Only one popover open at a time
    setShowNotifications(false);
    setShowSettings(false);
    setShowUserMenu(!showUserMenu);
  };

  const toggleNotifications = () => {
    setShowUserMenu(false);
    setShowSettings(false);
    setShowNotifications(!showNotifications);
  };

  const toggleSettings = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowSettings(!showSettings);
  };

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      // Close open popovers when clicking outside any of them.
      const target = event.target as Node;
      const clickedInsideNotifications = notificationsContainerRef.current?.contains(target);
      const clickedInsideSettings = settingsContainerRef.current?.contains(target);
      const clickedInsideUserMenu = userMenuContainerRef.current?.contains(target);

      if (clickedInsideNotifications || clickedInsideSettings || clickedInsideUserMenu) return;

      if (showUserMenu || showNotifications || showSettings) {
        closeAllPanels();
      }
    };

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [showUserMenu, showNotifications, showSettings]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showUserMenu || showNotifications || showSettings) closeAllPanels();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showUserMenu, showNotifications, showSettings]);

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
        <div className="topbar-panel-container" ref={notificationsContainerRef}>
          <button
            className={`topbar-icon-btn ${showNotifications ? 'is-open' : ''}`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            aria-controls="notifications-panel"
            title="Notifications"
            onClick={toggleNotifications}
          >
            <span className="icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>

          {showNotifications && (
            <div id="notifications-panel" className="topbar-panel" role="dialog" aria-label="Notifications panel">
              <div className="topbar-panel-header">
                <div className="topbar-panel-title">Notifications</div>
                <button className="topbar-panel-close" onClick={closeAllPanels} aria-label="Close notifications">
                  ✕
                </button>
              </div>
              <div className="topbar-panel-content">
                <div className="topbar-panel-item">
                  <div className="topbar-panel-item-title">Deploy completed</div>
                  <div className="topbar-panel-item-meta">2 minutes ago</div>
                </div>
                <div className="topbar-panel-item">
                  <div className="topbar-panel-item-title">New comment on Doc</div>
                  <div className="topbar-panel-item-meta">35 minutes ago</div>
                </div>
                <div className="topbar-panel-item">
                  <div className="topbar-panel-item-title">Cost alert threshold reached</div>
                  <div className="topbar-panel-item-meta">Today</div>
                </div>
              </div>
            </div>
          )}
        </div>

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

          {showSettings && (
            <div id="settings-panel" className="topbar-panel" role="dialog" aria-label="Settings panel">
              <div className="topbar-panel-header">
                <div className="topbar-panel-title">Settings</div>
                <button className="topbar-panel-close" onClick={closeAllPanels} aria-label="Close settings">
                  ✕
                </button>
              </div>
              <div className="topbar-panel-content">
                <Link to="/settings" className="topbar-panel-link" onClick={closeAllPanels}>
                  <span aria-hidden="true">⚙️</span> Open Settings
                </Link>
                <Link to="/profile" className="topbar-panel-link" onClick={closeAllPanels}>
                  <span aria-hidden="true">👤</span> Profile
                </Link>
              </div>
            </div>
          )}
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
    </header>
  );
};

export default TopBar;
