import React, { useState } from 'react';
import './CostHeatmap.css';

interface HourData {
  hour: string;
  [day: string]: number | string;
}

interface CostHeatmapProps {
  data: HourData[];
}

interface CellDetail {
  day: string;
  hour: string;
  cost: number;
  sessions?: number;
  topModel?: string;
  topTask?: string;
}

const CostHeatmap: React.FC<CostHeatmapProps> = ({ data }) => {
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Filter out hours with no activity across all days
  const activeData = data.filter(row => 
    days.some(day => {
      const value = typeof row[day] === 'number' ? row[day] : 0;
      return value > 0;
    })
  );

  // Calculate max value for color scaling
  const maxValue = Math.max(
    ...activeData.flatMap(row => 
      days.map(day => (typeof row[day] === 'number' ? row[day] : 0) as number)
    )
  );

  const getColor = (value: number) => {
    if (value === 0) return 'transparent';
    
    const intensity = value / maxValue;
    
    if (intensity > 0.8) return 'rgba(248, 113, 113, 0.85)';
    if (intensity > 0.6) return 'rgba(251, 146, 60, 0.75)';
    if (intensity > 0.4) return 'rgba(251, 191, 36, 0.65)';
    if (intensity > 0.2) return 'rgba(52, 211, 153, 0.55)';
    return 'rgba(129, 140, 248, 0.45)';
  };

  const handleCellClick = (day: string, hour: string, cost: number) => {
    if (cost === 0) return;
    
    // Simulated detailed data - in production, fetch from API
    const mockDetails: CellDetail = {
      day,
      hour,
      cost,
      sessions: Math.floor(cost / 2.5) + 1,
      topModel: cost > 10 ? 'Claude Sonnet 4.5' : 'claude-haiku-4-5',
      topTask: cost > 15 ? 'Coding' : cost > 8 ? 'Chat' : 'Memory ops'
    };
    setSelectedCell(mockDetails);
  };

  // Find active days (days with any activity)
  const activeDays = days.filter(day =>
    activeData.some(row => {
      const value = typeof row[day] === 'number' ? row[day] : 0;
      return value > 0;
    })
  );

  if (activeData.length === 0) {
    return (
      <div className="heatmap-empty">
        <span>📊</span>
        <p>No activity data for this period</p>
      </div>
    );
  }

  return (
    <div className="cost-heatmap">
      {/* Compact grid */}
      <div className="heatmap-compact">
        <div className="heatmap-grid" style={{ gridTemplateColumns: `48px repeat(${activeDays.length}, 1fr)` }}>
          {/* Header row */}
          <div className="heatmap-corner"></div>
          {activeDays.map(day => (
            <div key={day} className="heatmap-day-header">{day}</div>
          ))}
          
          {/* Data rows */}
          {activeData.map((row, idx) => (
            <React.Fragment key={idx}>
              <div className="heatmap-hour-label">{row.hour}</div>
              {activeDays.map(day => {
                const value = typeof row[day] === 'number' ? row[day] : 0;
                const hasActivity = value > 0;
                return (
                  <div
                    key={day}
                    className={`heatmap-cell ${hasActivity ? 'active' : 'empty'}`}
                    style={{ backgroundColor: getColor(value as number) }}
                    onClick={() => handleCellClick(day, row.hour as string, value as number)}
                  >
                    {hasActivity && <span className="cell-value">${(value as number).toFixed(0)}</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        
        {/* Compact legend */}
        <div className="heatmap-legend-inline">
          <span className="legend-low">Low</span>
          <div className="legend-gradient-bar"></div>
          <span className="legend-high">High</span>
        </div>
      </div>

      {/* Detail popup */}
      {selectedCell && (
        <div className="cell-detail-overlay" onClick={() => setSelectedCell(null)}>
          <div className="cell-detail-popup" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <span className="detail-time">{selectedCell.day} {selectedCell.hour}</span>
              <button className="detail-close" onClick={() => setSelectedCell(null)}>×</button>
            </div>
            <div className="detail-body">
              <div className="detail-row main">
                <span className="detail-label">Cost</span>
                <span className="detail-value cost">${selectedCell.cost.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Sessions</span>
                <span className="detail-value">{selectedCell.sessions}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Top Model</span>
                <span className="detail-value model">{selectedCell.topModel}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Primary Task</span>
                <span className="detail-value">{selectedCell.topTask}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostHeatmap;
