import React from 'react';
import './CommonPages.css';

const Calendar: React.FC = () => {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">📅</span>
            Calendar
          </h1>
          <p className="page-subtitle">Manage your schedule and deadlines</p>
        </div>
        <button className="btn-primary">+ Add Event</button>
      </header>

      <div className="calendar-view card">
        <div className="calendar-header">
          <button className="btn-secondary">← Previous</button>
          <h2 className="calendar-month">February 2026</h2>
          <button className="btn-secondary">Next →</button>
        </div>

        <div className="calendar-grid">
          <div className="calendar-day-header">Sun</div>
          <div className="calendar-day-header">Mon</div>
          <div className="calendar-day-header">Tue</div>
          <div className="calendar-day-header">Wed</div>
          <div className="calendar-day-header">Thu</div>
          <div className="calendar-day-header">Fri</div>
          <div className="calendar-day-header">Sat</div>

          {/* Calendar days would be generated dynamically */}
          {[...Array(35)].map((_, i) => {
            const dayNum = i - 5 + 1;
            const isToday = dayNum === 12;
            const hasEvent = [5, 12, 18, 25].includes(dayNum);
            
            return (
              <div 
                key={i} 
                className={`calendar-day ${dayNum < 1 ? 'disabled' : ''} ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}
              >
                {dayNum > 0 && dayNum <= 29 && (
                  <>
                    <span className="day-number">{dayNum}</span>
                    {hasEvent && <span className="event-indicator">•</span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="upcoming-events">
        <h3 className="section-title">Upcoming Events</h3>
        
        <div className="event-card card hover-lift">
          <div className="event-time">
            <div className="event-date">Feb 12</div>
            <div className="event-hour">2:00 PM</div>
          </div>
          <div className="event-details">
            <h4 className="event-title">Mission Control Demo</h4>
            <p className="event-description">Present the new dashboard to the team</p>
            <div className="event-tags">
              <span className="tag">meeting</span>
              <span className="tag">demo</span>
            </div>
          </div>
        </div>

        <div className="event-card card hover-lift">
          <div className="event-time">
            <div className="event-date">Feb 15</div>
            <div className="event-hour">10:00 AM</div>
          </div>
          <div className="event-details">
            <h4 className="event-title">Content Review</h4>
            <p className="event-description">Review pending blog posts and social media content</p>
            <div className="event-tags">
              <span className="tag">content</span>
            </div>
          </div>
        </div>

        <div className="event-card card hover-lift">
          <div className="event-time">
            <div className="event-date">Feb 18</div>
            <div className="event-hour">All Day</div>
          </div>
          <div className="event-details">
            <h4 className="event-title">Server Maintenance</h4>
            <p className="event-description">Scheduled downtime for infrastructure upgrades</p>
            <div className="event-tags">
              <span className="tag">maintenance</span>
              <span className="tag">critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
