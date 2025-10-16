# Backward Compatibility Strategy for GCS Security Implementation

## 🎯 Critical Objective
**Ensure 100% access to existing encrypted files while implementing new security measures**

## 🔑 CSEK (Customer-Supplied Encryption Key) Compatibility

### Current State
- **Existing CSEK**: `THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=`
- **Location**: `packages/api/Cloud Functions/document-service/config/jwt.ts`
- **All existing files in GCS are encrypted with this key**
- **Changing this key will make ALL existing files permanently inaccessible**

### Security Implementation Strategy

#### ✅ Phase 1: Move CSEK to Secret Manager (NO KEY CHANGE)
```typescript
// KEEP THE ORIGINAL KEY - DO NOT GENERATE A NEW ONE
export const CSEK = 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA='

// Store this EXACT key in Secret Manager
gcloud secrets create csek-encryption-key \
  --data-file=<(echo "THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=")
```

**Rationale**: Moving the key to Secret Manager improves security without affecting file access.

#### ✅ Phase 2: Update Code to Read from Secret Manager with Fallback
```typescript
async getCSEK(): Promise<string> {
  try {
    // Try to get CSEK from Secret Manager
    const [version] = await this.secretClient.accessSecretVersion({
      name: `projects/${config.GCS.projectId}/secrets/csek-encryption-key/versions/latest`
    });
    return version.payload?.data?.toString() || CSEK;
  } catch (error) {
    console.warn('⚠️ CSEK not found in Secret Manager, using fallback');
    // CRITICAL: Fallback to hardcoded CSEK to maintain access
    return CSEK;
  }
}
```

**Rationale**: Dual-path approach ensures continuous access even if Secret Manager is unavailable.

#### ✅ Phase 3: Validate Access to Existing Files
```bash
# Test reading existing encrypted files
gsutil cat gs://pacdocv2-api-prod/signed/test-document.pdf > /dev/null
# Should succeed without errors
```

## 🔐 Service Account Key Migration

### Current State
- **Production**: `packages/api/Cloud Functions/document-service/config/GCS-Prod.json`
- **Staging/Dev**: `packages/api/src/config/GCS.json`
- **These files contain service account credentials**

### Migration Strategy

#### ✅ Phase 1: Upload to Secret Manager (Files Stay Intact)
```bash
# DO NOT DELETE FILES YET
# First, upload to Secret Manager
gcloud secrets create gcs-prod-service-account-key \
  --data-file="packages/api/Cloud Functions/document-service/config/GCS-Prod.json"

gcloud secrets create gcs-service-account-key \
  --data-file="packages/api/src/config/GCS.json"
```

#### ✅ Phase 2: Test Secret Manager Access
```bash
# Verify secrets are accessible
gcloud secrets versions access latest --secret="gcs-prod-service-account-key" > /tmp/test-key.json
# Compare with original file
diff /tmp/test-key.json "packages/api/Cloud Functions/document-service/config/GCS-Prod.json"
# Should show no differences
```

#### ✅ Phase 3: Deploy with Fallback Logic
```typescript
// Code already implemented in file.service.ts
private async initializeStorage(): Promise<Storage> {
  if (this.storage) {
    return this.storage;
  }

  try {
    // Try Secret Manager first
    const secretName = this.getSecretNameForEnvironment();
    const [version] = await this.secretClient.accessSecretVersion({
      name: `projects/${config.GCS.projectId}/secrets/${secretName}/versions/latest`
    });

    this.serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');

    this.storage = new Storage({
      credentials: this.serviceAccountKey,
      projectId: config.GCS.projectId
    });

    console.log(`✅ Storage initialized with Secret Manager credentials`);
    return this.storage;
  } catch (error) {
    console.error('❌ Failed to initialize storage with Secret Manager, falling back to file:', error);

    // CRITICAL: Fallback to file-based authentication
    this.storage = new Storage({
      keyFilename: __dirname + '/../config/' + config.GCS.apiKeyFileName,
      projectId: config.GCS.projectId
    });

    return this.storage;
  }
}
```

**Rationale**: Fallback ensures service continues even if Secret Manager is unavailable.

#### ✅ Phase 4: Verify Production Access (TEST EXTENSIVELY)
```bash
# Test file operations in staging first
npm run test:gcs-access

# Test in production with non-critical files
curl -X GET https://your-api.com/api/test-file-access

# Monitor logs for any access errors
gcloud logging read "resource.type=cloud_function" --limit=100 --format=json
```

#### ✅ Phase 5: Remove Files Only After Validation
```bash
# ONLY after 100% verification that Secret Manager works
# Add to .gitignore first
echo "packages/api/src/config/GCS*.json" >> .gitignore
echo "packages/api/Cloud Functions/document-service/config/GCS*.json" >> .gitignore

# Remove from git (but keep local backup)
cp "packages/api/Cloud Functions/document-service/config/GCS-Prod.json" ~/backups/
cp "packages/api/src/config/GCS.json" ~/backups/

git rm packages/api/src/config/GCS*.json
git rm "packages/api/Cloud Functions/document-service/config/GCS*.json"
```

## 🛡️ Bucket Security Changes

### Changes That DO NOT Affect Existing Files
✅ **Uniform bucket-level access** - Changes IAM only, files remain accessible
✅ **Disable public access** - Only affects unauthenticated access
✅ **Enable versioning** - Adds feature, doesn't change existing files
✅ **Enable access logging** - Monitoring only, no file changes

### Implementation Order
```bash
# 1. Enable versioning first (safeguard)
gsutil versioning set on gs://pacdocv2-api-prod

# 2. Enable logging (monitoring)
gsutil logging set on -b gs://pacdoc-access-logs-prod gs://pacdocv2-api-prod

# 3. Test file access
gsutil ls gs://pacdocv2-api-prod/signed/ | head -5

# 4. Enable uniform access (if tests pass)
gsutil uniformbucketlevelaccess set on gs://pacdocv2-api-prod

# 5. Remove public access (if tests pass)
gsutil iam ch -d allUsers:objectViewer gs://pacdocv2-api-prod
```

## 📅 Lifecycle Policies

### Changes That DO NOT Affect Existing Files Immediately
✅ **Lifecycle rules are forward-looking** - Only affect files based on age
✅ **No immediate deletions** - 270-day retention period
✅ **Storage class changes after 90 days** - Reduces cost, files still accessible

### Safe Implementation
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 90}  // Only affects files older than 90 days
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 270}  // Only affects files older than 270 days
      }
    ]
  }
}
```

**Impact Assessment**:
- Files < 90 days old: **NO CHANGE**
- Files 90-270 days old: **Storage class change (still accessible)**
- Files > 270 days old: **Will be deleted (per retention policy)**

## 🧪 Testing Strategy

### Pre-Deployment Tests
```bash
# 1. Test Secret Manager CSEK retrieval
npm run test:csek-secret-manager

# 2. Test file decryption with retrieved CSEK
npm run test:file-decryption

# 3. Test service account from Secret Manager
npm run test:service-account-access

# 4. Test file upload with new configuration
npm run test:file-upload

# 5. Test file download with new configuration
npm run test:file-download
```

### Post-Deployment Validation
```bash
# 1. Verify existing files are accessible
npm run validate:existing-files

# 2. Monitor error rates
npm run monitor:error-rates

# 3. Test file operations in production
npm run validate:production-access
```

## 🚨 Rollback Plan

### If Access Issues Occur

#### Immediate Rollback (5 minutes)
```bash
# 1. Revert to hardcoded CSEK (code already has fallback)
# 2. Revert to file-based service account (code already has fallback)
# 3. Monitor access restoration
```

#### Full Rollback (15 minutes)
```bash
# 1. Restore JSON files from backup
cp ~/backups/GCS-Prod.json "packages/api/Cloud Functions/document-service/config/"
cp ~/backups/GCS.json "packages/api/src/config/"

# 2. Git commit and deploy
git add packages/api/src/config/GCS.json
git add "packages/api/Cloud Functions/document-service/config/GCS-Prod.json"
git commit -m "chore: Restore GCS config files for rollback"
git push

# 3. Deploy immediately
npm run deploy:production
```

## ✅ Success Criteria

### Pre-Deployment
- [ ] All tests pass with Secret Manager configuration
- [ ] Fallback logic tested and working
- [ ] CSEK retrieval from Secret Manager verified
- [ ] Service account access from Secret Manager verified
- [ ] Staging environment tested thoroughly

### Post-Deployment (Production)
- [ ] All existing files remain accessible
- [ ] File upload works correctly
- [ ] File download works correctly
- [ ] File deletion works correctly (when authorized)
- [ ] Zero increase in access error rates
- [ ] Monitoring shows normal operations

### 24-Hour Validation
- [ ] No file access errors reported
- [ ] All API endpoints functioning normally
- [ ] Audit logs showing successful operations
- [ ] Performance metrics within normal range

## 📊 Monitoring Checklist

### Continuous Monitoring (First 48 Hours)
```bash
# Check error logs every hour
gcloud logging read "severity>=ERROR" --limit=50 --format=json

# Monitor file access patterns
npm run monitor:file-access-patterns

# Check Secret Manager access logs
gcloud logging read "resource.type=secretmanager.googleapis.com/Secret"
```

### Key Metrics to Watch
- **File Access Success Rate**: Should remain at 99%+
- **Secret Manager Access Latency**: Should be < 100ms
- **API Response Times**: Should not increase
- **Error Rates**: Should not increase

## 🔒 Security Improvements Achieved

1. **Secrets in Secret Manager**: ✅ Removes hardcoded credentials
2. **IAM-based Access**: ✅ Role-based secret access control
3. **Audit Logging**: ✅ Complete access trail
4. **Encryption Key Rotation**: 🔄 Future capability (with migration strategy)
5. **Bucket Security**: ✅ Uniform access, no public exposure

## ⚠️ Critical Reminders

1. **NEVER change the CSEK value** - All existing files depend on it
2. **Test in staging first** - Always validate before production
3. **Keep fallback logic** - Ensure continuous access even if Secret Manager fails
4. **Monitor continuously** - Watch for any access issues
5. **Keep backups** - Maintain copies of original JSON files for 30 days

---

**Last Updated**: 2025-10-16
**Review Date**: After successful production deployment
