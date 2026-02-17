#!/usr/bin/env python3
"""Generate real skills.json from SKILL.md files, sorted by usage frequency.
   In CI / environments without openclaw installed, exits 0 gracefully."""
import os, json, re, sys, subprocess
from collections import Counter

# CI guard: if openclaw isn't installed, keep the committed skills.json and exit
_SKILLS_DIRS = [
    '/root/.openclaw/workspace/skills',
    '/usr/lib/node_modules/openclaw/skills',
]
if not any(os.path.isdir(d) for d in _SKILLS_DIRS):
    print('gen-skills.py: openclaw not found — skipping skills.json regeneration (CI mode)', file=sys.stderr)
    sys.exit(0)

def get_usage_counts():
    """Parse session logs to count how often each skill's SKILL.md was read."""
    sessions_dir = os.path.expanduser('~/.openclaw/agents/main/sessions')
    if not os.path.isdir(sessions_dir):
        return {}
    counts = Counter()
    for fname in os.listdir(sessions_dir):
        if not fname.endswith('.jsonl'):
            continue
        fpath = os.path.join(sessions_dir, fname)
        try:
            with open(fpath, errors='ignore') as f:
                for line in f:
                    line = line.strip()
                    if 'SKILL.md' not in line:
                        continue
                    matches = re.findall(r'/skills/([^/"]+)/SKILL\.md', line)
                    for m in matches:
                        counts[m] += 1
        except:
            pass
    return dict(counts)

def get_description(skill_path):
    try:
        with open(skill_path) as f:
            content = f.read(6000)
    except:
        return ''

    fm_match = re.match(r'^---\s*\n([\s\S]*?)\n---', content)
    if fm_match:
        fm = fm_match.group(1)
        m = re.search(r"^description:\s*[\"']?(.{10,})", fm, re.MULTILINE)
        if m:
            d = m.group(1).strip().strip("\"'>|").strip()
            if len(d) > 15 and not d.startswith('name:'):
                return d[:300]
        m = re.search(r"^description:\s*[|>][-+]?\s*\n((?:[ \t]+\S[^\n]*\n?)+)", fm, re.MULTILINE)
        if m:
            raw = m.group(1)
            d = re.sub(r'^[ \t]+', '', raw, flags=re.MULTILINE).replace('\n', ' ').strip()
            if len(d) > 15:
                return d[:300]

    body_start = content.find('---', 3) + 3 if fm_match else 0
    for line in content[body_start:].split('\n'):
        line = line.strip()
        if (line and not line.startswith('#') and not line.startswith('|')
                and not line.startswith('```') and not line.startswith('---')
                and not line.startswith('*') and len(line) > 25):
            return line[:300]
    return ''

def get_name(content, fallback):
    fm_match = re.match(r'^---\s*\n([\s\S]*?)\n---', content)
    if fm_match:
        m = re.search(r"^name:\s*[\"']?([^\"'\n]{2,})", fm_match.group(1), re.MULTILINE)
        if m:
            n = m.group(1).strip()
            if n and n != fallback and len(n) > 1:
                return n
    return fallback

def categorize(name):
    n = name.lower()
    if any(x in n for x in ['security', 'audit', 'pentest', 'sentinel', 'zero-trust', 'openclaw-sec', 'hostile', 'safe-diag']):
        return 'security'
    if any(x in n for x in ['deploy', 'cloudflare', 'vercel', 'netlify', 'devops', 'kanban-deploy']):
        return 'deployment'
    if any(x in n for x in ['search', 'places', 'serpapi', 'flight', 'airbnb', 'spots', 'goplaces', 'location']):
        return 'search'
    if any(x in n for x in ['twitter', 'x-', 'bird', 'chirp', 'linkedin', 'tiktok', 'postiz', 'metricool', 'x-api', 'x-browser', 'x-post', 'x-publisher', 'x-auto']):
        return 'social'
    if any(x in n for x in ['agent', 'orchestr', 'coder', 'ralph', 'coding', 'autonomous']):
        return 'agent'
    if any(x in n for x in ['memory', 'supermem', 'smart-memory', 'batch-memory']):
        return 'memory'
    if any(x in n for x in ['phone', 'bland', 'reservation', 'email', 'mail', 'telegram', 'calendar', 'ai-phone']):
        return 'communication'
    if any(x in n for x in ['screenshot', 'percy', 'playwright', 'proof', 'deployment-proof', 'visual']):
        return 'testing'
    if any(x in n for x in ['database', 'postgres', 'supabase']):
        return 'database'
    if any(x in n for x in ['youtube', 'video', 'yt-dlp', 'clips', 'supadata']):
        return 'media'
    if any(x in n for x in ['image', 'design', 'modern', 'clean-blue']):
        return 'design'
    if any(x in n for x in ['weather', 'travel', 'restaurant', 'tripadvisor']):
        return 'lifestyle'
    if any(x in n for x in ['react', 'expo', 'standard', 'vibe', 'implementation', 'file-edit', 'markdown', 'no-bs']):
        return 'development'
    return 'utility'

# Get usage data from session logs
print('Counting skill usage from session logs...', file=sys.stderr)
usage = get_usage_counts()
print(f'Found usage data for {len(usage)} skills', file=sys.stderr)

skills = []
seen_ids = set()

dirs = [
    ('/root/.openclaw/workspace/skills', 'workspace'),
    ('/usr/lib/node_modules/openclaw/skills', 'openclaw'),
]

for base_dir, source in dirs:
    if not os.path.isdir(base_dir):
        continue
    for skill_dir in sorted(os.listdir(base_dir)):
        if skill_dir in seen_ids:
            continue
        skill_md = os.path.join(base_dir, skill_dir, 'SKILL.md')
        if not os.path.isfile(skill_md):
            continue
        try:
            with open(skill_md) as f:
                content = f.read(6000)
        except:
            continue

        desc = get_description(skill_md)
        name = get_name(content, skill_dir)
        stype = categorize(skill_dir)
        use_count = usage.get(skill_dir, 0)

        skills.append({
            'id': skill_dir,
            'name': name,
            'description': desc or f'Skill: {skill_dir}',
            'type': stype,
            'source': source,
            'usageCount': use_count
        })
        seen_ids.add(skill_dir)

# Sort by usageCount descending, then alphabetically
skills.sort(key=lambda s: (-s['usageCount'], s['name'].lower()))

bad = [s for s in skills if not s['description'] or s['description'].startswith('Skill:') or len(s['description']) < 15]
print(f'Total: {len(skills)} | Workspace: {sum(1 for s in skills if s["source"]=="workspace")} | Built-in: {sum(1 for s in skills if s["source"]=="openclaw")}', file=sys.stderr)
print(f'Missing/bad descriptions: {len(bad)}', file=sys.stderr)
if bad:
    for s in bad:
        print(f'  BAD: {s["id"]}: {s["description"]}', file=sys.stderr)

print(f'Top 5 by usage: {[(s["id"], s["usageCount"]) for s in skills[:5]]}', file=sys.stderr)

out_path = os.path.join(os.path.dirname(__file__), '../public/skills.json')
with open(out_path, 'w') as f:
    json.dump(skills, f, indent=2)
print(f'Wrote {len(skills)} skills to {out_path}', file=sys.stderr)
