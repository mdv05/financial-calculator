# Fix GitHub Actions Permissions - Final Step

## Current Status
✅ GCP_PROJECT_ID secret updated to: `financial-calc-mdv05`  
❌ Service account needs Cloud Run permissions

## Run This Command in Google Cloud Shell

Open [Google Cloud Shell](https://console.cloud.google.com/?cloudshell=true&project=financial-calc-mdv05) and run:

```bash
# Grant all necessary permissions to the GitHub Actions service account
gcloud projects add-iam-policy-binding financial-calc-mdv05 \
    --member="serviceAccount:github-actions@financial-calc-mdv05.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding financial-calc-mdv05 \
    --member="serviceAccount:github-actions@financial-calc-mdv05.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding financial-calc-mdv05 \
    --member="serviceAccount:github-actions@financial-calc-mdv05.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"
```

## Alternative: Run the Script

```bash
# Download and run the permissions script
curl -o grant-permissions.sh https://raw.githubusercontent.com/mdv05/Financial_Calculator/main/grant-permissions.sh
chmod +x grant-permissions.sh
./grant-permissions.sh
```

## After Running the Commands

1. The GitHub Actions workflow will automatically work on the next push
2. Your app will be deployed to: https://financial-calculator-558243288785.us-central1.run.app
3. All future commits will trigger automatic deployments

## Verify Success

Check if permissions were granted:
```bash
gcloud projects get-iam-policy financial-calc-mdv05 \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:github-actions@financial-calc-mdv05.iam.gserviceaccount.com"
```

You should see:
- roles/artifactregistry.writer
- roles/iam.serviceAccountUser  
- roles/run.admin