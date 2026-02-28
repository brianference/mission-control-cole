export default function TaskTypeBreakdown({ taskTypes }) {
  if (!taskTypes || taskTypes.length === 0) {
    return (
      <div className="glass-card">
        <h2 className="text-xl font-semibold mb-4">Cost by Task Type</h2>
        <p className="text-text-secondary">No task data available</p>
      </div>
    );
  }

  const total = taskTypes.reduce((sum, t) => sum + (t.cost || 0), 0);
  
  const taskIcons = {
    coding: '💻',
    design: '🎨',
    testing: '🧪',
    planning: '📋',
    automation: '⚙️',
    general: '💬'
  };
  
  const taskColors = {
    coding: 'bg-blue-500',
    design: 'bg-purple-500',
    testing: 'bg-green-500',
    planning: 'bg-yellow-500',
    automation: 'bg-orange-500',
    general: 'bg-gray-500'
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-semibold mb-4">Cost by Task Type</h2>
      
      <div className="space-y-3">
        {taskTypes.map(task => {
          const percentage = total > 0 ? (task.cost / total * 100) : 0;
          const icon = taskIcons[task.task_type] || '📄';
          const color = taskColors[task.task_type] || 'bg-gray-500';
          
          return (
            <div key={task.task_type} className="task-item">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="font-medium capitalize">{task.task_type}</h3>
                    <p className="text-xs text-text-secondary">
                      {task.calls.toLocaleString()} calls
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${task.cost.toFixed(2)}</p>
                  <p className="text-xs text-text-secondary">{percentage.toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div 
                  className={`${color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
