#!/bin/bash
# Phase 2.3: Audit existing files and apply retention policies

set -e

echo "📊 Auditing Existing Files and Applying Retention Policies"
echo "==========================================================="

BUCKET_PROD="pacdocv2-api-prod"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="$SCRIPT_DIR/audit-report-$(date +%Y%m%d-%H%M%S).txt"

echo ""
echo "📋 Step 1: Scanning bucket for existing files"
echo "----------------------------------------------"

echo "Scanning gs://$BUCKET_PROD..."
echo "" > "$REPORT_FILE"
echo "GCS Bucket Audit Report" >> "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "Bucket: gs://$BUCKET_PROD" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Count files by prefix
echo "📊 File counts by prefix:" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

prefixes=("borrower/" "client/" "signed/" "customer/" "notary/" "temp/" "cache/" "draft/" "audit/" "logs/")

for prefix in "${prefixes[@]}"; do
  count=$(gsutil ls -r "gs://$BUCKET_PROD/$prefix**" 2>/dev/null | grep -v "/$" | wc -l | tr -d ' ')
  echo "  $prefix: $count files" | tee -a "$REPORT_FILE"
done

# Total file count
total=$(gsutil ls -r "gs://$BUCKET_PROD/**" 2>/dev/null | grep -v "/$" | wc -l | tr -d ' ')
echo "" | tee -a "$REPORT_FILE"
echo "  TOTAL: $total files" | tee -a "$REPORT_FILE"

echo ""
echo "📋 Step 2: Analyzing file ages"
echo "-------------------------------"

echo "" | tee -a "$REPORT_FILE"
echo "File age analysis:" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

# Files older than 270 days (will be deleted by lifecycle policy)
ninety_days_ago=$(date -u -d '90 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-90d +%Y-%m-%dT%H:%M:%SZ)
two_seventy_days_ago=$(date -u -d '270 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v-270d +%Y-%m-%dT%H:%M:%SZ)

echo "  Files that will move to NEARLINE (90+ days old):" | tee -a "$REPORT_FILE"
nearline_count=0
for prefix in "borrower/" "client/" "signed/" "customer/"; do
  count=$(gsutil ls -l "gs://$BUCKET_PROD/$prefix**" 2>/dev/null | \
    awk -v cutoff="$ninety_days_ago" '$2 < cutoff {print}' | wc -l | tr -d ' ')
  nearline_count=$((nearline_count + count))
  echo "    $prefix: ~$count files" | tee -a "$REPORT_FILE"
done
echo "    TOTAL: ~$nearline_count files" | tee -a "$REPORT_FILE"

echo "" | tee -a "$REPORT_FILE"
echo "  Files that will be DELETED (270+ days old):" | tee -a "$REPORT_FILE"
delete_count=0
for prefix in "borrower/" "client/" "signed/" "customer/"; do
  count=$(gsutil ls -l "gs://$BUCKET_PROD/$prefix**" 2>/dev/null | \
    awk -v cutoff="$two_seventy_days_ago" '$2 < cutoff {print}' | wc -l | tr -d ' ')
  delete_count=$((delete_count + count))
  echo "    $prefix: ~$count files" | tee -a "$REPORT_FILE"
done
echo "    TOTAL: ~$delete_count files" | tee -a "$REPORT_FILE"

echo ""
echo "📋 Step 3: Checking for files without retention metadata"
echo "---------------------------------------------------------"

echo "" | tee -a "$REPORT_FILE"
echo "Files without retention metadata:" | tee -a "$REPORT_FILE"

# Sample 100 files to check metadata
sample_files=$(gsutil ls "gs://$BUCKET_PROD/**" 2>/dev/null | grep -v "/$" | head -100)
files_without_retention=0

while IFS= read -r file; do
  if [ -n "$file" ]; then
    metadata=$(gsutil stat "$file" 2>/dev/null | grep "retentionPolicy" || echo "")
    if [ -z "$metadata" ]; then
      ((files_without_retention++))
    fi
  fi
done <<< "$sample_files"

echo "  Sample of 100 files: $files_without_retention without retention metadata" | tee -a "$REPORT_FILE"
echo "  Estimated total: $((files_without_retention * total / 100)) files need retention policies" | tee -a "$REPORT_FILE"

echo ""
echo "📋 Step 4: Generating recommendations"
echo "--------------------------------------"

echo "" | tee -a "$REPORT_FILE"
echo "Recommendations:" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if [ $delete_count -gt 0 ]; then
  echo "  ⚠️  WARNING: ~$delete_count files are older than 270 days" | tee -a "$REPORT_FILE"
  echo "     These will be DELETED by the lifecycle policy" | tee -a "$REPORT_FILE"
  echo "     Review these files before applying lifecycle rules" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
fi

if [ $nearline_count -gt 0 ]; then
  echo "  ℹ️  INFO: ~$nearline_count files will move to NEARLINE storage" | tee -a "$REPORT_FILE"
  echo "     This will reduce storage costs but files remain accessible" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
fi

if [ $files_without_retention -gt 0 ]; then
  echo "  📝 TODO: Apply retention metadata to existing files" | tee -a "$REPORT_FILE"
  echo "     Use the retention service to tag files with proper metadata" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
fi

echo ""
echo "✅ Audit complete!"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""
echo "📝 Next Steps:"
echo "  1. Review the audit report, especially files marked for deletion"
echo "  2. Use the retention service to apply metadata to existing files"
echo "  3. Consider archiving important files older than 270 days to a separate bucket"
echo "  4. Proceed with lifecycle policy application if acceptable"
echo ""
echo "⚠️  IMPORTANT: Files older than 270 days will be automatically deleted"
echo "    Make sure to back up any files you want to keep beyond the retention period"
echo ""
