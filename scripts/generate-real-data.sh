#!/bin/bash
# Generate REAL data from OpenClaw for Mission Control dashboard
# This script must be run BEFORE each deployment

set -e

cd "$(dirname "$0")/.."
PUBLIC_DIR="./public"

echo "📊 Generating real data from OpenClaw..."

# 1. Generate agents.json from openclaw.json config
echo "  → agents.json (from openclaw.json)"
cat > "$PUBLIC_DIR/agents.json" << 'AGENTS_EOF'
AGENTS_EOF

# Read from openclaw.json and generate
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json', 'utf8'));

const agentDescriptions = {
  'pm-orchestrator': 'Project management and agent coordination. Spawns sub-agents for complex tasks.',
  'designer': 'UX/UI design specs, wireframes, accessibility audits, and visual testing.',
  'coder': 'Implementation, bug fixes, and feature development.',
  'test-case-writer': 'Generates Playwright test cases from UX specs.',
  'validator': 'Runs tests, validates deployments, and generates reports.',
  'visual-test-agent': 'Percy visual regression testing and screenshot verification.',
  'scholarship-agent': 'Research scholarships for Lena (ASU accounting/finance).',
  'idea-agent': 'Content generation, @swordtruth posts, product intelligence.',
  'candi': 'Restaurant reservation assistant via Bland AI phone calls.'
};

const agentNames = {
  'pm-orchestrator': 'PM Orchestrator',
  'designer': 'Designer (Morpheus)',
  'coder': 'Coder',
  'test-case-writer': 'Test Case Writer',
  'validator': 'Validator',
  'visual-test-agent': 'Visual Test Agent',
  'scholarship-agent': 'Scholarship Agent',
  'idea-agent': 'Idea Agent',
  'candi': 'Candi'
};

const agents = config.agents.list.map(agent => ({
  id: agent.id,
  name: agentNames[agent.id] || agent.id,
  description: agentDescriptions[agent.id] || 'Agent: ' + agent.id,
  model: agent.model,
  type: agent.id === 'pm-orchestrator' ? 'orchestrator' : 'specialist',
  canSpawn: agent.subagents?.allowAgents || undefined
}));

fs.writeFileSync('$PUBLIC_DIR/agents.json', JSON.stringify(agents, null, 2));
console.log('    ✓ Generated ' + agents.length + ' agents');
"

# 2. Generate active-sessions.json from sessions_list
# This would require openclaw CLI or API access
# For now, create a placeholder that notes it needs runtime data
echo "  → active-sessions.json"
cat > "$PUBLIC_DIR/active-sessions.json" << EOF
{
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sessions": [],
  "_note": "Session data is populated at runtime via cron job or API"
}
EOF

echo "✅ Real data generation complete!"
echo ""
echo "Files updated:"
ls -la "$PUBLIC_DIR"/*.json
