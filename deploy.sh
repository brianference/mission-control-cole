#!/bin/bash
# MISSION CONTROL DEPLOYMENT - MANDATORY GATE ENFORCEMENT
# NEVER deploy without running full verification workflow

set -e

PROJECT_DIR="/root/.openclaw/workspace/mission-control-cole"
DEPLOYED_URL="https://mission-control-cole.pages.dev"
CF_PROJECT="mission-control-cole"
MANDATORY_GATE="/root/.openclaw/workspace/DEPLOY.sh"

echo ""
echo "🔒 MISSION CONTROL DEPLOYMENT"
echo "=============================="
echo ""
echo "This script enforces Commandment #45:"
echo "NEVER claim 'deployed' without full verification."
echo ""
echo "The mandatory gate will:"
echo "  1. Run tests (block if <85%)"
echo "  2. Deploy to Cloudflare"
echo "  3. Percy visual snapshot"
echo "  4. Screenshots (3 platforms)"
echo "  5. Send proof to Telegram"
echo ""
echo "Continue? (y/n)"
read -p "> " answer

if [ "$answer" != "y" ]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

# Call mandatory gate
bash "$MANDATORY_GATE" "$PROJECT_DIR" "$DEPLOYED_URL" "$CF_PROJECT"

exit $?
