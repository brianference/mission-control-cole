#!/bin/bash

# Mission Control Dashboard - Deployment Script
# Deploys to Cloudflare Pages (mission-control-cole.pages.dev)

set -e

echo "🚀 Mission Control Dashboard - Deployment Script"
echo "=================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist/ directory not found."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
echo "Project: mission-control-cole"
echo "URL: https://mission-control-cole.pages.dev"
echo ""

# Deploy (will prompt for login if not authenticated)
wrangler pages deploy dist --project-name=mission-control-cole

echo ""
echo "✅ Deployment complete!"
echo "🌐 Live at: https://mission-control-cole.pages.dev"
echo ""
