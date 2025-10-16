# Existing Documents Cleanup Plan

## 🚨 **Situation Analysis**

You have **12,258+ existing orders** (borrower IDs 13040000 to 13052258) with documents that may be past the retention period. We need a **safe, systematic approach** to handle these existing documents.

## 📊 **Current Document Inventory**

### **Document Categories**
- **Borrower Documents**: `borrower/{borrower_id}/` - **9 months retention**
- **Signer Identity Documents**: `signers/` - **Permanent retention**
- **Mixed Documents**: Some may be in wrong locations

### **Risk Assessment**
- **High Risk**: Deleting active loan documents
- **Medium Risk**: Deleting recent scanback documents
- **Low Risk**: Deleting old temp/cache files
- **No Risk**: Keeping signer identity documents

---

## 🎯 **Cleanup Strategy: 4-Phase Approach**

### **Phase 1: Discovery & Analysis (Week 1)**
**Goal**: Understand what we have and identify retention status

#### **Task 1.1: Create Document Audit Script**
```typescript
// packages/api/Cloud Functions/document-service/scripts/documentAudit.ts
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import config from '../config/index';

class DocumentAuditService {
  private secretClient: SecretManagerServiceClient;
  private storage: Storage | null = null;

  constructor() {
    this.secretClient = new SecretManagerServiceClient();
  }

  private async initializeStorage(): Promise<Storage> {
    if (this.storage) {
      return this.storage;
    }

    try {
      // Determine which secret to use based on environment
      const secretName = config.GCS.projectId === 'pacdocv2-api-prod' 
        ? 'gcs-prod-service-account-key' 
        : 'gcs-service-account-key';
      
      // Get service account key from Secret Manager
      const [version] = await this.secretClient.accessSecretVersion({
        name: `projects/${config.GCS.projectId}/secrets/${secretName}/versions/latest`
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      
      // Initialize Storage with service account key from Secret Manager
      this.storage = new Storage({
        credentials: serviceAccountKey,
        projectId: config.GCS.projectId
      });
      
      console.log(`✅ Audit Service Storage initialized with Secret Manager credentials (${secretName})`);
      return this.storage;
    } catch (error) {
      console.error('❌ Failed to initialize storage with Secret Manager, falling back to file:', error);
      
      // Fallback to file-based authentication
      this.storage = new Storage({
        keyFilename: __dirname + '/../config/' + config.GCS.apiKeyFileName,
        projectId: config.GCS.projectId
      });
      
      return this.storage;
    }
  }

  async auditAllDocuments() {
    const auditResults = {
      borrowerDocuments: [],
      signerDocuments: [],
      expiredDocuments: [],
      recentDocuments: [],
      unknownDocuments: []
    };

    // Audit borrower documents
    await this.auditBorrowerDocuments(auditResults);
    
    // Audit signer documents
    await this.auditSignerDocuments(auditResults);
    
    // Generate reports
    await this.generateAuditReports(auditResults);
    
    return auditResults;
  }

  private async auditBorrowerDocuments(results: any) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 9); // 9 months ago

    for (let id = 13040000; id <= 13052258; id++) {
      const folder = `borrower/${id}`;
      const options = { directory: folder, delimiter: '/' };
      
      try {
        const [files] = await this.storage.bucket(config.GCS.bucketName).getFiles(options);
        
        for (const file of files) {
          const fileData = {
            path: file.name,
            borrowerId: id,
            createdDate: new Date(file.metadata.timeCreated),
            size: file.metadata.size,
            isExpired: new Date(file.metadata.timeCreated) < cutoffDate,
            documentType: this.categorizeDocument(file.name)
          };
          
          if (fileData.isExpired) {
            results.expiredDocuments.push(fileData);
          } else {
            results.recentDocuments.push(fileData);
          }
          
          results.borrowerDocuments.push(fileData);
        }
      } catch (error) {
        console.error(`Error auditing borrower ${id}:`, error);
      }
    }
  }

  private async auditSignerDocuments(results: any) {
    const signerFolders = ['DL', 'PP', 'ID', 'credentials'];
    
    for (const folder of signerFolders) {
      const options = { directory: `signers/${folder}`, delimiter: '/' };
      
      try {
        const [files] = await this.storage.bucket(config.GCS.bucketName).getFiles(options);
        
        for (const file of files) {
          const fileData = {
            path: file.name,
            signerId: this.extractSignerId(file.name),
            createdDate: new Date(file.metadata.timeCreated),
            size: file.metadata.size,
            documentType: folder,
            isPermanent: true // All signer docs are permanent
          };
          
          results.signerDocuments.push(fileData);
        }
      } catch (error) {
        console.error(`Error auditing signer folder ${folder}:`, error);
      }
    }
  }

  private categorizeDocument(filePath: string): string {
    if (filePath.includes('originaldocuments')) return 'original';
    if (filePath.includes('signers/scanbacks')) return 'scanback';
    if (filePath.includes('signers/')) return 'merged';
    if (filePath.includes('temp/')) return 'temp';
    if (filePath.includes('cache/')) return 'cache';
    return 'unknown';
  }

  private extractSignerId(fileName: string): string {
    return fileName.split('_')[0];
  }

  private async generateAuditReports(results: any) {
    // Generate CSV reports for analysis
    await this.generateCSVReport('borrower_documents.csv', results.borrowerDocuments);
    await this.generateCSVReport('signer_documents.csv', results.signerDocuments);
    await this.generateCSVReport('expired_documents.csv', results.expiredDocuments);
    
    // Generate summary report
    await this.generateSummaryReport(results);
  }
}
```

#### **Task 1.2: Run Document Audit**
```bash
# Run the audit script
cd packages/api/Cloud Functions/document-service
npm run audit-documents

# Expected outputs:
# - borrower_documents.csv (all borrower docs with dates)
# - signer_documents.csv (all signer docs - should be kept)
# - expired_documents.csv (docs older than 9 months)
# - audit_summary.json (statistics and recommendations)
```

#### **Task 1.3: Analyze Results**
- **Review expired documents** by borrower ID
- **Identify recent documents** that should be kept
- **Check for signer documents** in wrong locations
- **Estimate storage savings** from cleanup

---

### **Phase 2: Safe Cleanup Preparation (Week 2)**
**Goal**: Prepare for safe deletion with rollback capability

#### **Task 2.1: Create Backup Strategy**
```typescript
// Create backup of documents before deletion
class BackupService {
  async createBackup(expiredDocuments: any[]) {
    const backupBucket = `${config.GCS.bucketName}-backup-${new Date().toISOString().split('T')[0]}`;
    
    // Create backup bucket
    await this.storage.createBucket(backupBucket);
    
    // Copy expired documents to backup
    for (const doc of expiredDocuments) {
      await this.storage
        .bucket(config.GCS.bucketName)
        .file(doc.path)
        .copy(this.storage.bucket(backupBucket).file(doc.path));
    }
    
    return backupBucket;
  }
}
```

#### **Task 2.2: Create Deletion Script with Safety Checks**
```typescript
class SafeDeletionService {
  async deleteExpiredDocuments(expiredDocuments: any[], dryRun: boolean = true) {
    const deletionLog = [];
    
    for (const doc of expiredDocuments) {
      // Safety checks
      if (this.isSignerDocument(doc.path)) {
        console.log(`SKIPPING: Signer document ${doc.path} - should be permanent`);
        continue;
      }
      
      if (this.isRecentDocument(doc.createdDate)) {
        console.log(`SKIPPING: Recent document ${doc.path} - within retention period`);
        continue;
      }
      
      if (dryRun) {
        console.log(`DRY RUN: Would delete ${doc.path}`);
        deletionLog.push({ action: 'would_delete', path: doc.path, reason: 'expired' });
      } else {
        try {
          await this.storage.bucket(config.GCS.bucketName).file(doc.path).delete();
          console.log(`DELETED: ${doc.path}`);
          deletionLog.push({ action: 'deleted', path: doc.path, timestamp: new Date() });
        } catch (error) {
          console.error(`ERROR deleting ${doc.path}:`, error);
          deletionLog.push({ action: 'error', path: doc.path, error: error.message });
        }
      }
    }
    
    return deletionLog;
  }
  
  private isSignerDocument(path: string): boolean {
    return path.startsWith('signers/');
  }
  
  private isRecentDocument(createdDate: Date): boolean {
    const nineMonthsAgo = new Date();
    nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);
    return createdDate > nineMonthsAgo;
  }
}
```

#### **Task 2.3: Create Rollback Plan**
```typescript
class RollbackService {
  async rollbackDeletion(backupBucket: string, deletionLog: any[]) {
    const rollbackLog = [];
    
    for (const entry of deletionLog) {
      if (entry.action === 'deleted') {
        try {
          // Restore from backup
          await this.storage
            .bucket(backupBucket)
            .file(entry.path)
            .copy(this.storage.bucket(config.GCS.bucketName).file(entry.path));
          
          rollbackLog.push({ action: 'restored', path: entry.path });
        } catch (error) {
          rollbackLog.push({ action: 'restore_error', path: entry.path, error: error.message });
        }
      }
    }
    
    return rollbackLog;
  }
}
```

---

### **Phase 3: Gradual Cleanup Execution (Week 3)**
**Goal**: Execute cleanup in safe, monitored batches

#### **Task 3.1: Start with Low-Risk Documents**
```bash
# Phase 3A: Delete temp and cache files (lowest risk)
npm run cleanup-temp-files --dry-run
npm run cleanup-temp-files --execute

# Phase 3B: Delete old draft documents
npm run cleanup-draft-files --dry-run
npm run cleanup-draft-files --execute
```

#### **Task 3.2: Cleanup Old Borrower Documents**
```bash
# Phase 3C: Delete expired borrower documents (medium risk)
npm run cleanup-expired-borrower --dry-run
npm run cleanup-expired-borrower --execute --batch-size=100
```

#### **Task 3.3: Monitor and Validate**
- **Check storage usage** before/after each batch
- **Verify signer documents** are untouched
- **Monitor application** for any issues
- **Generate cleanup reports** after each batch

---

### **Phase 4: Final Cleanup & Validation (Week 4)**
**Goal**: Complete cleanup and implement ongoing retention

#### **Task 4.1: Complete Remaining Cleanup**
```bash
# Phase 4A: Cleanup remaining expired documents
npm run cleanup-remaining --dry-run
npm run cleanup-remaining --execute

# Phase 4B: Cleanup orphaned files
npm run cleanup-orphaned --dry-run
npm run cleanup-orphaned --execute
```

#### **Task 4.2: Implement Ongoing Retention**
- **Deploy lifecycle policies** to prevent future accumulation
- **Set up monitoring** for document retention
- **Create alerts** for policy violations

#### **Task 4.3: Final Validation**
- **Verify all signer documents** are preserved
- **Confirm storage reduction** targets met
- **Test application functionality** with cleaned storage
- **Generate final cleanup report**

---

## 📋 **Implementation Checklist**

### **Pre-Cleanup Checklist**
- [ ] **Backup Strategy**: Create backup of all documents
- [ ] **Audit Complete**: Run full document audit
- [ ] **Safety Checks**: Implement safety validation
- [ ] **Rollback Plan**: Test rollback procedures
- [ ] **Team Notification**: Notify all stakeholders

### **During Cleanup Checklist**
- [ ] **Dry Run First**: Always test with dry-run
- [ ] **Batch Processing**: Process in small batches
- [ ] **Monitor Storage**: Track storage usage changes
- [ ] **Verify Signer Docs**: Ensure signer docs untouched
- [ ] **Application Testing**: Test app after each batch

### **Post-Cleanup Checklist**
- [ ] **Storage Reduction**: Verify target reduction achieved
- [ ] **Functionality Test**: Ensure app works correctly
- [ ] **Retention Policies**: Deploy ongoing retention
- [ ] **Monitoring Setup**: Set up retention monitoring
- [ ] **Documentation**: Update cleanup procedures

---

## 🚨 **Safety Measures**

### **Critical Safety Rules**
1. **NEVER delete** documents in `signers/` folder
2. **ALWAYS backup** before deletion
3. **DRY RUN first** for every operation
4. **BATCH processing** to limit impact
5. **MONITOR continuously** during cleanup

### **Rollback Procedures**
1. **Immediate rollback** if issues detected
2. **Restore from backup** if needed
3. **Validate application** after rollback
4. **Document lessons learned**

### **Emergency Contacts**
- **DevOps Lead**: [Contact info]
- **Backend Lead**: [Contact info]
- **Security Officer**: [Contact info]

---

## 📊 **Expected Outcomes**

### **Storage Reduction**
- **Estimated reduction**: 60-80% of current storage
- **Cost savings**: $500-1000/month
- **Retention compliance**: 100%

### **Document Preservation**
- **Signer documents**: 100% preserved
- **Recent loan docs**: 100% preserved
- **Expired loan docs**: Safely deleted

### **Risk Mitigation**
- **Zero data loss** for critical documents
- **Complete rollback** capability
- **Audit trail** for all operations

---

## 🎯 **Next Steps**

1. **Start with Phase 1**: Run document audit
2. **Review results**: Analyze what needs cleanup
3. **Create backup**: Implement backup strategy
4. **Begin cleanup**: Start with low-risk documents
5. **Monitor progress**: Track storage and functionality

**Ready to begin? Start with Task 1.1: Create Document Audit Script**
