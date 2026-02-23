#!/bin/bash
# Auto-update usage data every 5 minutes
# Runs collect-usage-data.js and triggers Cloudflare rebuild

set -e

cd "$(dirname "$0")/.."

echo "🔄 [$(date)] Updating usage data..."

# Run data collection
node scripts/collect-usage-data.js

# Check if data changed
if git diff --quiet public/usage-data.json; then
  echo "✅ No changes detected, skipping deploy"
  exit 0
fi

# Commit changes
git add public/usage-data.json
git commit -m "Auto-update usage data: $(date +'%Y-%m-%d %H:%M:%S')"

# Push to trigger Cloudflare rebuild
git push origin master

echo "✅ [$(date)] Usage data updated and deployed"
