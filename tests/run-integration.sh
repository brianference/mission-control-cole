#!/bin/bash
# Integration Test Runner (<10 seconds)
set -e
echo "🔗 Running integration tests..."
npm test -- tests/integration
echo "✅ Integration tests passed"
