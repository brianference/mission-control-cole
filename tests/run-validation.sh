#!/bin/bash
# Validation Test Runner (<10 seconds)
set -e
echo "✓ Running validation tests..."
npm test -- tests/validation
echo "✅ Validation tests passed"
