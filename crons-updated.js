// Updated JavaScript for Cron Control Panel - REAL DATA VERSION

// State
let cronJobs = [];
let cronStats = {};
let currentFilter = 'all';

// Initialize
function init() {
  loadCronJobs();
}

// Load cron jobs from real OpenClaw data
async function loadCronJobs() {
  try {
    const response = await fetch('/crons.json');
    if (!response.ok) {
      throw new Error('Failed to load crons.json');
    }
    
    const data = await response.json();
    cronJobs = data.crons || [];
    cronStats = data.stats || {};
    
    renderCrons();
    updateStats();
  } catch (error) {
    console.error('Failed to load cron jobs:', error);
    document.getElementById('crons-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">❌</div>
        <div class="empty-text">Failed to load cron jobs</div>
        <div class="empty-subtext">Please refresh the page or check logs</div>
      </div>
    `;
  }
}

// Actions with API calls
async function toggleCron(id) {
  const cron = cronJobs.find(c => c.id === id);
  if (!cron) return;
  
  const newState = !cron.enabled;
  
  try {
    // Optimistic update
    cron.enabled = newState;
    renderCrons();
    updateStats();
    
    // Call API
    const response = await fetch(`/api/crons-toggle?id=${id}&enable=${newState}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('API call failed');
    }
    
    const result = await response.json();
    console.log('Toggle result:', result);
    
    // Reload data to get latest state
    setTimeout(() => loadCronJobs(), 1000);
    
  } catch (error) {
    console.error('Failed to toggle cron:', error);
    // Revert optimistic update
    cron.enabled = !newState;
    renderCrons();
    updateStats();
    alert(`Failed to ${newState ? 'enable' : 'disable'} cron: ${error.message}`);
  }
}

async function runNow(id) {
  const cron = cronJobs.find(c => c.id === id);
  if (!cron) return;
  
  if (!confirm(`Run "${cron.name}" now?\n\nThis will execute immediately.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/crons-run?id=${id}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('API call failed');
    }
    
    const result = await response.json();
    console.log('Run result:', result);
    
    alert(`✅ Cron "${cron.name}" triggered successfully!\n\nCheck logs for execution details.`);
    
    // Reload data to show updated stats
    setTimeout(() => loadCronJobs(), 2000);
    
  } catch (error) {
    console.error('Failed to run cron:', error);
    alert(`Failed to run cron: ${error.message}`);
  }
}

async function deleteCron(id) {
  const cron = cronJobs.find(c => c.id === id);
  if (!cron) return;
  
  if (!confirm(`Delete "${cron.name}"?\n\n⚠️ This action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/crons-delete?id=${id}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('API call failed');
    }
    
    const result = await response.json();
    console.log('Delete result:', result);
    
    // Remove from local state
    cronJobs = cronJobs.filter(c => c.id !== id);
    renderCrons();
    updateStats();
    
    alert(`✅ Cron "${cron.name}" deleted successfully`);
    
  } catch (error) {
    console.error('Failed to delete cron:', error);
    alert(`Failed to delete cron: ${error.message}`);
  }
}

function viewDetails(id) {
  const cron = cronJobs.find(c => c.id === id);
  if (cron) {
    alert(`📋 Cron Details

Name: ${cron.name}
ID: ${cron.id}
Schedule: ${cron.schedule}
Human: ${cron.human_schedule}
Model: ${cron.model}
Cost/run: $${cron.cost_per_run}
Runs today: ${cron.runs_today}
Agent ID: ${cron.agent_id}
Timeout: ${cron.timeout_seconds}s

Prompt:
${cron.prompt}`);
  }
}

function editCron(id) {
  const cron = cronJobs.find(c => c.id === id);
  if (cron) {
    alert(`✏️ Edit Cron

Editing interface coming soon.

For now, use CLI:
openclaw cron update ${id} \\
  --schedule "0 */2 * * *"

Or edit ~/.openclaw/crons.json manually`);
  }
}

// Update stats from loaded data
function updateStats() {
  document.getElementById('stat-active').textContent = cronStats.enabled || 0;
  document.getElementById('stat-total').textContent = cronStats.total || 0;
  document.getElementById('stat-runs').textContent = cronStats.total_runs_today || 0;
  document.getElementById('stat-cost').textContent = `$${(cronStats.total_cost_today || 0).toFixed(2)}`;
  
  // Update projected monthly in subtitle
  const subtitle = document.querySelector('.subtitle');
  if (subtitle && cronStats.projected_monthly_cost) {
    subtitle.textContent = `Projected monthly cost: $${cronStats.projected_monthly_cost.toFixed(2)}`;
  }
}

async function refreshData() {
  const spinner = document.querySelector('.icon-button');
  spinner.style.animation = 'spin 1s linear';
  
  try {
    await loadCronJobs();
  } finally {
    setTimeout(() => {
      spinner.style.animation = '';
    }, 500);
  }
}

// Utility functions
function formatNextRun(timestamp) {
  if (!timestamp) return 'Not scheduled';
  
  const diff = timestamp - Date.now();
  if (diff < 0) return 'Overdue';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `in ${minutes}m`;
  return 'Now';
}

// Note: renderCrons(), getFilteredCrons(), setFilter() remain unchanged
