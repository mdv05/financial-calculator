#!/bin/bash

# This script sets up the necessary permissions for the GitHub Actions service account
# Run this script once to grant the required permissions

PROJECT_ID="financial-calc-435316"
SERVICE_ACCOUNT_EMAIL="github-actions@financial-calc-435316.iam.gserviceaccount.com"

echo "Setting up permissions for service account: $SERVICE_ACCOUNT_EMAIL"

# Grant Cloud Run Admin role
echo "Granting Cloud Run Admin role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/run.admin"

# Grant Service Account User role (needed to act as the Cloud Run service account)
echo "Granting Service Account User role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer role
echo "Granting Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/artifactregistry.writer"

# Create Artifact Registry repository if it doesn't exist
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=us-central1 \
    --project=$PROJECT_ID \
    --quiet || echo "Repository already exists"

echo "✅ Service account permissions configured successfully!"
echo ""
echo "Current roles for $SERVICE_ACCOUNT_EMAIL:"
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$SERVICE_ACCOUNT_EMAIL"