import React, { useState, useEffect } from 'react';
import './BudgetSettings.css';

interface BudgetConfig {
  limits: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  alerts: {
    thresholds: number[];
    enabled: boolean;
  };
}

interface BudgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BudgetConfig) => void;
}

const BudgetSettings: React.FC<BudgetSettingsProps> = ({ isOpen, onClose, onSave }) => {
  const [limits, setLimits] = useState({ daily: 100, weekly: 500, monthly: 1500 });
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(70);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current config
      fetch('/budget.json')
        .then(res => res.json())
        .then(data => {
          setLimits(data.limits);
          setAlertsEnabled(data.alerts.enabled);
          setAlertThreshold(data.alerts.thresholds[0] * 100);
        })
        .catch(() => {
          // Keep defaults
        });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    
    const config: BudgetConfig = {
      limits,
      alerts: {
        thresholds: [alertThreshold / 100, 0.9, 1.0],
        enabled: alertsEnabled
      }
    };

    // Save to localStorage for persistence
    localStorage.setItem('budgetConfig', JSON.stringify(config));
    
    onSave(config);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="budget-settings-overlay" onClick={onClose}>
      <div className="budget-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💰 Budget Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h3>Spending Limits</h3>
            <p className="section-desc">Set maximum spending per period</p>
            
            <div className="limit-inputs">
              <div className="limit-group">
                <label>Daily Limit</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={limits.daily}
                    onChange={e => setLimits({ ...limits, daily: Number(e.target.value) })}
                    min={0}
                    step={10}
                  />
                </div>
              </div>
              
              <div className="limit-group">
                <label>Weekly Limit</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={limits.weekly}
                    onChange={e => setLimits({ ...limits, weekly: Number(e.target.value) })}
                    min={0}
                    step={50}
                  />
                </div>
              </div>
              
              <div className="limit-group">
                <label>Monthly Limit</label>
                <div className="input-with-prefix">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={limits.monthly}
                    onChange={e => setLimits({ ...limits, monthly: Number(e.target.value) })}
                    min={0}
                    step={100}
                  />
                </div>
              </div>
            </div>
            
            <div className="quick-presets">
              <span>Quick presets:</span>
              <button onClick={() => setLimits({ daily: 50, weekly: 250, monthly: 750 })}>
                Conservative
              </button>
              <button onClick={() => setLimits({ daily: 100, weekly: 500, monthly: 1500 })}>
                Standard
              </button>
              <button onClick={() => setLimits({ daily: 200, weekly: 1000, monthly: 3000 })}>
                High Volume
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Alert Settings</h3>
            
            <div className="toggle-row">
              <label>Enable budget alerts</label>
              <button 
                className={`toggle ${alertsEnabled ? 'active' : ''}`}
                onClick={() => setAlertsEnabled(!alertsEnabled)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            
            {alertsEnabled && (
              <div className="threshold-slider">
                <label>Alert when spending reaches</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(Number(e.target.value))}
                  />
                  <span className="threshold-value">{alertThreshold}%</span>
                </div>
                <p className="slider-hint">
                  You'll get alerts at {alertThreshold}%, 90%, and 100% of your limit
                </p>
              </div>
            )}
          </section>

          <section className="settings-section info-section">
            <h3>ℹ️ How it works</h3>
            <ul>
              <li>Cole checks your spending every 30 minutes</li>
              <li>Alerts are sent to this Telegram chat</li>
              <li>Limits don't stop spending - they just alert</li>
              <li>Settings are stored locally in your browser</li>
            </ul>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSettings;
