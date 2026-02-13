import React from 'react';
import './CommonPages.css';

const Profile: React.FC = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">👤</span>
            Profile
          </h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
        <button className="btn-primary">Edit Profile</button>
      </header>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-card card">
            <div className="profile-avatar-large">B</div>
            <h2 className="profile-name">Brian</h2>
            <p className="profile-email">brian@openclaw.com</p>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-value">24</div>
                <div className="profile-stat-label">Projects</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">12</div>
                <div className="profile-stat-label">Agents</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-value">1.2K</div>
                <div className="profile-stat-label">Memories</div>
              </div>
            </div>
          </div>

          <div className="quick-actions card">
            <h3 className="quick-actions-title">Quick Actions</h3>
            <button className="quick-action-btn">🔑 Change Password</button>
            <button className="quick-action-btn">📧 Update Email</button>
            <button className="quick-action-btn">🔔 Notification Settings</button>
            <button className="quick-action-btn">🗑️ Delete Account</button>
          </div>
        </div>

        <div className="profile-main">
          <div className="profile-section card">
            <h3 className="profile-section-title">Personal Information</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" defaultValue="Brian" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" defaultValue="brian@openclaw.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea 
                className="form-textarea" 
                rows={4}
                defaultValue="Building the future of AI-powered development tools with OpenClaw and MobileClaw."
              />
            </div>
          </div>

          <div className="profile-section card">
            <h3 className="profile-section-title">Account Activity</h3>
            <div className="activity-stats">
              <div className="activity-stat">
                <div className="activity-stat-label">Last Login</div>
                <div className="activity-stat-value">Today at 9:23 AM</div>
              </div>
              <div className="activity-stat">
                <div className="activity-stat-label">Account Created</div>
                <div className="activity-stat-value">January 15, 2024</div>
              </div>
              <div className="activity-stat">
                <div className="activity-stat-label">Total Sessions</div>
                <div className="activity-stat-value">1,247</div>
              </div>
            </div>
          </div>

          <div className="profile-section card">
            <h3 className="profile-section-title">Integrations</h3>
            <div className="integration-list">
              <div className="integration-item">
                <div className="integration-info">
                  <span className="integration-icon">🤖</span>
                  <div>
                    <div className="integration-name">OpenClaw API</div>
                    <div className="integration-status">Connected</div>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>
              <div className="integration-item">
                <div className="integration-info">
                  <span className="integration-icon">🧠</span>
                  <div>
                    <div className="integration-name">Supermemory</div>
                    <div className="integration-status">Connected</div>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>
              <div className="integration-item">
                <div className="integration-info">
                  <span className="integration-icon">📱</span>
                  <div>
                    <div className="integration-name">MobileClaw</div>
                    <div className="integration-status">Connected</div>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-footer">
        <button className="btn-secondary">Cancel</button>
        <button className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
};

export default Profile;
