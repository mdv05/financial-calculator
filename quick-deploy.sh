#!/bin/bash

# Quick deployment helper script
echo "========================================="
echo "Financial Calculator - Quick Deploy Setup"
echo "========================================="
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI not found. Installing..."
    brew install gh
fi

# Try to authenticate
echo "Authenticating with GitHub..."
gh auth login --web

# After authentication, create and push repo
echo "Creating GitHub repository..."
gh repo create mdv05/financial-calculator \
    --public \
    --source=. \
    --remote=origin \
    --description="Financial Projection Calculator for retirement planning" \
    --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""
echo "Repository URL: https://github.com/mdv05/financial-calculator"
echo ""
echo "Next steps for GCP deployment:"
echo "1. Go to: https://console.cloud.google.com"
echo "2. Create a new project"
echo "3. Run: ./setup-github-gcp.sh"
echo ""