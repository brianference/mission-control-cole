import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsCategory = 'appearance' | 'notifications' | 'integrations' | 'costs' | 'about';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: number;
  compactMode: boolean;
  animations: boolean;
  notificationsEnabled: boolean;
  criticalAlerts: boolean;
  warningAlerts: boolean;
  infoAlerts: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
  costAlertThreshold: number;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  accentColor: '#8b9bff',
  fontSize: 16,
  compactMode: false,
  animations: true,
  notificationsEnabled: true,
  criticalAlerts: true,
  warningAlerts: true,
  infoAlerts: true,
  emailDigest: 'weekly',
  costAlertThreshold: 80,
};

const accentColors = [
  { name: 'Indigo', color: '#8b9bff' },
  { name: 'Purple', color: '#9d6cc9' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Green', color: '#34d399' },
  { name: 'Orange', color: '#f59e0b' },
  { name: 'Red', color: '#f87171' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('appearance');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('missionControlSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('missionControlSettings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const categories = [
    { id: 'appearance' as const, icon: '🎨', label: 'Appearance' },
    { id: 'notifications' as const, icon: '🔔', label: 'Notifications' },
    { id: 'integrations' as const, icon: '🔗', label: 'Integrations' },
    { id: 'costs' as const, icon: '💰', label: 'Cost Mgmt' },
    { id: 'about' as const, icon: 'ℹ️', label: 'About' },
  ];

  const renderContent = () => {
    switch (activeCategory) {
      case 'appearance':
        return (
          <div className="settings-content">
            <h3>Appearance</h3>
            
            <div className="setting-group">
              <label>Theme</label>
              <div className="setting-options">
                {(['light', 'dark', 'auto'] as const).map((theme) => (
                  <button
                    key={theme}
                    className={`option-btn ${settings.theme === theme ? 'active' : ''}`}
                    onClick={() => updateSetting('theme', theme)}
                  >
                    {theme === 'light' && '☀️'} 
                    {theme === 'dark' && '🌙'} 
                    {theme === 'auto' && '🔄'} 
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Accent Color</label>
              <div className="color-options">
                {accentColors.map((c) => (
                  <button
                    key={c.color}
                    className={`color-btn ${settings.accentColor === c.color ? 'active' : ''}`}
                    style={{ backgroundColor: c.color }}
                    onClick={() => updateSetting('accentColor', c.color)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Font Size: {settings.fontSize}px</label>
              <input
                type="range"
                min="14"
                max="20"
                value={settings.fontSize}
                onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
              />
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => updateSetting('compactMode', e.target.checked)}
                />
                <span>Compact Mode</span>
              </label>
            </div>

            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.animations}
                  onChange={(e) => updateSetting('animations', e.target.checked)}
                />
                <span>Enable Animations</span>
              </label>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-content">
            <h3>Notifications</h3>
            
            <div className="setting-group">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={settings.notificationsEnabled}
                  onChange={(e) => updateSetting('notificationsEnabled', e.target.checked)}
                />
                <span>Enable Notifications</span>
              </label>
            </div>

            <div className="setting-group">
              <label>Alert Types</label>
              <div className="checkbox-group">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.criticalAlerts}
                    onChange={(e) => updateSetting('criticalAlerts', e.target.checked)}
                  />
                  <span>🚨 Critical Alerts</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.warningAlerts}
                    onChange={(e) => updateSetting('warningAlerts', e.target.checked)}
                  />
                  <span>⚠️ Warnings</span>
                </label>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={settings.infoAlerts}
                    onChange={(e) => updateSetting('infoAlerts', e.target.checked)}
                  />
                  <span>ℹ️ Info</span>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label>Email Digest</label>
              <select
                value={settings.emailDigest}
                onChange={(e) => updateSetting('emailDigest', e.target.value as 'daily' | 'weekly' | 'never')}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">Never</option>
              </select>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="settings-content">
            <h3>Integrations</h3>
            <div className="integration-list">
              <div className="integration-item connected">
                <span className="integration-icon">📊</span>
                <div className="integration-info">
                  <div className="integration-name">OpenClaw</div>
                  <div className="integration-status">✅ Connected</div>
                </div>
              </div>
              <div className="integration-item connected">
                <span className="integration-icon">☁️</span>
                <div className="integration-info">
                  <div className="integration-name">Cloudflare</div>
                  <div className="integration-status">✅ Connected</div>
                </div>
              </div>
              <div className="integration-item">
                <span className="integration-icon">🐙</span>
                <div className="integration-info">
                  <div className="integration-name">GitHub</div>
                  <div className="integration-status">⚙️ Configure</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="settings-content">
            <h3>Cost Management</h3>
            
            <div className="setting-group">
              <label>Alert Threshold: {settings.costAlertThreshold}%</label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.costAlertThreshold}
                onChange={(e) => updateSetting('costAlertThreshold', Number(e.target.value))}
              />
              <p className="setting-help">
                Get notified when costs reach this percentage of your budget
              </p>
            </div>

            <div className="setting-group">
              <label>Monthly Budget</label>
              <input
                type="text"
                placeholder="$500"
                className="text-input"
              />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-content">
            <h3>About Mission Control</h3>
            <div className="about-info">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Built by:</strong> Cole ⚡</p>
              <p><strong>For:</strong> Brian</p>
              <p><strong>Stack:</strong> React + TypeScript + Vite</p>
              <p><strong>Deployed:</strong> Cloudflare Pages</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="settings-body">
          <nav className="settings-nav">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="nav-icon">{cat.icon}</span>
                <span className="nav-label">{cat.label}</span>
              </button>
            ))}
          </nav>

          <div className="settings-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
