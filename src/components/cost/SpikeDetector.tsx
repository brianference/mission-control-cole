import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import './SpikeDetector.css';

interface SpikeDetectorProps {
  data: Array<{ date: string; cost: number }>;
  threshold?: number;
}

interface DotProps {
  cx: number;
  cy: number;
  payload: {
    isSpike: boolean;
  };
}

const SpikeDetector: React.FC<SpikeDetectorProps> = ({ data, threshold = 2 }) => {
  // Calculate average cost
  const avgCost = data.reduce((sum, d) => sum + d.cost, 0) / data.length;
  const spikeThreshold = avgCost * threshold;

  // Identify spikes
  const spikes = data
    .map((d, index) => ({ ...d, index }))
    .filter(d => d.cost > spikeThreshold)
    .sort((a, b) => b.cost - a.cost);

  // Prepare chart data with spike indicators
  const chartData = data.map(d => ({
    ...d,
    average: avgCost,
    spikeThreshold,
    isSpike: d.cost > spikeThreshold,
  }));

  return (
    <div className="spike-detector">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value.toFixed(0)}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              border: '1px solid rgba(129, 140, 248, 0.3)',
              borderRadius: '8px',
            }}
            formatter={(value: number | string) => `$${Number(value).toFixed(2)}`}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <Legend />
          
          <ReferenceLine
            y={avgCost}
            stroke="#34d399"
            strokeDasharray="5 5"
            label={{ value: 'Average', position: 'right', fill: '#34d399' }}
          />
          
          <ReferenceLine
            y={spikeThreshold}
            stroke="#f87171"
            strokeDasharray="5 5"
            label={{ value: `${threshold}x Spike`, position: 'right', fill: '#f87171' }}
          />
          
          <Line
            type="monotone"
            dataKey="cost"
            stroke="#818cf8"
            strokeWidth={2}
            dot={(props: DotProps) => {
              const { cx, cy, payload } = props;
              if (payload.isSpike) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#f87171"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return <circle cx={cx} cy={cy} r={3} fill="#818cf8" />;
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {spikes.length > 0 && (
        <div className="spike-alerts">
          <h4 className="spike-alerts-title">
            ⚠️ Cost Spikes Detected ({spikes.length})
          </h4>
          <div className="spike-list">
            {spikes.slice(0, 5).map((spike, index) => (
              <div key={index} className="spike-item">
                <div className="spike-date">
                  {new Date(spike.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
                <div className="spike-cost">${spike.cost.toFixed(2)}</div>
                <div className="spike-multiplier">
                  {(spike.cost / avgCost).toFixed(1)}x average
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpikeDetector;
