#!/bin/bash
# Generate ALL real data for Mission Control dashboard
# Must run BEFORE every deployment

set -e
cd "$(dirname "$0")/.."
PUBLIC_DIR="./public"

echo "📊 Generating ALL real data from OpenClaw..."

# 1. Generate agents.json from openclaw.json
echo "  → agents.json"
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
console.log('    ✓ ' + agents.length + ' agents');
"

# 2. Generate skills.json from actual workspace skills
echo "  → skills.json"
node -e "
const fs = require('fs');
const path = require('path');

const skillDirs = [
  '/usr/lib/node_modules/openclaw/skills',
  '/root/.openclaw/workspace/skills'
];

const skills = [];

for (const dir of skillDirs) {
  if (!fs.existsSync(dir)) continue;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const skillPath = path.join(dir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    
    const content = fs.readFileSync(skillPath, 'utf8');
    
    // Parse YAML frontmatter for description
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let description = '';
    
    if (frontmatterMatch) {
      const fm = frontmatterMatch[1];
      // Handle single-line: description: "text" or description: text
      const singleLine = fm.match(/description:\s*['\"]?([^'\"\\n]{10,})/);
      if (singleLine) {
        description = singleLine[1].trim().substring(0, 300);
      } else {
        // Handle multi-line: description: |\n  text\n  text
        const multiLine = fm.match(/description:\s*[|>]-?\s*\n((?:[ \t]+.+\n?)+)/);
        if (multiLine) {
          description = multiLine[1].replace(/^[ \t]+/gm, '').replace(/\n/g, ' ').trim().substring(0, 300);
        }
      }
    }
    
    // Fallback: first substantial paragraph after frontmatter
    if (!description || description.length < 15) {
      const body = frontmatterMatch ? content.slice(content.indexOf('---', 3) + 3) : content;
      const lines = body.split('\\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('|') && !trimmed.startsWith('```') && trimmed.length > 20) {
          description = trimmed.substring(0, 300);
          break;
        }
      }
    }
    
    if (!description) description = 'Skill: ' + entry.name;
    
    // Check for name in frontmatter
    let name = entry.name;
    if (frontmatterMatch) {
      const nameMatch = frontmatterMatch[1].match(/name:\s*['\"]?([^'\"\\n]+)/);
      if (nameMatch && nameMatch[1].trim().length > 1) {
        name = nameMatch[1].trim();
      }
    }
    
    skills.push({
      id: entry.name,
      name: name,
      description: description,
      path: skillPath,
      type: 'skill'
    });
  }
}

// Sort by name
skills.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync('$PUBLIC_DIR/skills.json', JSON.stringify(skills, null, 2));
console.log('    ✓ ' + skills.length + ' skills');
"

# 3. Generate apps.json from real Cloudflare deployments
echo "  → apps.json"
TOKEN=\$(grep -m1 '^NewCloudFlareAccountToken=' /root/.openclaw/secrets/keys.env | cut -d= -f2- | tr -d '\r\n')
ACCOUNT_ID="dd01b432f0329f87bb1cc1a3fad590ee"

node -e "
const https = require('https');

const token = '$TOKEN';
const accountId = '$ACCOUNT_ID';

const options = {
  hostname: 'api.cloudflare.com',
  path: '/client/v4/accounts/' + accountId + '/pages/projects',
  headers: { 'Authorization': 'Bearer ' + token }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if (!response.success) {
      console.error('API error:', response.errors);
      process.exit(1);
    }
    
    const apps = response.result.map(project => ({
      id: project.name,
      name: project.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      url: 'https://' + project.subdomain + '.pages.dev',
      status: project.latest_deployment?.latest_stage?.status === 'success' ? 'online' : 'offline',
      lastDeploy: project.latest_deployment?.created_on || null,
      environment: project.latest_deployment?.environment || 'unknown',
      productionBranch: project.production_branch
    }));
    
    const fs = require('fs');
    fs.writeFileSync('$PUBLIC_DIR/apps.json', JSON.stringify(apps, null, 2));
    console.log('    ✓ ' + apps.length + ' apps');
  });
}).on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});
"

# 4. Generate docs.json from actual workspace files
echo "  → docs.json"
node -e "
const fs = require('fs');
const path = require('path');

const workspaceDir = '/root/.openclaw/workspace';
const docs = [];

// Key files to include
const keyFiles = [
  'AGENTS.md', 'MEMORY.md', 'SOUL.md', 'USER.md', 'COMMANDMENTS.md', 
  'TOOLS.md', 'HEARTBEAT.md', 'IDENTITY.md'
];

for (const file of keyFiles) {
  const filePath = path.join(workspaceDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    docs.push({
      name: file,
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      type: 'config'
    });
  }
}

// Add memory files
const memoryDir = path.join(workspaceDir, 'memory');
if (fs.existsSync(memoryDir)) {
  const memFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md')).slice(-10);
  for (const file of memFiles) {
    const filePath = path.join(memoryDir, file);
    const stats = fs.statSync(filePath);
    docs.push({
      name: file,
      path: filePath,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      type: 'memory'
    });
  }
}

fs.writeFileSync('$PUBLIC_DIR/docs.json', JSON.stringify(docs, null, 2));
console.log('    ✓ ' + docs.length + ' docs');
"

# 5. active-sessions.json placeholder (needs runtime API)
echo "  → active-sessions.json"
cat > "$PUBLIC_DIR/active-sessions.json" << EOF
{
  "lastUpdated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "sessions": [],
  "_note": "Populated at runtime via OpenClaw API"
}
EOF
echo "    ✓ placeholder created"

echo ""
echo "✅ All real data generated!"
