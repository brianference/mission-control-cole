#!/bin/bash
# Smoke Test Runner (1-2 seconds)
set -e
echo "🔥 Running smoke tests..."
node tests/smoke/basic-checks.cjs
echo "✅ Smoke tests passed"
