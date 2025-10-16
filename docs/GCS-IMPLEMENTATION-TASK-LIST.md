# GCS Security & Retention Implementation Task List

## 📊 **Current Configuration Analysis**

### **Identified GCS Buckets**
- **Production**: `pacdocv2-api-prod` (project: `pacdocv2-api-prod`)
- **Staging**: `docstorage-286015` (project: `docstorage-286015`) 
- **Test**: `pacdoc-test` (project: `docstorage-123456`)

### **Current Security Issues**
❌ **No bucket-level security policies configured**  
❌ **No lifecycle management rules**  
❌ **No versioning enabled**  
❌ **No retention policies**  
❌ **No access logging enabled**  
❌ **Hardcoded encryption keys in source code**  
❌ **Exposed service account keys in JSON files**  

---

## 🎯 **Implementation Task List**

### **Phase 1: Immediate Security Hardening (Week 1)**

#### **Task 1.1: Secure Service Account Keys**
**Priority**: 🔴 **CRITICAL**
**Effort**: 2 hours
**Owner**: DevOps Engineer

**Current Issue**: Service account keys exposed in plain text JSON files
```bash
# Current vulnerable files:
- packages/api/src/config/GCS.json
- packages/api/Cloud Functions/document-service/config/GCS.json
- packages/api/Cloud Functions/document-service/config/GCS-Prod.json
```

**Actions**:
1. **Move keys to Google Secret Manager**
   ```bash
   # Create secrets
   gcloud secrets create gcs-service-account-key --data-file=packages/api/src/config/GCS.json
   gcloud secrets create gcs-prod-service-account-key --data-file=packages/api/Cloud Functions/document-service/config/GCS-Prod.json
   ```

2. **Update application code to use Secret Manager**
   ```typescript
   // Update packages/api/Cloud Functions/document-service/service/file.service.ts
   import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
   
   class SecureStorage {
     private secretClient: SecretManagerServiceClient;
     
     async getServiceAccountKey(): Promise<any> {
       const [version] = await this.secretClient.accessSecretVersion({
         name: 'projects/pacdocv2-api-prod/secrets/gcs-service-account-key/versions/latest'
       });
       return JSON.parse(version.payload?.data?.toString() || '{}');
     }
   }
   ```

3. **Remove JSON files from repository**
   ```bash
   git rm packages/api/src/config/GCS.json
   git rm packages/api/Cloud Functions/document-service/config/GCS.json
   git rm packages/api/Cloud Functions/document-service/config/GCS-Prod.json
   ```

#### **Task 1.2: Secure Encryption Keys**
**Priority**: 🔴 **CRITICAL**
**Effort**: 3 hours
**Owner**: Backend Developer

**Current Issue**: CSEK hardcoded in `packages/api/Cloud Functions/document-service/config/jwt.ts`
```typescript
// Current vulnerable code:
export const CSEK = 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA='
```

**Actions**:
1. **Move CSEK to Secret Manager**
   ```bash
   gcloud secrets create csek-encryption-key --data-file=<(echo "THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=")
   ```

2. **Update all file operations to use Secret Manager**
   ```typescript
   // Update packages/api/Cloud Functions/document-service/service/file.service.ts
   async getCSEK(): Promise<string> {
     const [version] = await this.secretClient.accessSecretVersion({
       name: 'projects/pacdocv2-api-prod/secrets/csek-encryption-key/versions/latest'
     });
     return version.payload?.data?.toString() || '';
   }
   ```

3. **Update all references in codebase**
   - `packages/api/src/service/FileStorageService.js`
   - `packages/api/Cloud Functions/document-service/service/file.service.ts`

#### **Task 1.3: Enable Bucket Security**
**Priority**: 🟡 **HIGH**
**Effort**: 1 hour
**Owner**: DevOps Engineer

**Actions**:
```bash
# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://pacdocv2-api-prod
gsutil uniformbucketlevelaccess set on gs://docstorage-286015
gsutil uniformbucketlevelaccess set on gs://pacdoc-test

# Disable public access
gsutil iam ch -d allUsers:objectViewer gs://pacdocv2-api-prod
gsutil iam ch -d allUsers:objectViewer gs://docstorage-286015
gsutil iam ch -d allUsers:objectViewer gs://pacdoc-test

# Enable versioning
gsutil versioning set on gs://pacdocv2-api-prod
gsutil versioning set on gs://docstorage-286015
gsutil versioning set on gs://pacdoc-test
```

#### **Task 1.4: Enable Access Logging**
**Priority**: 🟡 **HIGH**
**Effort**: 1 hour
**Owner**: DevOps Engineer

**Actions**:
```bash
# Create access log buckets
gsutil mb gs://pacdoc-access-logs-prod
gsutil mb gs://pacdoc-access-logs-staging
gsutil mb gs://pacdoc-access-logs-test

# Enable access logging
gsutil logging set on -b gs://pacdoc-access-logs-prod gs://pacdocv2-api-prod
gsutil logging set on -b gs://pacdoc-access-logs-staging gs://docstorage-286015
gsutil logging set on -b gs://pacdoc-access-logs-test gs://pacdoc-test
```

---

### **Phase 2: Retention Policies (Week 2)**

#### **Task 2.1: Create Lifecycle Configuration**
**Priority**: 🟡 **HIGH**
**Effort**: 2 hours
**Owner**: DevOps Engineer

**Actions**:
1. **Create lifecycle configuration file**
   ```bash
   cat > lifecycle-policy.json << EOF
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
             "matchesPrefix": ["borrower/", "client/", "signed/"]
           }
         },
         {
           "action": {
             "type": "Delete"
           },
           "condition": {
             "age": 270,
             "matchesPrefix": ["borrower/", "client/", "signed/"]
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
         }
       ]
     }
   }
   EOF
   ```

2. **Apply lifecycle policies**
   ```bash
   gsutil lifecycle set lifecycle-policy.json gs://pacdocv2-api-prod
   gsutil lifecycle set lifecycle-policy.json gs://docstorage-286015
   gsutil lifecycle set lifecycle-policy.json gs://pacdoc-test
   ```

#### **Task 2.2: Implement Retention Service**
**Priority**: 🟡 **HIGH**
**Effort**: 4 hours
**Owner**: Backend Developer

**Actions**:
1. **Create retention service**
   ```typescript
   // Create packages/api/Cloud Functions/document-service/service/retention.service.ts
   interface RetentionPolicy {
     documentType: string;
     retentionDays: number;
     storageClass: string;
     legalHold: boolean;
   }

   class RetentionService {
     private policies: RetentionPolicy[] = [
       { documentType: 'signed_documents', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
       { documentType: 'customer_documents', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
       { documentType: 'notary_records', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
       { documentType: 'audit_logs', retentionDays: 365, storageClass: 'NEARLINE', legalHold: false },
       { documentType: 'temp_files', retentionDays: 30, storageClass: 'STANDARD', legalHold: false },
       { documentType: 'draft_documents', retentionDays: 90, storageClass: 'STANDARD', legalHold: false }
     ];
     
     async applyRetentionPolicy(filePath: string, documentType: string): Promise<void> {
       const policy = this.policies.find(p => p.documentType === documentType);
       if (!policy) throw new Error(`No retention policy for ${documentType}`);
       
       const bucket = this.storage.bucket('pacdocv2-api-prod');
       const file = bucket.file(filePath);
       
       await file.setMetadata({
         retention: {
           retentionPeriod: policy.retentionDays * 24 * 60 * 60 * 1000,
           mode: policy.legalHold ? 'COMPLIANCE' : 'UNLOCKED'
         },
         storageClass: policy.storageClass
       });
     }
   }
   ```

2. **Integrate with file upload operations**
   ```typescript
   // Update packages/api/Cloud Functions/document-service/service/file.service.ts
   async uploadFile(file: any, options: any): Promise<void> {
     // ... existing upload logic ...
     
     // Apply retention policy
     const retentionService = new RetentionService();
     await retentionService.applyRetentionPolicy(options.destination, 'signed_documents');
   }
   ```

#### **Task 2.3: Audit Existing Files**
**Priority**: 🟢 **MEDIUM**
**Effort**: 3 hours
**Owner**: DevOps Engineer

**Actions**:
1. **Create audit script**
   ```bash
   #!/bin/bash
   # audit-existing-files.sh
   
   echo "Auditing existing files in production bucket..."
   gsutil ls -l gs://pacdocv2-api-prod/** | while read line; do
     echo "File: $line"
     # Check if file has retention policy
     # Apply retention policy if missing
   done
   ```

2. **Apply retention policies to existing files**
   ```bash
   # Run audit script
   chmod +x audit-existing-files.sh
   ./audit-existing-files.sh
   ```

---

### **Phase 3: Monitoring & Compliance (Week 3)**

#### **Task 3.1: Set Up Audit Logging**
**Priority**: 🟡 **HIGH**
**Effort**: 3 hours
**Owner**: DevOps Engineer

**Actions**:
1. **Create BigQuery dataset for audit logs**
   ```bash
   bq mk --dataset pacdocv2-api-prod:audit_logs
   ```

2. **Create audit log sink**
   ```bash
   gcloud logging sinks create pacdoc-audit-sink \
       bigquery.googleapis.com/projects/pacdocv2-api-prod/datasets/audit_logs \
       --log-filter='resource.type="gcs_bucket" AND resource.labels.bucket_name="pacdocv2-api-prod"'
   ```

3. **Create custom audit logging service**
   ```typescript
   // Create packages/api/Cloud Functions/document-service/service/audit.service.ts
   interface DocumentAccessEvent {
     timestamp: Date;
     userId: string;
     userType: 'client' | 'employee' | 'signer';
     action: 'read' | 'write' | 'delete' | 'list';
     filePath: string;
     ipAddress: string;
     userAgent: string;
     success: boolean;
   }

   class DocumentAuditService {
     async logDocumentAccess(event: DocumentAccessEvent): Promise<void> {
       // Log to Cloud Logging
       await this.logToCloudLogging(event);
       
       // Log to BigQuery for analysis
       await this.logToBigQuery(event);
     }
   }
   ```

#### **Task 3.2: Create Compliance Dashboard**
**Priority**: 🟢 **MEDIUM**
**Effort**: 4 hours
**Owner**: DevOps Engineer

**Actions**:
1. **Create BigQuery views for compliance monitoring**
   ```sql
   -- Create view for retention compliance
   CREATE VIEW `pacdocv2-api-prod.audit_logs.retention_compliance` AS
   SELECT 
     DATE(creation_time) as creation_date,
     COUNT(*) as total_files,
     COUNT(CASE WHEN retention_period IS NULL THEN 1 END) as missing_retention,
     COUNT(CASE WHEN storage_class = 'STANDARD' AND DATE_DIFF(CURRENT_DATE(), DATE(creation_time), DAY) > 90 THEN 1 END) as overdue_archive
   FROM `pacdocv2-api-prod.audit_logs.document_metadata`
   GROUP BY DATE(creation_time)
   ORDER BY creation_date DESC;
   ```

2. **Create Cloud Monitoring dashboards**
   ```yaml
   # Create monitoring-dashboard.yaml
   displayName: "GCS Security & Retention Dashboard"
   mosaicLayout:
     tiles:
       - width: 6
         height: 4
         widget:
           title: "Retention Compliance"
           xyChart:
             dataSets:
               - timeSeriesQuery:
                   timeSeriesFilter:
                     filter: 'resource.type="gcs_bucket"'
   ```

#### **Task 3.3: Set Up Security Alerts**
**Priority**: 🟡 **HIGH**
**Effort**: 2 hours
**Owner**: DevOps Engineer

**Actions**:
1. **Create security alert policies**
   ```bash
   # Create alert for unauthorized access
   gcloud alpha monitoring policies create --policy-from-file=security-alerts.yaml
   ```

2. **Configure notification channels**
   ```bash
   # Create email notification channel
   gcloud alpha monitoring channels create \
       --display-name="Security Alerts" \
       --type=email \
       --channel-labels=email_address=security@pacdocsign.com
   ```

---

### **Phase 4: Testing & Validation (Week 4)**

#### **Task 4.1: Test Security Configuration**
**Priority**: 🟡 **HIGH**
**Effort**: 3 hours
**Owner**: QA Engineer

**Actions**:
1. **Test bucket security**
   ```bash
   # Test public access is disabled
   curl -I https://storage.googleapis.com/pacdocv2-api-prod/test-file.pdf
   # Should return 403 Forbidden
   ```

2. **Test encryption**
   ```bash
   # Verify files are encrypted
   gsutil stat gs://pacdocv2-api-prod/test-file.pdf
   # Should show encryption metadata
   ```

3. **Test retention policies**
   ```bash
   # Upload test file and verify retention policy applied
   echo "test" | gsutil cp - gs://pacdocv2-api-prod/test-retention.txt
   gsutil stat gs://pacdocv2-api-prod/test-retention.txt
   # Should show retention metadata
   ```

#### **Task 4.2: Test Lifecycle Policies**
**Priority**: 🟢 **MEDIUM**
**Effort**: 2 hours
**Owner**: QA Engineer

**Actions**:
1. **Create test files with different ages**
   ```bash
   # Create test files
   echo "test" | gsutil cp - gs://pacdocv2-api-prod/test-90-days.txt
   echo "test" | gsutil cp - gs://pacdocv2-api-prod/test-270-days.txt
   ```

2. **Verify lifecycle rules work**
   ```bash
   # Check storage class changes
   gsutil stat gs://pacdocv2-api-prod/test-90-days.txt
   # Should show NEARLINE storage class
   ```

#### **Task 4.3: Validate Audit Logging**
**Priority**: 🟢 **MEDIUM**
**Effort**: 2 hours
**Owner**: QA Engineer

**Actions**:
1. **Test audit logging**
   ```bash
   # Perform file operations and check logs
   gsutil ls gs://pacdocv2-api-prod/
   gsutil cp test-file.txt gs://pacdocv2-api-prod/
   ```

2. **Verify logs in BigQuery**
   ```sql
   SELECT * FROM `pacdocv2-api-prod.audit_logs.document_access`
   WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
   ORDER BY timestamp DESC;
   ```

---

## 📋 **Implementation Checklist**

### **Phase 1: Security Hardening** ✅
- [ ] Move service account keys to Secret Manager
- [ ] Move CSEK to Secret Manager
- [ ] Remove JSON files from repository
- [ ] Enable uniform bucket-level access
- [ ] Disable public access
- [ ] Enable versioning
- [ ] Enable access logging

### **Phase 2: Retention Policies** ✅
- [ ] Create lifecycle configuration
- [ ] Apply lifecycle policies to all buckets
- [ ] Implement retention service
- [ ] Integrate with file operations
- [ ] Audit existing files
- [ ] Apply retention policies to existing files

### **Phase 3: Monitoring & Compliance** ✅
- [ ] Set up BigQuery audit logging
- [ ] Create audit log sink
- [ ] Implement custom audit service
- [ ] Create compliance dashboard
- [ ] Set up security alerts
- [ ] Configure notification channels

### **Phase 4: Testing & Validation** ✅
- [ ] Test bucket security
- [ ] Test encryption
- [ ] Test retention policies
- [ ] Test lifecycle policies
- [ ] Validate audit logging
- [ ] Verify compliance dashboard

---

## ⏱️ **Timeline Summary**

| Phase | Duration | Tasks | Effort |
|-------|----------|-------|---------|
| **Phase 1** | Week 1 | Security Hardening | 7 hours |
| **Phase 2** | Week 2 | Retention Policies | 9 hours |
| **Phase 3** | Week 3 | Monitoring & Compliance | 9 hours |
| **Phase 4** | Week 4 | Testing & Validation | 7 hours |
| **Total** | **4 weeks** | **16 tasks** | **32 hours** |

---

## 👥 **Resource Requirements**

### **Team Members**
- **DevOps Engineer**: 20 hours (security, monitoring, infrastructure)
- **Backend Developer**: 8 hours (code changes, retention service)
- **QA Engineer**: 4 hours (testing, validation)

### **Tools & Services**
- **Google Cloud Secret Manager**: $0.06/secret/month
- **BigQuery**: $5.00/TB queried
- **Cloud Monitoring**: $0.258/metric/month
- **Total Monthly Cost**: ~$50-100

---

## 🎯 **Success Metrics**

### **Security Metrics**
- **0** exposed service account keys
- **0** hardcoded encryption keys
- **100%** of buckets have security policies
- **100%** of access attempts logged

### **Retention Metrics**
- **100%** of files have retention policies
- **0** retention policy violations
- **100%** compliance with 9-month retention
- **< 24 hours** retention policy application time

### **Cost Metrics**
- **30%** reduction in storage costs by month 3
- **$0** compliance violation fines
- **100%** audit readiness
- **< 5 minutes** compliance reporting time

---

**Next Steps**: Start with Phase 1 security hardening, focusing on the critical tasks of securing service account keys and encryption keys.
