# GCS Security Implementation Scripts

## 🎯 Overview
Comprehensive security implementation for Google Cloud Storage buckets with:
- Secret Manager integration for credentials
- Bucket security configuration
- Lifecycle and retention policies
- Audit logging and compliance monitoring
- Backward compatibility with existing encrypted files

## ⚠️ CRITICAL: Backward Compatibility

**READ THIS FIRST**: `/docs/BACKWARD-COMPATIBILITY-STRATEGY.md`

All existing encrypted files MUST remain accessible. The CSEK encryption key cannot be changed without making all existing files permanently inaccessible.

## 📋 Execution Order

### Phase 1: Security Hardening (Week 1)

#### 1.1 Setup Secrets in Secret Manager
```bash
./01-setup-secrets.sh
```

**What it does:**
- Creates CSEK encryption key secret (using existing key - NO CHANGE)
- Provides instructions for uploading service account keys
- Sets IAM permissions for Cloud Functions

**Manual steps required:**
```bash
# Upload service account keys (after running script)
gcloud secrets create gcs-prod-service-account-key \
  --data-file="packages/api/Cloud Functions/document-service/config/GCS-Prod.json"

gcloud secrets create gcs-service-account-key \
  --data-file="packages/api/src/config/GCS.json"
```

**Testing:**
```bash
cd test/security
npm test -- test-existing-file-access.ts
```

#### 1.2 Configure Bucket Security
```bash
./02-configure-buckets.sh
```

**What it does:**
- Enables uniform bucket-level access
- Disables public access
- Enables versioning (rollback protection)
- Creates and enables access logging

**Duration:** ~5 minutes
**Risk:** Low (all changes are non-breaking)

#### 1.3 Deploy Updated Code
```bash
# Deploy document service with Secret Manager integration
cd "packages/api/Cloud Functions/document-service"
npm run deploy:production
```

**Testing after deployment:**
```bash
# Run comprehensive file access tests
npm run test:existing-file-access

# Monitor logs for errors
gcloud logging read "resource.type=cloud_function AND severity>=ERROR" --limit=50
```

### Phase 2: Retention Policies (Week 2)

#### 2.1 Create Lifecycle Policies
```bash
./03-create-lifecycle-policies.sh
```

**What it does:**
- Creates lifecycle configuration JSON
- Applies lifecycle rules to all buckets
- Verifies policy application

**Impact:**
- Files in `borrower/`, `client/`, `signed/`: Move to NEARLINE after 90 days, delete after 270 days
- Files in `temp/`, `cache/`, `draft/`: Delete after 30 days
- Files in `audit/`, `logs/`: Move to COLDLINE after 365 days

**Duration:** ~2 minutes
**Risk:** Low (forward-looking rules only)

#### 2.2 Audit Existing Files
```bash
./05-audit-existing-files.sh
```

**What it does:**
- Scans all files in production bucket
- Counts files by prefix/category
- Identifies files older than retention periods
- Generates comprehensive audit report

**Output:** Creates timestamped audit report in `scripts/gcs-security/`

**Review carefully:**
- Files marked for deletion (270+ days old)
- Files that will move to NEARLINE storage
- Files without retention metadata

#### 2.3 Apply Retention Metadata (TypeScript Service)
```typescript
import RetentionService from './service/retention.service';

// Apply retention policy to a file
await RetentionService.applyRetentionPolicy(
  'signed/document-12345.pdf',
  'signed_documents'
);

// Auto-detect and apply based on file path
await RetentionService.applyAutoRetentionPolicy('borrower/id-verification.pdf');

// Find files past retention period
const expiredFiles = await RetentionService.findExpiredFiles('signed/');
```

### Phase 3: Monitoring & Compliance (Week 3)

#### 3.1 Setup Audit Logging
```bash
./04-setup-audit-logging.sh
```

**What it does:**
- Creates BigQuery dataset for audit logs
- Creates log sink for GCS operations
- Sets up `document_access` table (partitioned)
- Creates `retention_compliance` view
- Grants necessary IAM permissions

**Duration:** ~3 minutes
**Cost:** ~$5-10/month for BigQuery storage and queries

#### 3.2 Integrate Audit Service (TypeScript)
```typescript
import AuditService from './service/audit.service';

// Log file upload
await AuditService.logFileUpload(
  userId,
  'client',
  'signed/document.pdf',
  fileSize,
  ipAddress,
  userAgent,
  orderId
);

// Generate compliance report
const report = await AuditService.generateComplianceReport(
  startDate,
  endDate
);

// Detect suspicious activity
const suspicious = await AuditService.detectSuspiciousActivity(5);
```

### Phase 4: Testing & Validation (Week 4)

#### 4.1 Run Security Tests
```bash
# Test existing file access (CRITICAL)
npm run test:existing-file-access

# Test retention service
npm run test:retention-service

# Test audit service
npm run test:audit-service

# Integration tests
npm run test:integration
```

#### 4.2 Validate Configuration
```bash
# Check bucket security
gsutil uniformbucketlevelaccess get gs://pacdocv2-api-prod
gsutil versioning get gs://pacdocv2-api-prod
gsutil logging get gs://pacdocv2-api-prod

# Check lifecycle policies
gsutil lifecycle get gs://pacdocv2-api-prod

# Check Secret Manager secrets
gcloud secrets list --filter="name~gcs"
```

#### 4.3 Monitor Production
```bash
# Monitor error logs
gcloud logging read "severity>=ERROR" --limit=100 --format=json

# Check Secret Manager access
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret" --limit=50

# Monitor file operations
gcloud logging read "resource.type=gcs_bucket" --limit=50
```

## 🔄 Integration with File Service

### Update File Upload
```typescript
import RetentionService from './service/retention.service';
import AuditService from './service/audit.service';

async function uploadFile(req: Request, res: Response) {
  try {
    // Existing upload logic...
    const filePath = await fileService.uploadFile(file, options);

    // Apply retention policy
    await RetentionService.applyAutoRetentionPolicy(filePath);

    // Log the upload
    await AuditService.logFileUpload(
      req.user.id,
      req.user.type,
      filePath,
      file.size,
      req.ip,
      req.get('user-agent'),
      req.body.orderId
    );

    res.json({ success: true, filePath });
  } catch (error) {
    // Log failed upload
    await AuditService.logFailedAccess(
      req.user.id,
      req.user.type,
      'write',
      filePath,
      req.ip,
      req.get('user-agent'),
      error.message
    );

    res.status(500).json({ error: 'Upload failed' });
  }
}
```

### Update File Download
```typescript
async function downloadFile(req: Request, res: Response) {
  try {
    const filePath = req.params.filePath;

    // Existing download logic...
    const fileData = await fileService.downloadFile(filePath);

    // Log the download
    await AuditService.logFileDownload(
      req.user.id,
      req.user.type,
      filePath,
      req.ip,
      req.get('user-agent'),
      req.body.orderId
    );

    res.send(fileData);
  } catch (error) {
    // Log failed access
    await AuditService.logFailedAccess(
      req.user.id,
      req.user.type,
      'read',
      filePath,
      req.ip,
      req.get('user-agent'),
      error.message
    );

    res.status(403).json({ error: 'Access denied' });
  }
}
```

## 📊 Monitoring & Reporting

### Query Audit Logs
```sql
-- Recent file operations
SELECT
  timestamp,
  user_id,
  action,
  file_path,
  success
FROM `pacdocv2-api-prod.gcs_audit_logs.document_access`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
ORDER BY timestamp DESC
LIMIT 100;

-- Failed access attempts
SELECT
  user_id,
  ip_address,
  COUNT(*) as failed_count,
  ARRAY_AGG(DISTINCT file_path LIMIT 10) as attempted_files
FROM `pacdocv2-api-prod.gcs_audit_logs.document_access`
WHERE success = false
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY user_id, ip_address
HAVING COUNT(*) >= 5
ORDER BY failed_count DESC;

-- Compliance summary (last 30 days)
SELECT * FROM `pacdocv2-api-prod.gcs_audit_logs.retention_compliance`
ORDER BY date DESC
LIMIT 30;
```

### Generate Reports
```typescript
// Weekly compliance report
const report = await AuditService.generateComplianceReport(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
);

console.log(`Total operations: ${report.totalOperations}`);
console.log(`Success rate: ${(report.successfulOperations / report.totalOperations * 100).toFixed(2)}%`);

// Most accessed files
const topFiles = await AuditService.getMostAccessedFiles(10, 30);
topFiles.forEach(file => {
  console.log(`${file.file_path}: ${file.access_count} accesses`);
});

// Suspicious activity
const suspicious = await AuditService.detectSuspiciousActivity(5);
if (suspicious.length > 0) {
  console.warn(`⚠️ ${suspicious.length} users with suspicious activity`);
}
```

## 🚨 Rollback Procedures

### Quick Rollback (If Issues Occur)
```bash
# Code has built-in fallback to file-based auth
# No action needed - fallback activates automatically

# Monitor logs
gcloud logging tail "resource.type=cloud_function" --filter="severity>=ERROR"
```

### Full Rollback
```bash
# 1. Restore JSON files from backup
cp ~/backups/GCS-Prod.json "packages/api/Cloud Functions/document-service/config/"
cp ~/backups/GCS.json "packages/api/src/config/"

# 2. Commit and deploy
git add "packages/api/Cloud Functions/document-service/config/GCS-Prod.json"
git add "packages/api/src/config/GCS.json"
git commit -m "chore: Rollback to file-based GCS authentication"
git push

# 3. Deploy immediately
npm run deploy:production

# 4. Verify access restored
npm run test:existing-file-access
```

## ✅ Success Criteria

### Pre-Deployment
- [ ] All tests pass: `npm run test:existing-file-access`
- [ ] Secrets created in Secret Manager
- [ ] Fallback logic tested
- [ ] Staging environment validated

### Post-Deployment (First 24 Hours)
- [ ] Zero increase in error rates
- [ ] All file operations working normally
- [ ] Audit logs showing successful operations
- [ ] No user-reported access issues

### 7-Day Validation
- [ ] Performance metrics normal
- [ ] Storage costs optimized
- [ ] Compliance reports generated successfully
- [ ] Retention policies working as expected

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Files cannot be accessed after deployment
```bash
# Check fallback is working
gcloud logging read "resource.type=cloud_function" --limit=50 | grep "fallback"

# Verify Secret Manager permissions
gcloud secrets get-iam-policy csek-encryption-key
```

**Issue:** CSEK decryption fails
```bash
# Verify CSEK matches original
gcloud secrets versions access latest --secret="csek-encryption-key"
# Should output: THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=
```

**Issue:** Lifecycle policy deleting files unexpectedly
```bash
# Check lifecycle configuration
gsutil lifecycle get gs://pacdocv2-api-prod

# Temporarily disable lifecycle
gsutil lifecycle set /dev/null gs://pacdocv2-api-prod
```

## 📚 Additional Resources

- [Backward Compatibility Strategy](../../docs/BACKWARD-COMPATIBILITY-STRATEGY.md)
- [GCS Security & Retention Guide](../../docs/GCS-SECURITY-RETENTION-GLBA.md)
- [Implementation Task List](../../docs/GCS-IMPLEMENTATION-TASK-LIST.md)
- [Test Suite](../../test/security/test-existing-file-access.ts)

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
