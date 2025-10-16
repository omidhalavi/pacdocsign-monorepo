#!/bin/bash
# Phase 1.1 & 1.2: Set up secrets in Google Secret Manager
# This script creates secrets for service account keys and CSEK encryption keys

set -e

echo "🔐 GCS Security Setup - Creating Secrets in Secret Manager"
echo "=========================================================="

# Configuration
PROJECT_PROD="pacdocv2-api-prod"
PROJECT_STAGING="docstorage-286015"
PROJECT_TEST="docstorage-123456"

# CSEK Key (from jwt.ts)
CSEK_KEY="THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA="

echo ""
echo "📋 Step 1: Creating CSEK encryption key secret"
echo "------------------------------------------------"

# Create CSEK secret for production
echo "Creating csek-encryption-key in $PROJECT_PROD..."
echo -n "$CSEK_KEY" | gcloud secrets create csek-encryption-key \
  --project="$PROJECT_PROD" \
  --data-file=- \
  --replication-policy="automatic" \
  || echo "⚠️  Secret already exists, updating..."

# Update if exists
echo -n "$CSEK_KEY" | gcloud secrets versions add csek-encryption-key \
  --project="$PROJECT_PROD" \
  --data-file=- \
  || echo "✅ CSEK secret created successfully"

echo ""
echo "📋 Step 2: Setting up service account key secrets"
echo "------------------------------------------------"

# Note: Service account keys need to be manually uploaded
# These commands show how to create the secrets when you have the JSON files

cat << 'EOF'

⚠️  MANUAL STEP REQUIRED:

To complete the service account key migration:

1. Production environment:
   gcloud secrets create gcs-prod-service-account-key \
     --project="pacdocv2-api-prod" \
     --data-file="packages/api/Cloud Functions/document-service/config/GCS-Prod.json" \
     --replication-policy="automatic"

2. Staging/Dev environment:
   gcloud secrets create gcs-service-account-key \
     --project="pacdocv2-api-prod" \
     --data-file="packages/api/src/config/GCS.json" \
     --replication-policy="automatic"

3. After creating secrets, remove JSON files:
   git rm packages/api/src/config/GCS*.json
   git rm "packages/api/Cloud Functions/document-service/config/GCS*.json"

EOF

echo ""
echo "📋 Step 3: Setting IAM permissions for Cloud Functions"
echo "------------------------------------------------"

# Grant Secret Manager access to Cloud Functions service account
SERVICE_ACCOUNT="pacdocv2-api-prod@appspot.gserviceaccount.com"

echo "Granting Secret Manager access to $SERVICE_ACCOUNT..."

gcloud secrets add-iam-policy-binding csek-encryption-key \
  --project="$PROJECT_PROD" \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  || echo "⚠️  IAM policy already set"

echo ""
echo "✅ Secret Manager setup complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Upload service account JSON files as secrets (see above)"
echo "  2. Run 02-configure-buckets.sh to enable bucket security"
echo "  3. Test the Secret Manager integration"
echo ""
