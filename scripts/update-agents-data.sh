#!/bin/bash
# Update agents data JSON using real OpenClaw tools
# Run this via cron every 10 seconds for real-time updates

OUTPUT_FILE="/root/.openclaw/workspace/projects/mission-control-dashboard/agents-data.json"
TEMP_FILE="/tmp/agents-data-$$.json"

# Create the agent message that fetches real data
MESSAGE='
Call sessions_list with limit=50 and messageLimit=0.
Call subagents with action=list.
Output the results as a single JSON object with this structure:
{
  "success": true,
  "timestamp": [current timestamp],
  "sessions": [array from sessions_list],
  "subagents": {
    "active": [array from subagents.active],
    "recent": [array from subagents.recent]
  }
}

Only output the JSON. No explanatory text before or after.
'

# Run openclaw agent with JSON output
openclaw agent --local --json --message "$MESSAGE" 2>/dev/null | \
  grep -E '^\{' | \
  tail -1 > "$TEMP_FILE"

# Check if we got valid JSON
if [ -s "$TEMP_FILE" ] && jq empty "$TEMP_FILE" 2>/dev/null; then
  mv "$TEMP_FILE" "$OUTPUT_FILE"
  echo "✅ Updated agents data at $(date)"
else
  echo "❌ Failed to generate valid JSON" >&2
  rm -f "$TEMP_FILE"
  exit 1
fi
