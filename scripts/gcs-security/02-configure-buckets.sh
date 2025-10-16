#!/bin/bash
# Phase 1.3 & 1.4: Configure GCS bucket security and enable access logging

set -e

echo "🔒 GCS Bucket Security Configuration"
echo "====================================="

# Bucket configuration
BUCKET_PROD="pacdocv2-api-prod"
BUCKET_STAGING="docstorage-286015"
BUCKET_TEST="pacdoc-test"

# Log bucket names
LOG_BUCKET_PROD="pacdoc-access-logs-prod"
LOG_BUCKET_STAGING="pacdoc-access-logs-staging"
LOG_BUCKET_TEST="pacdoc-access-logs-test"

PROJECT_PROD="pacdocv2-api-prod"

echo ""
echo "📋 Step 1: Enable uniform bucket-level access"
echo "----------------------------------------------"

echo "Enabling uniform access for gs://$BUCKET_PROD..."
gsutil uniformbucketlevelaccess set on gs://$BUCKET_PROD || echo "⚠️  Already enabled"

echo "Enabling uniform access for gs://$BUCKET_STAGING..."
gsutil uniformbucketlevelaccess set on gs://$BUCKET_STAGING || echo "⚠️  Already enabled"

echo "Enabling uniform access for gs://$BUCKET_TEST..."
gsutil uniformbucketlevelaccess set on gs://$BUCKET_TEST || echo "⚠️  Already enabled"

echo ""
echo "📋 Step 2: Disable public access"
echo "---------------------------------"

echo "Removing public access from gs://$BUCKET_PROD..."
gsutil iam ch -d allUsers:objectViewer gs://$BUCKET_PROD || echo "⚠️  No public access to remove"
gsutil iam ch -d allAuthenticatedUsers:objectViewer gs://$BUCKET_PROD || echo "⚠️  No authenticated access to remove"

echo "Removing public access from gs://$BUCKET_STAGING..."
gsutil iam ch -d allUsers:objectViewer gs://$BUCKET_STAGING || echo "⚠️  No public access to remove"
gsutil iam ch -d allAuthenticatedUsers:objectViewer gs://$BUCKET_STAGING || echo "⚠️  No authenticated access to remove"

echo "Removing public access from gs://$BUCKET_TEST..."
gsutil iam ch -d allUsers:objectViewer gs://$BUCKET_TEST || echo "⚠️  No public access to remove"
gsutil iam ch -d allAuthenticatedUsers:objectViewer gs://$BUCKET_TEST || echo "⚠️  No authenticated access to remove"

echo ""
echo "📋 Step 3: Enable versioning"
echo "-----------------------------"

echo "Enabling versioning for gs://$BUCKET_PROD..."
gsutil versioning set on gs://$BUCKET_PROD

echo "Enabling versioning for gs://$BUCKET_STAGING..."
gsutil versioning set on gs://$BUCKET_STAGING

echo "Enabling versioning for gs://$BUCKET_TEST..."
gsutil versioning set on gs://$BUCKET_TEST

echo ""
echo "📋 Step 4: Create access log buckets"
echo "-------------------------------------"

echo "Creating log bucket gs://$LOG_BUCKET_PROD..."
gsutil mb -p $PROJECT_PROD -c STANDARD -l us-west2 gs://$LOG_BUCKET_PROD || echo "⚠️  Bucket already exists"

echo "Creating log bucket gs://$LOG_BUCKET_STAGING..."
gsutil mb -p $PROJECT_PROD -c STANDARD -l us-west2 gs://$LOG_BUCKET_STAGING || echo "⚠️  Bucket already exists"

echo "Creating log bucket gs://$LOG_BUCKET_TEST..."
gsutil mb -p $PROJECT_PROD -c STANDARD -l us-west2 gs://$LOG_BUCKET_TEST || echo "⚠️  Bucket already exists"

echo ""
echo "📋 Step 5: Enable access logging"
echo "---------------------------------"

echo "Enabling access logging for gs://$BUCKET_PROD..."
gsutil logging set on -b gs://$LOG_BUCKET_PROD gs://$BUCKET_PROD

echo "Enabling access logging for gs://$BUCKET_STAGING..."
gsutil logging set on -b gs://$LOG_BUCKET_STAGING gs://$BUCKET_STAGING

echo "Enabling access logging for gs://$BUCKET_TEST..."
gsutil logging set on -b gs://$LOG_BUCKET_TEST gs://$BUCKET_TEST

echo ""
echo "📋 Step 6: Verify configuration"
echo "--------------------------------"

echo ""
echo "Production bucket (gs://$BUCKET_PROD):"
gsutil uniformbucketlevelaccess get gs://$BUCKET_PROD | grep "Enabled: True" && echo "  ✅ Uniform access enabled" || echo "  ❌ Uniform access not enabled"
gsutil versioning get gs://$BUCKET_PROD | grep "Enabled" && echo "  ✅ Versioning enabled" || echo "  ❌ Versioning not enabled"
gsutil logging get gs://$BUCKET_PROD | grep "LogBucket" && echo "  ✅ Logging enabled" || echo "  ❌ Logging not enabled"

echo ""
echo "Staging bucket (gs://$BUCKET_STAGING):"
gsutil uniformbucketlevelaccess get gs://$BUCKET_STAGING | grep "Enabled: True" && echo "  ✅ Uniform access enabled" || echo "  ❌ Uniform access not enabled"
gsutil versioning get gs://$BUCKET_STAGING | grep "Enabled" && echo "  ✅ Versioning enabled" || echo "  ❌ Versioning not enabled"
gsutil logging get gs://$BUCKET_STAGING | grep "LogBucket" && echo "  ✅ Logging enabled" || echo "  ❌ Logging not enabled"

echo ""
echo "Test bucket (gs://$BUCKET_TEST):"
gsutil uniformbucketlevelaccess get gs://$BUCKET_TEST | grep "Enabled: True" && echo "  ✅ Uniform access enabled" || echo "  ❌ Uniform access not enabled"
gsutil versioning get gs://$BUCKET_TEST | grep "Enabled" && echo "  ✅ Versioning enabled" || echo "  ❌ Versioning not enabled"
gsutil logging get gs://$BUCKET_TEST | grep "LogBucket" && echo "  ✅ Logging enabled" || echo "  ❌ Logging not enabled"

echo ""
echo "✅ Bucket security configuration complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Run 03-create-lifecycle-policies.sh to set up retention rules"
echo "  2. Run 04-setup-audit-logging.sh to configure audit logs"
echo "  3. Run test scripts to verify security configuration"
echo ""
