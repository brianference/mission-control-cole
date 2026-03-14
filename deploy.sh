#!/bin/bash
set -e

PROJECT_NAME="mission-control-dashboard"
REPO_NAME="mission-control"
PROD_URL="https://mission-control-dashboard.pages.dev"

echo "🚀 Deploying Mission Control Dashboard to Cloudflare Pages..."

# Generate data files
echo "📊 Generating data files..."
node api/gen-skills.js || echo "Warning: Failed to generate skills.json"
node api/gen-agent-types.js || echo "Warning: Failed to generate agent-types.json"
node api/gen-sessions.js || echo "Warning: Failed to generate active-sessions.json"
node api/gen-crons.js || echo "Warning: Failed to generate crons.json"
node api/gen-logs.js || echo "Warning: Failed to generate logs.json"
node api/gen-docs.js || echo "Warning: Failed to generate docs.json"
node api/gen-usage.js || echo "Warning: Failed to generate usage-data.json"

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

# Push to GitHub (triggers Cloudflare Pages auto-deploy)
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Deployment triggered via git push!"
echo "🔗 Production URL: $PROD_URL"
echo "⏳ Cloudflare Pages will auto-deploy from GitHub in ~30-60 seconds"
echo ""
