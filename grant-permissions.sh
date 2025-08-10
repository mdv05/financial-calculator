#!/bin/bash

# Run this in Google Cloud Shell to grant permissions to the GitHub Actions service account

PROJECT_ID="financial-calc-mdv05"

# The service account email from your GCP_SA_KEY secret
SERVICE_ACCOUNT_EMAIL="github-actions@financial-calc-mdv05.iam.gserviceaccount.com"

echo "Granting permissions to: $SERVICE_ACCOUNT_EMAIL"

# Grant Cloud Run Admin role
echo "Granting Cloud Run Admin role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin"

# Grant Service Account User role
echo "Granting Service Account User role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer role
echo "Granting Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/artifactregistry.writer"

echo "✅ Permissions granted successfully!"
echo ""
echo "Current roles for $SERVICE_ACCOUNT_EMAIL:"
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL"