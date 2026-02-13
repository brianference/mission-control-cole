import React from 'react';
import './CostHeatmap.css';

interface CostHeatmapProps {
  data: Array<{
    hour: string;
    [day: string]: number | string;
  }>;
}

const CostHeatmap: React.FC<CostHeatmapProps> = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate max value for color scaling
  const maxValue = Math.max(
    ...data.flatMap(row => 
      days.map(day => (typeof row[day] === 'number' ? row[day] : 0) as number)
    )
  );

  const getColor = (value: number) => {
    if (value === 0) return 'rgba(255, 255, 255, 0.02)';
    
    const intensity = value / maxValue;
    
    if (intensity > 0.8) return 'rgba(248, 113, 113, 0.8)'; // High - Red
    if (intensity > 0.6) return 'rgba(251, 146, 60, 0.7)';  // Medium-High - Orange
    if (intensity > 0.4) return 'rgba(251, 191, 36, 0.6)';  // Medium - Yellow
    if (intensity > 0.2) return 'rgba(52, 211, 153, 0.5)';  // Low-Medium - Green
    return 'rgba(129, 140, 248, 0.4)';                      // Low - Indigo
  };

  return (
    <div className="cost-heatmap">
      <div className="heatmap-container">
        <div className="heatmap-header">
          <div className="hour-label"></div>
          {days.map(day => (
            <div key={day} className="day-label">{day}</div>
          ))}
        </div>
        
        <div className="heatmap-body">
          {data.map((row, index) => (
            <div key={index} className="heatmap-row">
              <div className="hour-label">{row.hour}</div>
              {days.map(day => {
                const value = typeof row[day] === 'number' ? row[day] : 0;
                return (
                  <div
                    key={day}
                    className="heatmap-cell"
                    style={{ backgroundColor: getColor(value as number) }}
                    title={`${day} ${row.hour}: $${(value as number).toFixed(2)}`}
                  >
                    {value > 0 ? `$${(value as number).toFixed(0)}` : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="heatmap-legend">
        <div className="legend-title">Cost Intensity</div>
        <div className="legend-gradient">
          <div className="legend-label">Low</div>
          <div className="legend-bar">
            <div style={{ background: 'linear-gradient(to right, rgba(129, 140, 248, 0.4), rgba(52, 211, 153, 0.5), rgba(251, 191, 36, 0.6), rgba(251, 146, 60, 0.7), rgba(248, 113, 113, 0.8))' }} className="gradient"></div>
          </div>
          <div className="legend-label">High</div>
        </div>
      </div>
    </div>
  );
};

export default CostHeatmap;
