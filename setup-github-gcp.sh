#!/bin/bash

# Complete setup script for GitHub and GCP deployment
# This script will guide you through the entire process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================
Financial Calculator - GitHub & GCP Setup
===========================================${NC}"

# Step 1: Check GitHub CLI authentication
echo -e "\n${YELLOW}Step 1: Checking GitHub CLI authentication...${NC}"
if gh auth status &>/dev/null; then
    echo -e "${GREEN}✓ GitHub CLI is authenticated${NC}"
    GH_USER=$(gh api user --jq .login)
    echo -e "Logged in as: ${GREEN}$GH_USER${NC}"
else
    echo -e "${RED}✗ GitHub CLI is not authenticated${NC}"
    echo -e "${YELLOW}Please authenticate with GitHub:${NC}"
    gh auth login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Authentication failed. Please try again.${NC}"
        exit 1
    fi
    GH_USER=$(gh api user --jq .login)
    echo -e "${GREEN}✓ Successfully authenticated as $GH_USER${NC}"
fi

# Step 2: Create GitHub repository
echo -e "\n${YELLOW}Step 2: Creating GitHub repository...${NC}"
REPO_NAME="financial-calculator"
REPO_OWNER="mdv05"

# Check if repo already exists
if gh repo view $REPO_OWNER/$REPO_NAME &>/dev/null; then
    echo -e "${YELLOW}Repository $REPO_OWNER/$REPO_NAME already exists${NC}"
    read -p "Do you want to use the existing repository? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Exiting...${NC}"
        exit 1
    fi
    # Add remote if not exists
    if ! git remote get-url origin &>/dev/null; then
        git remote add origin https://github.com/$REPO_OWNER/$REPO_NAME.git
        echo -e "${GREEN}✓ Added remote origin${NC}"
    fi
else
    # Create new repository
    echo -e "Creating repository $REPO_OWNER/$REPO_NAME..."
    gh repo create $REPO_OWNER/$REPO_NAME \
        --public \
        --source=. \
        --remote=origin \
        --description="Financial Projection Calculator for retirement planning with real-time projections" \
        --push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Repository created successfully${NC}"
        echo -e "Repository URL: ${BLUE}https://github.com/$REPO_OWNER/$REPO_NAME${NC}"
    else
        echo -e "${RED}Failed to create repository${NC}"
        echo -e "${YELLOW}Please create it manually at: https://github.com/new${NC}"
        exit 1
    fi
fi

# Step 3: Push code to GitHub
echo -e "\n${YELLOW}Step 3: Pushing code to GitHub...${NC}"
git push -u origin main 2>/dev/null || git push origin main
echo -e "${GREEN}✓ Code pushed to GitHub${NC}"

# Step 4: GCP Setup
echo -e "\n${YELLOW}Step 4: Setting up Google Cloud Platform...${NC}"
echo -e "${BLUE}For GCP deployment, you need to:${NC}"
echo ""
echo "1. Create a GCP Project:"
echo "   - Go to: https://console.cloud.google.com"
echo "   - Create a new project or select existing"
echo "   - Note your PROJECT_ID"
echo ""
echo "2. Enable required APIs:"
echo "   Run these commands with your PROJECT_ID:"
echo ""
echo -e "${GREEN}   export PROJECT_ID=\"your-project-id\"${NC}"
echo -e "${GREEN}   gcloud config set project \$PROJECT_ID${NC}"
echo -e "${GREEN}   gcloud services enable appengine.googleapis.com cloudbuild.googleapis.com${NC}"
echo -e "${GREEN}   gcloud app create --region=us-central${NC}"
echo ""
echo "3. Create service account for GitHub Actions:"
echo -e "${GREEN}   # Create service account${NC}"
echo -e "${GREEN}   gcloud iam service-accounts create github-actions --display-name=\"GitHub Actions\"${NC}"
echo ""
echo -e "${GREEN}   # Grant permissions${NC}"
echo -e "${GREEN}   gcloud projects add-iam-policy-binding \$PROJECT_ID \\
     --member=\"serviceAccount:github-actions@\$PROJECT_ID.iam.gserviceaccount.com\" \\
     --role=\"roles/appengine.appAdmin\"${NC}"
echo ""
echo -e "${GREEN}   gcloud projects add-iam-policy-binding \$PROJECT_ID \\
     --member=\"serviceAccount:github-actions@\$PROJECT_ID.iam.gserviceaccount.com\" \\
     --role=\"roles/storage.admin\"${NC}"
echo ""
echo -e "${GREEN}   # Create and encode key${NC}"
echo -e "${GREEN}   gcloud iam service-accounts keys create key.json \\
     --iam-account=github-actions@\$PROJECT_ID.iam.gserviceaccount.com${NC}"
echo -e "${GREEN}   cat key.json | base64 | pbcopy  # Copies to clipboard on Mac${NC}"
echo -e "${GREEN}   rm key.json  # Delete after copying${NC}"
echo ""

# Step 5: Configure GitHub Secrets
echo -e "${YELLOW}Step 5: Add GitHub Secrets${NC}"
echo ""
echo "Add these secrets at: ${BLUE}https://github.com/$REPO_OWNER/$REPO_NAME/settings/secrets/actions${NC}"
echo ""
echo "1. ${GREEN}GCP_PROJECT_ID${NC}: Your Google Cloud project ID"
echo "2. ${GREEN}GCP_SA_KEY${NC}: The base64-encoded service account key (from clipboard)"
echo ""

# Step 6: Deployment options
echo -e "${YELLOW}Step 6: Deployment Options${NC}"
echo ""
echo "Once secrets are configured, you can:"
echo ""
echo "1. ${GREEN}Automatic deployment:${NC}"
echo "   git push origin main"
echo ""
echo "2. ${GREEN}Manual deployment:${NC}"
echo "   ./deploy.sh \$PROJECT_ID"
echo ""
echo "3. ${GREEN}Manual trigger:${NC}"
echo "   gh workflow run deploy-gcp.yml"
echo ""

# Step 7: Summary
echo -e "${BLUE}===========================================
Setup Complete!
===========================================${NC}"
echo ""
echo -e "${GREEN}✓${NC} GitHub repository: https://github.com/$REPO_OWNER/$REPO_NAME"
echo -e "${GREEN}✓${NC} Code pushed to repository"
echo -e "${GREEN}✓${NC} GitHub Actions workflow configured"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Complete GCP setup (instructions above)"
echo "2. Add GitHub secrets"
echo "3. Push to deploy: git push origin main"
echo ""
echo -e "${BLUE}Your app will be available at:${NC}"
echo "https://[PROJECT_ID].appspot.com"
echo ""

# Optional: Open repository in browser
read -p "Open GitHub repository in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://github.com/$REPO_OWNER/$REPO_NAME" || xdg-open "https://github.com/$REPO_OWNER/$REPO_NAME"
fi

echo -e "${GREEN}Setup script complete!${NC}"