# Fix GitHub Actions Deployment

## ✅ Manual Deployment Successful!

Your app is now deployed at: https://financial-calculator-558243288785.us-central1.run.app

## 🔧 Fix GitHub Actions Workflow

The GitHub Actions workflow is failing because the `GCP_PROJECT_ID` secret has the wrong value.

### Update the GitHub Secret:

1. Go to your GitHub repository settings
2. Navigate to **Settings > Secrets and variables > Actions**
3. Update the `GCP_PROJECT_ID` secret to: `financial-calc-mdv05`

### Current Issue:
- **Wrong**: `financial-calc-435316` (doesn't exist or no permissions)
- **Correct**: `financial-calc-mdv05` (your actual project)

### Once Fixed:
Your GitHub Actions will automatically deploy on every push to main branch.

## Alternative: Update Workflow to Use Hardcoded Project

If you prefer not to use secrets, you can update `.github/workflows/deploy-cloudrun.yml`:

Replace:
```yaml
env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
```

With:
```yaml
env:
  PROJECT_ID: financial-calc-mdv05
```

## Current Status:
- ✅ App is deployed and running
- ✅ Docker images are being built successfully
- ❌ GitHub Actions fails due to wrong project ID in secret