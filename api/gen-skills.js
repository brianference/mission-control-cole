#!/usr/bin/env node
/**
 * Generate skills.json from workspace skills directory
 * Parses SKILL.md frontmatter and extracts metadata
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = '/root/.openclaw/workspace/skills';
const OUTPUT_FILE = path.join(__dirname, '..', 'skills.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const frontmatter = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Try to parse JSON values
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    
    frontmatter[key] = value;
  }
  
  return frontmatter;
}

function extractDescription(content) {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Get first paragraph after the title
  const lines = withoutFrontmatter.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      return line.substring(0, 200); // Truncate to 200 chars
    }
  }
  
  return '';
}

function scanSkills() {
  const skills = [];
  
  try {
    const skillDirs = fs.readdirSync(SKILLS_DIR);
    
    for (const skillDir of skillDirs) {
      const skillPath = path.join(SKILLS_DIR, skillDir);
      const stat = fs.statSync(skillPath);
      
      if (!stat.isDirectory()) continue;
      
      const skillMdPath = path.join(skillPath, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) continue;
      
      try {
        const content = fs.readFileSync(skillMdPath, 'utf8');
        const frontmatter = parseFrontmatter(content);
        const description = extractDescription(content);
        
        // Extract emoji from metadata if available
        let emoji = '📦';
        if (frontmatter.metadata && typeof frontmatter.metadata === 'object') {
          if (frontmatter.metadata.clawdbot && frontmatter.metadata.clawdbot.emoji) {
            emoji = frontmatter.metadata.clawdbot.emoji;
          }
        }
        
        skills.push({
          id: skillDir,
          name: frontmatter.name || skillDir,
          description: frontmatter.description || description || 'No description available',
          emoji: emoji,
          path: skillPath,
          homepage: frontmatter.homepage || null,
          metadata: frontmatter.metadata || {}
        });
      } catch (err) {
        console.warn(`Failed to parse ${skillDir}/SKILL.md:`, err.message);
      }
    }
  } catch (err) {
    console.error('Failed to scan skills directory:', err.message);
    return [];
  }
  
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function main() {
  console.log('Scanning skills directory:', SKILLS_DIR);
  const skills = scanSkills();
  console.log(`Found ${skills.length} skills`);
  
  const output = {
    generated: new Date().toISOString(),
    count: skills.length,
    skills: skills
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log('Generated:', OUTPUT_FILE);
}

if (require.main === module) {
  main();
}

module.exports = { scanSkills, parseFrontmatter };
