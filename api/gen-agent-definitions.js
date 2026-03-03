#!/usr/bin/env node
/**
 * Generate agent-definitions.json from workspace agents directory
 * Parses agent directories for metadata and configuration
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/root/.openclaw/workspace/agents';
const OUTPUT_FILE = path.join(__dirname, '..', 'agent-definitions.json');

function parseAgentMetadata(agentPath, agentName) {
  const metadata = {
    id: agentName,
    name: agentName,
    description: '',
    emoji: '🤖',
    path: agentPath,
    capabilities: [],
    lastModified: null
  };
  
  // Try to read SOUL.md, README.md, or AGENT.md for description
  const descFiles = ['SOUL.md', 'README.md', 'AGENT.md', 'DESCRIPTION.md'];
  
  for (const descFile of descFiles) {
    const descPath = path.join(agentPath, descFile);
    if (fs.existsSync(descPath)) {
      try {
        const content = fs.readFileSync(descPath, 'utf8');
        // Extract first paragraph as description
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
            metadata.description = trimmed.substring(0, 200);
            break;
          }
        }
        
        // Look for emoji in content
        const emojiMatch = content.match(/emoji:\s*([^\s\n]+)/i);
        if (emojiMatch) {
          metadata.emoji = emojiMatch[1];
        }
        
        break;
      } catch (err) {
        // Ignore read errors
      }
    }
  }
  
  // Get last modified time
  try {
    const stat = fs.statSync(agentPath);
    metadata.lastModified = stat.mtime.toISOString();
  } catch (err) {
    // Ignore
  }
  
  // Extract capabilities from file names
  try {
    const files = fs.readdirSync(agentPath);
    const capabilities = new Set();
    
    for (const file of files) {
      if (file.endsWith('.sh') && file !== 'launch.sh') {
        capabilities.add(file.replace(/\.sh$/, ''));
      }
      if (file.endsWith('.md') && file !== 'README.md') {
        capabilities.add(file.replace(/\.md$/, ''));
      }
    }
    
    metadata.capabilities = Array.from(capabilities);
  } catch (err) {
    // Ignore
  }
  
  return metadata;
}

function scanAgents() {
  const agents = [];
  
  try {
    const agentDirs = fs.readdirSync(AGENTS_DIR);
    
    for (const agentDir of agentDirs) {
      const agentPath = path.join(AGENTS_DIR, agentDir);
      
      try {
        const stat = fs.statSync(agentPath);
        
        // Skip files and archive directory
        if (!stat.isDirectory() || agentDir === 'archive' || agentDir.startsWith('.')) {
          continue;
        }
        
        const metadata = parseAgentMetadata(agentPath, agentDir);
        agents.push(metadata);
        
      } catch (err) {
        console.warn(`Failed to parse agent ${agentDir}:`, err.message);
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
  console.log(`Found ${agents.length} agent definitions`);
  
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

module.exports = { scanAgents, parseAgentMetadata };
