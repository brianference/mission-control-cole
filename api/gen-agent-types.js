#!/usr/bin/env node
/**
 * Generate agent-types.json from workspace agents directory
 * Parses AGENT.md files and extracts metadata
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/root/.openclaw/workspace/agents';
const OUTPUT_FILE = path.join(__dirname, '..', 'agent-types.json');

function parseAgentMd(content) {
  const metadata = {
    title: '',
    label: '',
    model: '',
    timeout: '',
    status: '',
    purpose: '',
    responsibilities: []
  };
  
  const lines = content.split('\n');
  
  // Extract title (first line starting with #)
  for (const line of lines) {
    if (line.startsWith('#')) {
      metadata.title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }
  
  // Extract key-value pairs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('**Label:**')) {
      metadata.label = line.replace('**Label:**', '').trim();
    } else if (line.startsWith('**Model:**')) {
      metadata.model = line.replace('**Model:**', '').trim();
    } else if (line.startsWith('**Timeout:**')) {
      metadata.timeout = line.replace('**Timeout:**', '').trim();
    } else if (line.startsWith('**Status:**')) {
      metadata.status = line.replace('**Status:**', '').trim();
    } else if (line.startsWith('## Purpose')) {
      // Get the next non-empty lines after "## Purpose"
      const purposeLines = [];
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith('#')) {
          purposeLines.push(nextLine);
        } else if (nextLine.startsWith('#')) {
          break;
        }
      }
      metadata.purpose = purposeLines.join(' ').substring(0, 300);
    }
  }
  
  return metadata;
}

function scanAgents() {
  const agents = [];
  
  try {
    const agentDirs = fs.readdirSync(AGENTS_DIR);
    
    for (const agentDir of agentDirs) {
      const agentPath = path.join(AGENTS_DIR, agentDir);
      const stat = fs.statSync(agentPath);
      
      if (!stat.isDirectory() || agentDir === 'archive') continue;
      
      const agentMdPath = path.join(agentPath, 'AGENT.md');
      if (!fs.existsSync(agentMdPath)) continue;
      
      try {
        const content = fs.readFileSync(agentMdPath, 'utf8');
        const metadata = parseAgentMd(content);
        
        // Emoji mapping
        const emojiMap = {
          'coder': '🔨',
          'designer': '🎨',
          'pm': '📋',
          'test': '🧪',
          'validator': '✅',
          'candi': '🍬',
          'scholarship': '🎓',
          'idea': '💡',
          'visual-test': '👁️'
        };
        
        const emoji = emojiMap[agentDir.split('-')[0]] || '🤖';
        
        agents.push({
          id: agentDir,
          name: metadata.title || agentDir,
          emoji: emoji,
          label: metadata.label,
          model: metadata.model,
          timeout: metadata.timeout,
          status: metadata.status,
          purpose: metadata.purpose,
          path: agentPath
        });
      } catch (err) {
        console.warn(`Failed to parse ${agentDir}/AGENT.md:`, err.message);
      }
    }
  } catch (err) {
    console.error('Failed to scan agents directory:', err.message);
    return [];
  }
  
  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

function main() {
  console.log('Scanning agents directory:', AGENTS_DIR);
  const agents = scanAgents();
  console.log(`Found ${agents.length} agent types`);
  
  const output = {
    generated: new Date().toISOString(),
    count: agents.length,
    agents: agents
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('Generated:', OUTPUT_FILE);
}

if (require.main === module) {
  main();
}

module.exports = { scanAgents, parseAgentMd };
