# Fix Cloud Run Deployment Permissions

The GitHub Actions workflow is failing because the service account doesn't have the necessary permissions to deploy to Cloud Run. 

## Quick Fix

Run these commands in Google Cloud Shell or with appropriate permissions:

```bash
PROJECT_ID="financial-calc-435316"
SERVICE_ACCOUNT_EMAIL="github-actions@financial-calc-435316.iam.gserviceaccount.com"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"
```

## Alternative: Manual Setup in Console

1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=financial-calc-435316)
2. Find the service account: `github-actions@financial-calc-435316.iam.gserviceaccount.com`
3. Click the pencil icon to edit
4. Add these roles:
   - **Cloud Run Admin** - To deploy and manage Cloud Run services
   - **Service Account User** - To act as the Cloud Run service account

## Current Status

✅ Docker image is successfully built and pushed to Artifact Registry  
❌ Cloud Run deployment fails due to missing permissions

Once you grant these permissions, the deployment will work automatically on the next push.