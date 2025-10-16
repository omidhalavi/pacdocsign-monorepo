#!/bin/bash
# Phase 2.1: Create and apply lifecycle policies for GCS buckets

set -e

echo "📅 GCS Lifecycle Policy Configuration"
echo "======================================"

# Bucket configuration
BUCKET_PROD="pacdocv2-api.appspot.com"
BUCKET_STAGING="docstorage-286015"
BUCKET_TEST="pacdoc-test"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📋 Step 1: Creating lifecycle policy configuration"
echo "--------------------------------------------------"

cat > "$SCRIPT_DIR/lifecycle-policy.json" << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "NEARLINE"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": ["borrower/"]
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 270,
          "matchesPrefix": ["borrower/"]
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "matchesPrefix": ["temp/", "cache/", "draft/"]
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 365,
          "matchesPrefix": ["audit/", "logs/"]
        }
      }
    ]
  }
}
EOF

echo "✅ Lifecycle policy created at: $SCRIPT_DIR/lifecycle-policy.json"

echo ""
echo "📋 Step 2: Applying lifecycle policy to production bucket"
echo "----------------------------------------------------------"

echo "Applying policy to gs://$BUCKET_PROD..."
gsutil lifecycle set "$SCRIPT_DIR/lifecycle-policy.json" gs://$BUCKET_PROD
echo "✅ Policy applied successfully"

echo ""
echo "📋 Step 3: Applying lifecycle policy to staging bucket"
echo "-------------------------------------------------------"

echo "Applying policy to gs://$BUCKET_STAGING..."
gsutil lifecycle set "$SCRIPT_DIR/lifecycle-policy.json" gs://$BUCKET_STAGING
echo "✅ Policy applied successfully"

echo ""
echo "📋 Step 4: Applying lifecycle policy to test bucket"
echo "----------------------------------------------------"

echo "Applying policy to gs://$BUCKET_TEST..."
gsutil lifecycle set "$SCRIPT_DIR/lifecycle-policy.json" gs://$BUCKET_TEST
echo "✅ Policy applied successfully"

echo ""
echo "📋 Step 5: Verifying lifecycle policies"
echo "----------------------------------------"

echo ""
echo "Production bucket lifecycle policy:"
gsutil lifecycle get gs://$BUCKET_PROD

echo ""
echo "Staging bucket lifecycle policy:"
gsutil lifecycle get gs://$BUCKET_STAGING

echo ""
echo "Test bucket lifecycle policy:"
gsutil lifecycle get gs://$BUCKET_TEST

echo ""
echo "✅ Lifecycle policies configured successfully!"
echo ""
echo "📝 Policy Summary:"
echo "  • Files in borrower/ folder (loan documents):"
echo "    - Move to NEARLINE storage after 90 days"
echo "    - Delete after 270 days (9 months)"
echo "  • Files in signers/ folder (identity documents):"
echo "    - PERMANENT RETENTION (no lifecycle rules)"
echo "  • Files in temp/, cache/, draft/:"
echo "    - Delete after 30 days"
echo "  • Files in audit/, logs/:"
echo "    - Move to COLDLINE storage after 365 days"
echo ""
echo "🔒 Critical: Signer identity documents are PERMANENTLY retained"
echo "   - Driver's licenses, passports, IDs"
echo "   - Insurance policies, bonds, certifications"
echo "   - Located in signers/ folder"
echo ""
echo "📝 Next Steps:"
echo "  1. Implement retention service in TypeScript"
echo "  2. Run 04-setup-audit-logging.sh to configure monitoring"
echo "  3. Audit existing files with 05-audit-existing-files.sh"
echo ""
