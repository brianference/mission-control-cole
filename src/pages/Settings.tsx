import React from 'react';
import './CommonPages.css';

const Settings: React.FC = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">⚙️</span>
            Settings
          </h1>
          <p className="page-subtitle">Configure your Mission Control preferences</p>
        </div>
      </header>

      <div className="settings-sections">
        <div className="settings-section card">
          <h3 className="settings-section-title">Appearance</h3>
          <div className="setting-item">
            <div>
              <div className="setting-label">Theme</div>
              <div className="setting-description">Choose your preferred theme</div>
            </div>
            <select className="select-input">
              <option>Indigo Night (Default)</option>
              <option>Light Mode</option>
              <option>Auto (System)</option>
            </select>
          </div>
          <div className="setting-item">
            <div>
              <div className="setting-label">Glassmorphism Intensity</div>
              <div className="setting-description">Adjust blur and transparency</div>
            </div>
            <input type="range" min="0" max="100" defaultValue="70" className="range-input" />
          </div>
        </div>

        <div className="settings-section card">
          <h3 className="settings-section-title">Notifications</h3>
          <div className="setting-item">
            <div>
              <div className="setting-label">Desktop Notifications</div>
              <div className="setting-description">Show system notifications for important events</div>
            </div>
            <input type="checkbox" defaultChecked className="toggle-input" />
          </div>
          <div className="setting-item">
            <div>
              <div className="setting-label">Email Alerts</div>
              <div className="setting-description">Receive email for critical alerts</div>
            </div>
            <input type="checkbox" defaultChecked className="toggle-input" />
          </div>
          <div className="setting-item">
            <div>
              <div className="setting-label">Sound Effects</div>
              <div className="setting-description">Play sounds for notifications</div>
            </div>
            <input type="checkbox" className="toggle-input" />
          </div>
        </div>

        <div className="settings-section card">
          <h3 className="settings-section-title">Real-Time Data</h3>
          <div className="setting-item">
            <div>
              <div className="setting-label">Update Frequency</div>
              <div className="setting-description">How often to refresh live stats</div>
            </div>
            <select className="select-input">
              <option>5 seconds</option>
              <option>10 seconds</option>
              <option>30 seconds</option>
              <option>1 minute</option>
            </select>
          </div>
          <div className="setting-item">
            <div>
              <div className="setting-label">Auto-reconnect WebSocket</div>
              <div className="setting-description">Automatically reconnect when connection drops</div>
            </div>
            <input type="checkbox" defaultChecked className="toggle-input" />
          </div>
        </div>

        <div className="settings-section card">
          <h3 className="settings-section-title">Privacy & Security</h3>
          <div className="setting-item">
            <div>
              <div className="setting-label">Activity Tracking</div>
              <div className="setting-description">Log user activity for analytics</div>
            </div>
            <input type="checkbox" defaultChecked className="toggle-input" />
          </div>
          <div className="setting-item">
            <div>
              <div className="setting-label">Auto Logout</div>
              <div className="setting-description">Automatically log out after inactivity</div>
            </div>
            <select className="select-input">
              <option>Never</option>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn-secondary">Reset to Defaults</button>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
};

export default Settings;
