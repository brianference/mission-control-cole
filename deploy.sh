#!/bin/bash
set -e

PROJECT_NAME="mission-control-dashboard"
REPO_NAME="mission-control"

echo "🚀 Deploying Mission Control Dashboard to Cloudflare Pages..."

# Generate data files
echo "📊 Generating data files..."
node api/gen-skills.js || echo "Warning: Failed to generate skills.json"
node api/gen-agent-types.js || echo "Warning: Failed to generate agent-types.json"
node api/gen-sessions.js || echo "Warning: Failed to generate active-sessions.json"
node api/gen-crons.js || echo "Warning: Failed to generate crons.json"

# Check if git repo exists
if [ ! -d ".git" ]; then
  echo "📦 Initializing git repository..."
  git init
  git remote add origin "https://github.com/brianference/${REPO_NAME}.git" 2>/dev/null || true
fi

# Commit changes
echo "💾 Committing changes..."
git add -A
git commit -m "Update Mission Control Dashboard - $(date +'%Y-%m-%d %H:%M')" || echo "No changes to commit"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main --force

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy . \
  --project-name="$PROJECT_NAME" \
  --branch=main \
  --commit-dirty=true

echo "✅ Deployment complete!"
echo "🔗 URL: https://$PROJECT_NAME.pages.dev"
