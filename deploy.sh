#!/bin/bash

# Deploy script for Google Cloud Platform
# Usage: ./deploy.sh [project-id]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if project ID is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Project ID required${NC}"
    echo "Usage: ./deploy.sh [project-id]"
    exit 1
fi

PROJECT_ID=$1

echo -e "${YELLOW}Starting deployment to GCP Project: $PROJECT_ID${NC}"

# Set the project
echo "Setting GCP project..."
gcloud config set project $PROJECT_ID

# Check if App Engine is initialized
if ! gcloud app describe &>/dev/null; then
    echo -e "${YELLOW}App Engine not initialized. Please run:${NC}"
    echo "gcloud app create --region=us-central"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run tests
echo "Running tests..."
npm test -- --run

# Build the application
echo "Building application..."
npm run build

# Deploy to App Engine
echo -e "${YELLOW}Deploying to App Engine...${NC}"
gcloud app deploy app.yaml --quiet --promote --stop-previous-version

# Get the URL
URL="https://$PROJECT_ID.appspot.com"

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}Application URL: $URL${NC}"

# Open in browser
read -p "Open in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open $URL || xdg-open $URL || echo "Please open: $URL"
fi

# Clean up old versions (keep only 3)
echo "Cleaning up old versions..."
gcloud app versions list --format="value(version.id)" --sort-by="~version.createTime" | \
    tail -n +4 | xargs -r gcloud app versions delete --quiet 2>/dev/null || true

echo -e "${GREEN}Deployment complete!${NC}"