import React, { useState, useEffect, useRef } from 'react';
import './Tasks.css';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('mission-control-tasks');
    if (savedTasks) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mission-control-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="tasks-page">
      <header className="page-header">
        <div>
          <h1 className="page-title gradient-text">Tasks</h1>
          <p className="page-subtitle">
            Quick notes and reminders
          </p>
        </div>
      </header>

      <div className="tasks-container">
        <div className="tasks-card card">
          {/* Add Task Form */}
          <form onSubmit={addTask} className="task-input-form">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a task or reminder..."
              className="task-input"
              autoFocus
            />
            <button type="submit" className="btn-add" disabled={!inputValue.trim()}>
              Add
            </button>
          </form>

          {/* Task Stats */}
          <div className="task-stats">
            <div className="task-stat">
              <span className="task-stat-value">{activeTasks.length}</span>
              <span className="task-stat-label">Active</span>
            </div>
            <div className="task-stat">
              <span className="task-stat-value">{completedTasks.length}</span>
              <span className="task-stat-label">Done</span>
            </div>
            <div className="task-stat">
              <span className="task-stat-value">{tasks.length}</span>
              <span className="task-stat-label">Total</span>
            </div>
          </div>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="task-section">
              <h2 className="task-section-title">To Do</h2>
              <ul className="task-list">
                {activeTasks.map(task => (
                  <li key={task.id} className="task-item">
                    <label className="task-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="task-checkbox"
                      />
                      <span className="task-checkbox-custom"></span>
                    </label>
                    <span className="task-text">{task.text}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="btn-delete"
                      aria-label="Delete task"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="task-section">
              <h2 className="task-section-title">Completed</h2>
              <ul className="task-list">
                {completedTasks.map(task => (
                  <li key={task.id} className="task-item completed">
                    <label className="task-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="task-checkbox"
                      />
                      <span className="task-checkbox-custom"></span>
                    </label>
                    <span className="task-text">{task.text}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="btn-delete"
                      aria-label="Delete task"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <p className="empty-state-title">No tasks yet</p>
              <p className="empty-state-description">
                Add your first task or reminder above
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;
