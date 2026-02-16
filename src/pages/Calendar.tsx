import React, { useState, useEffect } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'cron' | 'reminder' | 'task' | 'meeting';
  source?: string;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/calendar-events.json');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        } else {
          setEvents([]);
        }
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && 
                         today.getFullYear() === currentMonth.getFullYear();

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'cron': return '#818cf8';
      case 'reminder': return '#f59e0b';
      case 'task': return '#10b981';
      case 'meeting': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === selectedDate)
    : [];

  if (loading) {
    return (
      <div className="page">
        <div className="loading-state">
          <RefreshCw className="spin" size={24} />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="page-icon">📅</span>
            Calendar
          </h1>
          <p className="page-subtitle">Cron jobs, reminders, and scheduled tasks</p>
        </div>
      </header>

      <div className="calendar-layout">
        <div className="calendar-view card">
          <div className="calendar-header">
            <button className="nav-btn" onClick={() => navigateMonth(-1)}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="calendar-month">{formatMonthYear(currentMonth)}</h2>
            <button className="nav-btn" onClick={() => navigateMonth(1)}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {/* Empty cells before first day */}
            {Array.from({ length: startingDay }, (_, i) => (
              <div key={`empty-${i}`} className="calendar-day disabled"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = getEventsForDay(day);
              const isToday = isCurrentMonth && day === today.getDate();
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-event' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <span className="day-number">{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="event-dots">
                      {dayEvents.slice(0, 3).map((event, idx) => (
                        <span 
                          key={idx} 
                          className="event-dot"
                          style={{ backgroundColor: getEventTypeColor(event.type) }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="more-events">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="calendar-empty">
              <p>No events scheduled</p>
              <code>Generate with ./generate-real-data.sh</code>
            </div>
          )}
        </div>

        {/* Event Details Panel */}
        <div className="events-panel card">
          <h3 className="panel-title">
            {selectedDate 
              ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })
              : 'Select a date'}
          </h3>
          
          {selectedDateEvents.length === 0 && selectedDate && (
            <div className="no-events">No events on this day</div>
          )}
          
          {selectedDateEvents.map((event, idx) => (
            <div key={idx} className="event-card" style={{ borderLeftColor: getEventTypeColor(event.type) }}>
              <div className="event-type" style={{ color: getEventTypeColor(event.type) }}>
                {event.type.toUpperCase()}
              </div>
              <div className="event-title">{event.title}</div>
              {event.time && <div className="event-time">🕐 {event.time}</div>}
              {event.source && <div className="event-source">Source: {event.source}</div>}
            </div>
          ))}

          {/* Legend */}
          <div className="events-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#818cf8' }}></span>
              Cron Jobs
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              Reminders
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
              Tasks
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }}></span>
              Meetings
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
