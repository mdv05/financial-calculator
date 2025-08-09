# Deployment Guide

This guide explains how to deploy the Financial Calculator to Google Cloud Platform using GitHub Actions.

## Prerequisites

1. **GitHub Account**: Create one at https://github.com
2. **Google Cloud Account**: Sign up at https://cloud.google.com
3. **GCP Project**: Create a new project in GCP Console

## Setup Instructions

### 1. Create GitHub Repository

First, authenticate GitHub CLI:
```bash
gh auth login
```

Then create and push to repository:
```bash
# Create repository
gh repo create mdv05/financial-calculator --public --source=. --remote=origin \
  --description="Financial Projection Calculator for retirement planning"

# Or manually add remote if repo already exists
git remote add origin https://github.com/mdv05/financial-calculator.git

# Push to GitHub
git push -u origin main
```

### 2. Configure Google Cloud Platform

#### Enable Required APIs
```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

#### Create App Engine Application
```bash
# Create App Engine app (choose region)
gcloud app create --region=us-central
```

#### Create Service Account for GitHub Actions
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/appengine.appAdmin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Create and download service account key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Display the key (you'll need this for GitHub secrets)
cat key.json | base64
```

### 3. Configure GitHub Secrets

Go to your GitHub repository settings:
1. Navigate to Settings → Secrets and variables → Actions
2. Add the following secrets:

- **GCP_PROJECT_ID**: Your Google Cloud project ID
- **GCP_SA_KEY**: The base64-encoded service account key (entire output from `cat key.json | base64`)

### 4. Deploy Application

The application will automatically deploy when you push to the main branch.

#### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to App Engine
gcloud app deploy

# View your application
gcloud app browse
```

#### Automatic Deployment
Simply push to the main branch:
```bash
git add .
git commit -m "Deploy to GCP"
git push origin main
```

## GitHub Actions Workflow

The workflow performs the following steps:

1. **Test**: Runs tests and linting on every push
2. **Build**: Creates production build
3. **Deploy**: 
   - Main branch: Deploys to production
   - Pull requests: Creates preview deployments

### Workflow Features
- Automatic testing before deployment
- Preview deployments for pull requests
- Automatic cleanup of old versions
- Caching for faster builds

## Application URLs

- **Production**: `https://[PROJECT_ID].appspot.com`
- **Preview (PR)**: `https://pr-[PR_NUMBER]-dot-[PROJECT_ID].appspot.com`

## Monitoring

### View Logs
```bash
# Stream application logs
gcloud app logs tail -s default

# View specific version logs
gcloud app logs read --version=[VERSION]
```

### Check Application Status
```bash
# View app details
gcloud app describe

# List versions
gcloud app versions list

# View traffic allocation
gcloud app services list
```

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node version matches (20.x)
2. **Deploy fails**: Verify service account permissions
3. **App doesn't load**: Check `app.yaml` static file handlers
4. **Tests fail**: Run `npm test` locally first

### Rollback
```bash
# List versions
gcloud app versions list

# Rollback to previous version
gcloud app versions migrate [OLD_VERSION]

# Or stop problematic version
gcloud app versions stop [BAD_VERSION]
```

## Cost Optimization

- App Engine F1 instance (free tier eligible)
- Auto-scaling configured for minimal instances
- Old versions automatically cleaned up
- Static files served efficiently

## Security Notes

- Never commit `key.json` or credentials
- Use GitHub secrets for sensitive data
- Enable 2FA on both GitHub and GCP
- Regularly rotate service account keys
- Review IAM permissions periodically

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review GCP App Engine logs
3. Open an issue on GitHub