# GitHub Repository Setup Instructions

Follow these steps to create and push your repository to GitHub.

## Step 1: Authenticate GitHub CLI

```bash
gh auth login
```

Choose:
- GitHub.com
- HTTPS
- Authenticate with your browser or token

## Step 2: Create Repository

### Option A: Using GitHub CLI (Recommended)
```bash
gh repo create mdv05/financial-calculator \
  --public \
  --source=. \
  --remote=origin \
  --description="Financial Projection Calculator for retirement planning" \
  --push
```

### Option B: Manual Setup
1. Go to https://github.com/new
2. Repository name: `financial-calculator`
3. Owner: `mdv05`
4. Description: "Financial Projection Calculator for retirement planning"
5. Public repository
6. Don't initialize with README (we already have one)
7. Click "Create repository"

Then add the remote and push:
```bash
git remote add origin https://github.com/mdv05/financial-calculator.git
git branch -M main
git push -u origin main
```

## Step 3: Configure Repository Settings

### Add Secrets for GCP Deployment
1. Go to https://github.com/mdv05/financial-calculator/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

#### GCP_PROJECT_ID
- Name: `GCP_PROJECT_ID`
- Value: Your GCP project ID (e.g., `my-finance-calculator`)

#### GCP_SA_KEY
1. First, create a service account key:
```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy" \
  --project=$PROJECT_ID

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/appengine.appAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Get base64 encoded key
cat key.json | base64 | pbcopy  # Copies to clipboard on Mac
# Or display it:
cat key.json | base64
```

2. Add secret:
- Name: `GCP_SA_KEY`
- Value: Paste the base64-encoded key

3. Delete the local key file:
```bash
rm key.json
```

## Step 4: Enable GitHub Actions

GitHub Actions should be enabled by default. The workflow will trigger on:
- Push to main branch
- Pull requests to main branch
- Manual workflow dispatch

## Step 5: Verify Setup

After pushing, check:
1. Actions tab: https://github.com/mdv05/financial-calculator/actions
2. Your workflow should be running
3. Once complete, app will be at: https://[PROJECT_ID].appspot.com

## Quick Commands

```bash
# Check repository status
gh repo view --web

# View recent workflow runs
gh run list

# Watch a workflow run
gh run watch

# View workflow logs
gh run view --log

# Trigger manual deployment
gh workflow run deploy-gcp.yml
```

## Troubleshooting

### Permission Denied
```bash
# Make sure you're logged in
gh auth status

# Re-authenticate if needed
gh auth login
```

### Repository Already Exists
```bash
# Remove old remote
git remote rm origin

# Add new remote
git remote add origin https://github.com/mdv05/financial-calculator.git

# Force push (careful!)
git push -u origin main --force
```

### Workflow Not Running
- Check Actions tab is enabled in repository settings
- Verify secrets are set correctly
- Check workflow syntax with: `gh workflow view`

## Next Steps

1. ✅ Repository created at https://github.com/mdv05/financial-calculator
2. ✅ Code pushed to main branch
3. ✅ GitHub Actions workflow configured
4. ⏳ Add GCP secrets to repository
5. ⏳ Push to trigger deployment
6. 🎉 Application live at https://[PROJECT_ID].appspot.com