#!/bin/bash
# Phase 3.1: Set up audit logging with BigQuery integration

set -e

echo "📊 GCS Audit Logging Setup"
echo "=========================="

PROJECT_PROD="pacdocv2-api-prod"
DATASET_NAME="gcs_audit_logs"
SINK_NAME="gcs-audit-sink"
BUCKET_PROD="pacdocv2-api-prod"

echo ""
echo "📋 Step 1: Creating BigQuery dataset for audit logs"
echo "----------------------------------------------------"

echo "Creating dataset $DATASET_NAME in project $PROJECT_PROD..."
bq mk --dataset \
  --location=US \
  --description="GCS audit logs for compliance and security monitoring" \
  $PROJECT_PROD:$DATASET_NAME || echo "⚠️  Dataset already exists"

echo ""
echo "📋 Step 2: Creating audit log sink"
echo "-----------------------------------"

echo "Creating log sink $SINK_NAME..."
gcloud logging sinks create $SINK_NAME \
  bigquery.googleapis.com/projects/$PROJECT_PROD/datasets/$DATASET_NAME \
  --log-filter='resource.type="gcs_bucket" AND
                (resource.labels.bucket_name="pacdocv2-api-prod" OR
                 resource.labels.bucket_name="docstorage-286015" OR
                 resource.labels.bucket_name="pacdoc-test") AND
                (protoPayload.methodName=~"storage.objects.*")' \
  --project=$PROJECT_PROD \
  || echo "⚠️  Sink already exists, updating filter..."

# Update existing sink
gcloud logging sinks update $SINK_NAME \
  --log-filter='resource.type="gcs_bucket" AND
                (resource.labels.bucket_name="pacdocv2-api-prod" OR
                 resource.labels.bucket_name="docstorage-286015" OR
                 resource.labels.bucket_name="pacdoc-test") AND
                (protoPayload.methodName=~"storage.objects.*")' \
  --project=$PROJECT_PROD \
  || echo "✅ Sink created successfully"

echo ""
echo "📋 Step 3: Setting up BigQuery tables for analysis"
echo "---------------------------------------------------"

# Create document access tracking table
cat > /tmp/document_access_schema.json << 'EOF'
[
  {"name": "timestamp", "type": "TIMESTAMP", "mode": "REQUIRED"},
  {"name": "user_id", "type": "STRING", "mode": "NULLABLE"},
  {"name": "user_type", "type": "STRING", "mode": "NULLABLE"},
  {"name": "action", "type": "STRING", "mode": "REQUIRED"},
  {"name": "file_path", "type": "STRING", "mode": "REQUIRED"},
  {"name": "ip_address", "type": "STRING", "mode": "NULLABLE"},
  {"name": "user_agent", "type": "STRING", "mode": "NULLABLE"},
  {"name": "success", "type": "BOOLEAN", "mode": "REQUIRED"},
  {"name": "order_id", "type": "INTEGER", "mode": "NULLABLE"},
  {"name": "file_size", "type": "INTEGER", "mode": "NULLABLE"}
]
EOF

echo "Creating document_access table..."
bq mk --table \
  --schema /tmp/document_access_schema.json \
  --time_partitioning_field timestamp \
  --time_partitioning_type DAY \
  --description "Document access audit trail" \
  $PROJECT_PROD:$DATASET_NAME.document_access || echo "⚠️  Table already exists"

# Create retention compliance view
echo "Creating retention_compliance view..."
bq mk --view \
  "SELECT
    DATE(timestamp) as date,
    COUNT(*) as total_operations,
    COUNTIF(action = 'read') as read_operations,
    COUNTIF(action = 'write') as write_operations,
    COUNTIF(action = 'delete') as delete_operations,
    COUNTIF(success = true) as successful_operations,
    COUNTIF(success = false) as failed_operations,
    COUNT(DISTINCT user_id) as unique_users
  FROM \`$PROJECT_PROD.$DATASET_NAME.document_access\`
  WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  GROUP BY date
  ORDER BY date DESC" \
  $PROJECT_PROD:$DATASET_NAME.retention_compliance || echo "⚠️  View already exists"

echo ""
echo "📋 Step 4: Granting BigQuery permissions"
echo "-----------------------------------------"

# Get the service account from the sink
SINK_SA=$(gcloud logging sinks describe $SINK_NAME --project=$PROJECT_PROD --format="value(writerIdentity)")

echo "Granting BigQuery permissions to $SINK_SA..."
gcloud projects add-iam-policy-binding $PROJECT_PROD \
  --member="$SINK_SA" \
  --role="roles/bigquery.dataEditor" \
  || echo "⚠️  Permissions already granted"

echo ""
echo "✅ Audit logging setup complete!"
echo ""
echo "📝 Summary:"
echo "  • BigQuery dataset: $PROJECT_PROD:$DATASET_NAME"
echo "  • Log sink: $SINK_NAME"
echo "  • Table: document_access (partitioned by day)"
echo "  • View: retention_compliance (30-day analysis)"
echo ""
echo "📝 Next Steps:"
echo "  1. Implement audit service in TypeScript"
echo "  2. Create compliance dashboard (05-create-dashboard.sh)"
echo "  3. Set up security alerts (06-setup-alerts.sh)"
echo ""
