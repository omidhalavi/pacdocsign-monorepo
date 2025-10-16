# Google Cloud Storage Security & Retention Configuration for GLBA Compliance

## 🎯 **NOTARY SIGNING SERVICE RETENTION POLICY**

### **✅ Your Business Model: Document Signing Contractor**
- **You're NOT**: A bank or financial institution
- **You're**: A notary signing service contractor
- **Your role**: Facilitate document signing, not retain financial records
- **GLBA Requirements**: Limited to customer data protection only

### **✅ Your Proposed Retention Policy is APPROPRIATE**
- **90 days active**: Perfect for operational needs
- **6 months archive**: Reasonable for business continuity  
- **Total**: 9 months is appropriate for a signing service
- **Compliance**: Meets your actual business requirements

### **📋 Actual GLBA Requirements for You**
- **Customer Information Protection**: Yes, protect customer data
- **Security Safeguards**: Yes, implement reasonable security
- **Privacy Notices**: Yes, inform customers about data use
- **Document Retention**: **NOT required** - you're not the custodian

---

## Current GCS Bucket Analysis

### **Identified Buckets**
- **Production**: `pacdocv2-api-prod` (project: `pacdocv2-api-prod`)
- **Staging**: `docstorage-286015` (project: `docstorage-286015`) 
- **Test**: `pacdoc-test` (project: `docstorage-123456`)

### **Current Security Issues**
❌ **No bucket-level security policies configured**  
❌ **No lifecycle management rules**  
❌ **No versioning enabled**  
❌ **No retention policies**  
❌ **No access logging enabled**  

---

## 🔒 Required GCS Security Configuration

### **1. Bucket Security Policies**

#### **IAM Policy for Document Bucket**
```json
{
  "bindings": [
    {
      "role": "roles/storage.objectViewer",
      "members": [
        "serviceAccount:document-service@pacdocv2-api-prod.iam.gserviceaccount.com"
      ]
    },
    {
      "role": "roles/storage.objectCreator",
      "members": [
        "serviceAccount:document-service@pacdocv2-api-prod.iam.gserviceaccount.com"
      ]
    },
    {
      "role": "roles/storage.objectAdmin",
      "members": [
        "serviceAccount:document-service@pacdocv2-api-prod.iam.gserviceaccount.com"
      ]
    }
  ]
}
```

#### **Bucket-Level Access Control**
```bash
# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://pacdoc-documents-prod

# Set bucket policy
gsutil iam set bucket-policy.json gs://pacdoc-documents-prod
```

### **2. Encryption Configuration**

#### **Customer-Managed Encryption Keys (CMEK)**
```bash
# Create KMS key ring
gcloud kms keyrings create pacdoc-keyring \
    --location=us-central1

# Create encryption key
gcloud kms keys create pacdoc-cmek-key \
    --keyring=pacdoc-keyring \
    --location=us-central1 \
    --purpose=encryption

# Apply CMEK to bucket
gsutil kms encryption \
    -k projects/pacdocv2-api-prod/locations/us-central1/keyRings/pacdoc-keyring/cryptoKeys/pacdoc-cmek-key \
    gs://pacdoc-documents-prod
```

#### **Update Application Code**
```typescript
// packages/api/Cloud Functions/document-service/config/encryption.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Storage } from '@google-cloud/storage';

class EncryptionManager {
  private secretClient: SecretManagerServiceClient;
  private storage: Storage;
  
  async getCMEKKey(): Promise<string> {
    const [version] = await this.secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/cmek-key/versions/latest'
    });
    return version.payload?.data?.toString() || '';
  }
  
  async uploadWithCMEK(file: Buffer, destination: string): Promise<void> {
    const bucket = this.storage.bucket('pacdoc-documents-prod');
    const fileObj = bucket.file(destination);
    
    await fileObj.save(file, {
      encryptionKey: await this.getCMEKKey(),
      metadata: {
        'x-goog-encryption-algorithm': 'AES256',
        'x-goog-encryption-key-sha256': await this.getKeyHash()
      }
    });
  }
}
```

---

## 📅 Data Retention Policies

### **GLBA Retention Requirements for Notary Signing Service**
- **Signer Identity Documents** (DL, PP, ID): **Permanent retention** (never delete)
- **Signer Credentials** (insurance, bonds): **Permanent retention** (never delete)
- **Loan Documents**: 9 months total (90 days active + 6 months archive)
- **Merged Documents**: 9 months total (90 days active + 6 months archive)
- **Scanback Documents**: 9 months total (90 days active + 6 months archive)
- **Audit Logs**: 1 year (for operational needs)
- **Temporary Files**: 30 days maximum
- **Draft Documents**: 90 days maximum

### **Lifecycle Management Configuration**

#### **Notary Signing Service Lifecycle Policy**
```json
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
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "matchesSuffix": [".tmp", ".cache", ".draft"]
        }
      }
    ]
  }
}
```

#### **Apply Lifecycle Policy**
```bash
# Create lifecycle configuration file
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "SetStorageClass", "storageClass": "NEARLINE"},
        "condition": {"age": 90, "matchesPrefix": ["borrower/", "client/"]}
      },
      {
        "action": {"type": "SetStorageClass", "storageClass": "COLDLINE"},
        "condition": {"age": 365, "matchesPrefix": ["borrower/", "client/"]}
      },
      {
        "action": {"type": "Delete"},
        "condition": {"age": 2555, "matchesPrefix": ["temp/", "cache/"]}
      }
    ]
  }
}
EOF

# Apply to production bucket
gsutil lifecycle set lifecycle.json gs://pacdoc-documents-prod
```

### **Object-Level Retention**

#### **Retention Policy for Different Document Types**
```typescript
// packages/api/Cloud Functions/document-service/service/retention.service.ts
interface RetentionPolicy {
  documentType: string;
  retentionDays: number;
  storageClass: string;
  legalHold: boolean;
}

class RetentionService {
  private policies: RetentionPolicy[] = [
    // PERMANENT RETENTION - Never delete
    { documentType: 'signer_identity_documents', retentionDays: -1, storageClass: 'STANDARD', legalHold: true },
    { documentType: 'signer_credentials', retentionDays: -1, storageClass: 'STANDARD', legalHold: true },
    
    // TEMPORARY RETENTION - Delete after 9 months
    { documentType: 'loan_documents', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
    { documentType: 'merged_documents', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
    { documentType: 'scanback_documents', retentionDays: 270, storageClass: 'STANDARD', legalHold: false },
    
    // OPERATIONAL RETENTION
    { documentType: 'audit_logs', retentionDays: 365, storageClass: 'NEARLINE', legalHold: false },
    { documentType: 'temp_files', retentionDays: 30, storageClass: 'STANDARD', legalHold: false },
    { documentType: 'draft_documents', retentionDays: 90, storageClass: 'STANDARD', legalHold: false },
    { documentType: 'backup_files', retentionDays: 180, storageClass: 'NEARLINE', legalHold: false }
  ];
  
  async applyRetentionPolicy(filePath: string, documentType: string): Promise<void> {
    const policy = this.policies.find(p => p.documentType === documentType);
    if (!policy) throw new Error(`No retention policy for ${documentType}`);
    
    const bucket = this.storage.bucket('pacdoc-documents-prod');
    const file = bucket.file(filePath);
    
    await file.setMetadata({
      retention: {
        retentionPeriod: policy.retentionDays * 24 * 60 * 60 * 1000, // Convert to milliseconds
        mode: policy.legalHold ? 'COMPLIANCE' : 'UNLOCKED'
      },
      storageClass: policy.storageClass
    });
  }
}
```

---

## 🔍 Audit Logging & Monitoring

### **Enable Access Logging**
```bash
# Enable access logging
gsutil logging set on -b gs://pacdoc-access-logs gs://pacdoc-documents-prod

# Enable audit logging
gcloud logging sinks create pacdoc-audit-sink \
    bigquery.googleapis.com/projects/pacdocv2-api-prod/datasets/audit_logs \
    --log-filter='resource.type="gcs_bucket" AND resource.labels.bucket_name="pacdoc-documents-prod"'
```

### **Custom Audit Logging**
```typescript
// packages/api/Cloud Functions/document-service/service/audit.service.ts
interface DocumentAccessEvent {
  timestamp: Date;
  userId: string;
  userType: 'client' | 'employee' | 'signer';
  action: 'read' | 'write' | 'delete' | 'list';
  filePath: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  retentionPolicy?: string;
}

class DocumentAuditService {
  async logDocumentAccess(event: DocumentAccessEvent): Promise<void> {
    // Log to Cloud Logging
    await this.logToCloudLogging(event);
    
    // Log to BigQuery for analysis
    await this.logToBigQuery(event);
    
    // Check retention compliance
    await this.checkRetentionCompliance(event.filePath);
  }
  
  private async logToCloudLogging(event: DocumentAccessEvent): Promise<void> {
    const logEntry = {
      timestamp: event.timestamp,
      severity: event.success ? 'INFO' : 'WARNING',
      labels: {
        userId: event.userId,
        userType: event.userType,
        action: event.action,
        filePath: event.filePath
      },
      jsonPayload: event
    };
    
    // Use Cloud Logging client to write log
    await this.loggingClient.writeLogEntries({
      logName: 'projects/pacdocv2-api-prod/logs/document-access',
      entries: [logEntry]
    });
  }
}
```

---

## 🛡️ Security Hardening

### **Bucket Security Settings**
```bash
# Disable public access
gsutil iam ch -d allUsers:objectViewer gs://pacdoc-documents-prod

# Enable versioning for critical documents
gsutil versioning set on gs://pacdoc-documents-prod

# Enable object-level permissions
gsutil iam ch -d allUsers:objectViewer gs://pacdoc-documents-prod

# Set default object ACL to private
gsutil defacl set private gs://pacdoc-documents-prod
```

### **Network Security**
```bash
# Create VPC Service Controls perimeter
gcloud access-context-manager perimeters create pacdoc-perimeter \
    --title="PacDoc Document Storage Perimeter" \
    --resources=projects/pacdocv2-api-prod \
    --restricted-services=storage.googleapis.com \
    --vpc-allowed-projects=projects/pacdocv2-api-prod
```

### **Data Loss Prevention (DLP)**
```typescript
// packages/api/Cloud Functions/document-service/service/dlp.service.ts
import { DlpServiceClient } from '@google-cloud/dlp';

class DLPService {
  private dlpClient: DlpServiceClient;
  
  async scanDocument(filePath: string): Promise<boolean> {
    const request = {
      parent: 'projects/pacdocv2-api-prod/locations/us-central1',
      inspectConfig: {
        infoTypes: [
          { name: 'CREDIT_CARD_NUMBER' },
          { name: 'US_SOCIAL_SECURITY_NUMBER' },
          { name: 'US_BANK_ROUTING_MICR' },
          { name: 'PERSON_NAME' },
          { name: 'EMAIL_ADDRESS' }
        ],
        minLikelihood: 'POSSIBLE'
      },
      storageConfig: {
        cloudStorageOptions: {
          fileSet: { url: `gs://pacdoc-documents-prod/${filePath}` }
        }
      }
    };
    
    const [result] = await this.dlpClient.inspectContent(request);
    return result.result.findings.length === 0;
  }
}
```

---

## 📊 Compliance Monitoring

### **Retention Compliance Dashboard**
```sql
-- BigQuery query for retention compliance monitoring
SELECT 
  DATE(creation_time) as creation_date,
  COUNT(*) as total_files,
  COUNT(CASE WHEN retention_period IS NULL THEN 1 END) as missing_retention,
  COUNT(CASE WHEN storage_class = 'STANDARD' AND DATE_DIFF(CURRENT_DATE(), DATE(creation_time), DAY) > 90 THEN 1 END) as overdue_archive,
  COUNT(CASE WHEN DATE_DIFF(CURRENT_DATE(), DATE(creation_time), DAY) > 2555 THEN 1 END) as overdue_deletion
FROM `pacdocv2-api-prod.audit_logs.document_metadata`
WHERE DATE(creation_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY DATE(creation_time)
ORDER BY creation_date DESC;
```

### **Security Monitoring Alerts**
```yaml
# Cloud Monitoring alert policies
alertPolicies:
  - displayName: "Unauthorized Document Access"
    conditions:
      - displayName: "Failed document access attempts"
        conditionThreshold:
          filter: 'resource.type="gcs_bucket" AND resource.labels.bucket_name="pacdoc-documents-prod" AND jsonPayload.success=false'
          comparison: COMPARISON_GREATER_THAN
          thresholdValue: 10
          duration: 300s
    notificationChannels:
      - "projects/pacdocv2-api-prod/notificationChannels/security-alerts"
      
  - displayName: "Retention Policy Violations"
    conditions:
      - displayName: "Files without retention policy"
        conditionThreshold:
          filter: 'resource.type="gcs_bucket" AND jsonPayload.missing_retention=true'
          comparison: COMPARISON_GREATER_THAN
          thresholdValue: 1
          duration: 0s
```

---

## 🚀 Implementation Steps

### **Phase 1: Immediate Security (Week 1-2)**
1. **Enable bucket security settings**
   ```bash
   gsutil uniformbucketlevelaccess set on gs://pacdoc-documents-prod
   gsutil iam ch -d allUsers:objectViewer gs://pacdoc-documents-prod
   ```

2. **Enable access logging**
   ```bash
   gsutil logging set on -b gs://pacdoc-access-logs gs://pacdoc-documents-prod
   ```

3. **Enable versioning**
   ```bash
   gsutil versioning set on gs://pacdoc-documents-prod
   ```

### **Phase 2: Retention Policies (Week 3-4)**
1. **Create lifecycle configuration**
2. **Apply retention policies to existing objects**
3. **Implement retention service in application**

### **Phase 3: Advanced Security (Week 5-6)**
1. **Implement CMEK encryption**
2. **Set up VPC Service Controls**
3. **Configure DLP scanning**

### **Phase 4: Monitoring (Week 7-8)**
1. **Set up audit logging to BigQuery**
2. **Create compliance dashboards**
3. **Configure security alerts**

---

## 📋 Compliance Checklist

### **Security Requirements** ✅
- [ ] Uniform bucket-level access enabled
- [ ] Public access disabled
- [ ] Versioning enabled
- [ ] Access logging enabled
- [ ] CMEK encryption implemented
- [ ] VPC Service Controls configured

### **Retention Requirements** ✅
- [ ] Lifecycle policies configured
- [ ] Object-level retention set
- [ ] Legal hold capability enabled
- [ ] Automated deletion configured
- [ ] Retention compliance monitoring

### **Audit Requirements** ✅
- [ ] All access attempts logged
- [ ] Audit logs retained for 7 years
- [ ] Compliance dashboards created
- [ ] Security alerts configured
- [ ] Regular compliance reviews

---

## 💰 Cost Impact

### **Storage Costs (Monthly)**
- **Standard Storage**: $0.020/GB/month
- **Nearline Storage**: $0.010/GB/month (after 90 days)
- **Coldline Storage**: $0.004/GB/month (after 1 year)
- **Archive Storage**: $0.0012/GB/month (after 1 year)

### **Estimated Monthly Savings**
- **Year 1**: 15% reduction in storage costs
- **Year 2**: 35% reduction in storage costs
- **Year 3+**: 50% reduction in storage costs

### **Additional Costs**
- **CMEK**: $0.06/key/month + $0.03/10,000 operations
- **DLP Scanning**: $1.00/GB scanned
- **BigQuery Logging**: $5.00/TB queried

---

## 🎯 Success Metrics

### **Security Metrics**
- **0** unauthorized access incidents
- **100%** of objects encrypted with CMEK
- **< 1 hour** incident response time
- **100%** access logging coverage

### **Retention Metrics**
- **100%** of objects have retention policies
- **0** retention policy violations
- **100%** compliance with GLBA requirements
- **< 24 hours** retention policy application time

### **Cost Metrics**
- **30%** reduction in storage costs by year 2
- **$0** compliance violation fines
- **100%** audit readiness
- **< 5 minutes** compliance reporting time

---

**Next Steps**: Start with Phase 1 security hardening, then implement retention policies, followed by advanced security features and monitoring.
