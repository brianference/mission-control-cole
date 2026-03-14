#!/usr/bin/env node
// gen-docs.js - Generate real documentation data for Mission Control
// NO MOCK DATA - Commandment #32
//
// Sources:
// - OpenClaw core docs: /usr/lib/node_modules/openclaw/docs
// - Workspace docs: /root/.openclaw/workspace
// - Skill documentation: /root/.openclaw/workspace/skills

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'docs.json');

// Documentation sources
const SOURCES = [
  {
    name: 'OpenClaw Core',
    path: '/usr/lib/node_modules/openclaw/docs',
    icon: '📚',
    category: 'core'
  },
  {
    name: 'Workspace Documentation',
    path: '/root/.openclaw/workspace',
    patterns: ['*.md', 'README.md', 'AGENTS.md', 'TOOLS.md', 'MEMORY.md'],
    icon: '📝',
    category: 'workspace'
  },
  {
    name: 'Skills Documentation',
    path: '/root/.openclaw/workspace/skills',
    patterns: ['*/SKILL.md', '*/README.md'],
    icon: '🛠️',
    category: 'skills'
  }
];

function readMarkdownFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    // REDACTION: Remove sensitive tokens/keys from documentation content
    // Catches common key patterns (ghp_, sk-, AIza, etc.)
    const SENSITIVE_PATTERNS = [
      /ghp_[a-zA-Z0-9]{36}/g,           // GitHub PAT
      /gho_[a-zA-Z0-9]{36}/g,           // GitHub OAuth
      /sk-[a-zA-Z0-9]{20,}/g,           // OpenAI/Anthropic keys
      /AIza[0-9A-Za-z\\-_]{35}/g,       // Google API Key
      /sm_[a-zA-Z0-9]{32}/g,            // Supermemory API Key
      /xai-[a-zA-Z0-9]{32,}/g,          // xAI API Keys
      /[0-9a-fA-F]{32,}/g               // Generic hex keys (32+ chars)
    ];

    SENSITIVE_PATTERNS.forEach(pattern => {
      content = content.replace(pattern, '[REDACTED]');
    });

    // Extract title from first # heading or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
    
    // Extract description from first paragraph after title
    const descMatch = content.match(/^#\s+.+\n\n(.+?)$/m);
    const description = descMatch ? descMatch[1].substring(0, 200) : '';
    
    return {
      title,
      description,
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      wordCount: content.split(/\s+/).length
    };
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

function findMarkdownFiles(dir, patterns = ['*.md']) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // For skills, look for SKILL.md in subdirectories
        if (dir.includes('/skills')) {
          const skillMd = path.join(fullPath, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            files.push(skillMd);
          }
          const readme = path.join(fullPath, 'README.md');
          if (fs.existsSync(readme)) {
            files.push(readme);
          }
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
  
  return files;
}

function generateDocsData() {
  const docs = [];
  let totalSize = 0;
  
  for (const source of SOURCES) {
    const sourceFiles = findMarkdownFiles(source.path, source.patterns);
    
    for (const file of sourceFiles) {
      const doc = readMarkdownFile(file);
      if (doc) {
        doc.source = source.name;
        doc.icon = source.icon;
        doc.category = source.category;
        docs.push(doc);
        totalSize += doc.size;
      }
    }
  }
  
  // Sort by modified date (newest first)
  docs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  
  const output = {
    generated: new Date().toISOString(),
    totalDocs: docs.length,
    totalSize,
    totalWords: docs.reduce((sum, doc) => sum + doc.wordCount, 0),
    categories: {
      core: docs.filter(d => d.category === 'core').length,
      workspace: docs.filter(d => d.category === 'workspace').length,
      skills: docs.filter(d => d.category === 'skills').length
    },
    docs
  };
  
  return output;
}

// Main execution
try {
  console.log('Generating documentation data...');
  const docsData = generateDocsData();
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(docsData, null, 2));
  
  console.log(`✅ Generated docs.json`);
  console.log(`   Total docs: ${docsData.totalDocs}`);
  console.log(`   Core: ${docsData.categories.core}`);
  console.log(`   Workspace: ${docsData.categories.workspace}`);
  console.log(`   Skills: ${docsData.categories.skills}`);
  console.log(`   Total size: ${(docsData.totalSize / 1024).toFixed(1)}KB`);
  console.log(`   Total words: ${docsData.totalWords.toLocaleString()}`);
  
} catch (error) {
  console.error('Error generating docs data:', error);
  process.exit(1);
}
