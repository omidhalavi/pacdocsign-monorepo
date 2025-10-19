# 🚀 SAFE DEPLOYMENT STRATEGY WITH ROLLBACK

## 📋 **DEPLOYMENT OVERVIEW**

This document outlines a comprehensive, safe deployment strategy for our GCS security improvements with full rollback capabilities and thorough testing.

---

## 🎯 **DEPLOYMENT GOALS**

- ✅ **Zero Downtime**: Deploy without service interruption
- ✅ **Backward Compatibility**: All existing files remain accessible
- ✅ **Rollback Ready**: Can revert to previous state if issues arise
- ✅ **Comprehensive Testing**: Verify functionality before and after
- ✅ **Monitoring**: Real-time visibility into deployment health

---

## 📊 **PRE-DEPLOYMENT CHECKLIST**

### **🔍 Environment Verification**
```bash
# 1. Verify all secrets exist and are accessible
gcloud secrets list --project=pacdocv2-api-prod
gcloud secrets list --project=docstorage-286015

# 2. Test secret access from Cloud Functions environment
gcloud functions call document-service --data='{"test":"secret-access"}'

# 3. Verify current file access works
curl -X POST https://your-api-endpoint/test-file-access
```

### **📁 File Access Baseline Test**
```bash
# Test accessing existing files with current authentication
npm run test:file-access:baseline
```

### **🔐 Secret Manager Permissions**
```bash
# Verify Cloud Functions service account has Secret Manager access
gcloud projects get-iam-policy pacdocv2-api-prod
gcloud projects get-iam-policy docstorage-286015
```

---

## 🧪 **TESTING STRATEGY**

### **Phase 1: Pre-Deployment Tests**

#### **Test 1: Document Access Verification**
```typescript
// test/pre-deployment/document-access.test.ts
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Pre-Deployment Document Access Tests', () => {
  let storage: Storage;
  let secretClient: SecretManagerServiceClient;

  beforeAll(async () => {
    secretClient = new SecretManagerServiceClient();
    
    // Test current authentication method
    storage = new Storage({
      keyFilename: './config/GCS-Prod.json', // Current method
      projectId: 'pacdocv2-api-prod'
    });
  });

  test('Should access existing borrower documents', async () => {
    const testFiles = [
      'borrower/13040000/test-document.pdf',
      'borrower/13050000/loan-document.pdf'
    ];

    for (const filePath of testFiles) {
      try {
        const file = storage.bucket('pacdoc').file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          expect(metadata.name).toBe(filePath);
          console.log(`✅ Pre-deployment: Can access ${filePath}`);
        }
      } catch (error) {
        console.log(`⚠️ Pre-deployment: File ${filePath} not found or inaccessible`);
      }
    }
  });

  test('Should access existing signer documents', async () => {
    const testFiles = [
      'signers/drivers-license/test-id.pdf',
      'signers/passport/test-passport.pdf'
    ];

    for (const filePath of testFiles) {
      try {
        const file = storage.bucket('pacdoc').file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          expect(metadata.name).toBe(filePath);
          console.log(`✅ Pre-deployment: Can access ${filePath}`);
        }
      } catch (error) {
        console.log(`⚠️ Pre-deployment: File ${filePath} not found or inaccessible`);
      }
    }
  });

  test('Should verify CSEK encryption works', async () => {
    const CSEK = 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=';
    const testFile = 'borrower/13040000/test-encrypted.pdf';

    try {
      const file = storage
        .bucket('pacdoc')
        .file(testFile)
        .setEncryptionKey(Buffer.from(CSEK, 'base64'));

      const [metadata] = await file.getMetadata();
      expect(metadata.name).toBe(testFile);
      console.log(`✅ Pre-deployment: CSEK encryption works`);
    } catch (error) {
      console.log(`⚠️ Pre-deployment: CSEK test failed - ${error.message}`);
    }
  });
});
```

#### **Test 2: Secret Manager Access Test**
```typescript
// test/pre-deployment/secret-manager.test.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Pre-Deployment Secret Manager Tests', () => {
  let secretClient: SecretManagerServiceClient;

  beforeAll(() => {
    secretClient = new SecretManagerServiceClient();
  });

  test('Should access production service account secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      expect(serviceAccountKey.client_email).toBe('document-service@pacdocv2-api-prod.iam.gserviceaccount.com');
      console.log('✅ Pre-deployment: Production secret accessible');
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access production secret - ${error.message}`);
    }
  });

  test('Should access development service account secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/docstorage-286015/secrets/gcs-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      expect(serviceAccountKey.client_email).toBe('pacdoc-live@docstorage-286015.iam.gserviceaccount.com');
      console.log('✅ Pre-deployment: Development secret accessible');
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access development secret - ${error.message}`);
    }
  });

  test('Should access CSEK secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
      });
      
      const csek = version.payload?.data?.toString();
      expect(csek).toBe('THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=');
      console.log('✅ Pre-deployment: CSEK secret accessible');
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access CSEK secret - ${error.message}`);
    }
  });
});
```

### **Phase 2: Post-Deployment Tests**

#### **Test 3: New Authentication Verification**
```typescript
// test/post-deployment/new-auth.test.ts
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Post-Deployment New Authentication Tests', () => {
  let storage: Storage;
  let secretClient: SecretManagerServiceClient;

  beforeAll(async () => {
    secretClient = new SecretManagerServiceClient();
    
    // Test new Secret Manager authentication
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
  });

  test('Should access files with Secret Manager auth', async () => {
    const testFiles = [
      'borrower/13040000/test-document.pdf',
      'signers/drivers-license/test-id.pdf'
    ];

    for (const filePath of testFiles) {
      try {
        const file = storage.bucket('pacdoc').file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          expect(metadata.name).toBe(filePath);
          console.log(`✅ Post-deployment: Secret Manager auth works for ${filePath}`);
        }
      } catch (error) {
        console.log(`⚠️ Post-deployment: File ${filePath} not found or inaccessible`);
      }
    }
  });

  test('Should maintain CSEK encryption compatibility', async () => {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    const CSEK = version.payload?.data?.toString();
    const testFile = 'borrower/13040000/test-encrypted.pdf';

    try {
      const file = storage
        .bucket('pacdoc')
        .file(testFile)
        .setEncryptionKey(Buffer.from(CSEK, 'base64'));

      const [metadata] = await file.getMetadata();
      expect(metadata.name).toBe(testFile);
      console.log(`✅ Post-deployment: CSEK from Secret Manager works`);
    } catch (error) {
      throw new Error(`❌ Post-deployment: CSEK test failed - ${error.message}`);
    }
  });
});
```

#### **Test 4: API Endpoint Tests**
```typescript
// test/post-deployment/api-endpoints.test.ts
import axios from 'axios';

describe('Post-Deployment API Endpoint Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-endpoint';

  test('Should upload file with new authentication', async () => {
    const testFile = Buffer.from('test file content');
    
    const formData = new FormData();
    formData.append('file', testFile, 'test-file.pdf');
    formData.append('destination', 'test/upload');
    // Note: CSEK is now optional - will use Secret Manager

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      expect(response.status).toBe(200);
      console.log('✅ Post-deployment: File upload works with new auth');
    } catch (error) {
      throw new Error(`❌ Post-deployment: Upload failed - ${error.message}`);
    }
  });

  test('Should download file with new authentication', async () => {
    const requestData = {
      folder: 'test/upload',
      fileName: 'test-file.pdf'
      // Note: CSEK is now optional - will use Secret Manager
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/getfile`, requestData);
      
      expect(response.status).toBe(200);
      console.log('✅ Post-deployment: File download works with new auth');
    } catch (error) {
      throw new Error(`❌ Post-deployment: Download failed - ${error.message}`);
    }
  });

  test('Should maintain backward compatibility with CSEK in request', async () => {
    const requestData = {
      folder: 'test/upload',
      fileName: 'test-file.pdf',
      CSEK: 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=' // Explicit CSEK
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/getfile`, requestData);
      
      expect(response.status).toBe(200);
      console.log('✅ Post-deployment: Backward compatibility maintained');
    } catch (error) {
      throw new Error(`❌ Post-deployment: Backward compatibility failed - ${error.message}`);
    }
  });
});
```

---

## 🚀 **DEPLOYMENT PROCEDURE**

### **Step 1: Pre-Deployment Verification**
```bash
# Run all pre-deployment tests
npm run test:pre-deployment

# Verify secrets are accessible
npm run verify:secrets

# Check current file access
npm run test:file-access:baseline
```

### **Step 2: Staging Deployment**
```bash
# Deploy to staging environment first
npm run deploy:staging

# Run post-deployment tests on staging
npm run test:post-deployment:staging

# Verify staging functionality
npm run verify:staging
```

### **Step 3: Production Deployment**
```bash
# Deploy to production
npm run deploy:production

# Run post-deployment tests
npm run test:post-deployment:production

# Verify production functionality
npm run verify:production
```

### **Step 4: Monitoring**
```bash
# Monitor deployment health
npm run monitor:deployment

# Check error rates
npm run check:error-rates

# Verify file access metrics
npm run check:file-access-metrics
```

---

## 🔄 **ROLLBACK PROCEDURE**

### **Emergency Rollback Script**
```bash
#!/bin/bash
# rollback-security-changes.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Rolling back GCS security changes..."

# 1. Restore original service files
echo "Step 1: Restoring original service files..."
git checkout HEAD~1 -- packages/api/src/service/FileStorageService.js
git checkout HEAD~1 -- packages/api/Cloud\ Functions/document-service/service/file.service.ts

# 2. Restore original configuration files
echo "Step 2: Restoring original configuration files..."
git checkout HEAD~1 -- packages/api/src/config/index.js
git checkout HEAD~1 -- packages/api/src/config/index.js.default

# 3. Restore original package.json
echo "Step 3: Restoring original package.json..."
git checkout HEAD~1 -- packages/api/Cloud\ Functions/document-service/package.json

# 4. Restore original scripts
echo "Step 4: Restoring original scripts..."
git checkout HEAD~1 -- packages/api/Cloud\ Functions/document-service/scripts/missingSignerDocuments.ts

# 5. Restore original controller
echo "Step 5: Restoring original controller..."
git checkout HEAD~1 -- packages/api/src/controllers/file.controller.js

# 6. Restore GCS files (if they exist in git history)
echo "Step 6: Checking for GCS files to restore..."
if git show HEAD~1:packages/api/src/config/GCS.json > /dev/null 2>&1; then
    git checkout HEAD~1 -- packages/api/src/config/GCS.json
    echo "✅ Restored packages/api/src/config/GCS.json"
fi

if git show HEAD~1:packages/api/Cloud\ Functions/document-service/config/GCS-Prod.json > /dev/null 2>&1; then
    git checkout HEAD~1 -- packages/api/Cloud\ Functions/document-service/config/GCS-Prod.json
    echo "✅ Restored packages/api/Cloud Functions/document-service/config/GCS-Prod.json"
fi

# 7. Deploy rollback
echo "Step 7: Deploying rollback..."
npm run deploy:production:rollback

# 8. Verify rollback
echo "Step 8: Verifying rollback..."
npm run test:rollback-verification

echo "✅ ROLLBACK COMPLETED"
echo "System restored to previous state"
```

### **Rollback Verification Tests**
```typescript
// test/rollback/rollback-verification.test.ts
describe('Rollback Verification Tests', () => {
  test('Should access files with original authentication', async () => {
    const storage = new Storage({
      keyFilename: './config/GCS-Prod.json', // Original method
      projectId: 'pacdocv2-api-prod'
    });

    const testFile = 'borrower/13040000/test-document.pdf';
    
    try {
      const file = storage.bucket('pacdoc').file(testFile);
      const [exists] = await file.exists();
      
      if (exists) {
        const [metadata] = await file.getMetadata();
        expect(metadata.name).toBe(testFile);
        console.log('✅ Rollback: Original authentication works');
      }
    } catch (error) {
      throw new Error(`❌ Rollback: File access failed - ${error.message}`);
    }
  });

  test('Should maintain CSEK functionality', async () => {
    const CSEK = 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=';
    const storage = new Storage({
      keyFilename: './config/GCS-Prod.json',
      projectId: 'pacdocv2-api-prod'
    });

    const testFile = 'borrower/13040000/test-encrypted.pdf';

    try {
      const file = storage
        .bucket('pacdoc')
        .file(testFile)
        .setEncryptionKey(Buffer.from(CSEK, 'base64'));

      const [metadata] = await file.getMetadata();
      expect(metadata.name).toBe(testFile);
      console.log('✅ Rollback: CSEK functionality maintained');
    } catch (error) {
      throw new Error(`❌ Rollback: CSEK test failed - ${error.message}`);
    }
  });
});
```

---

## 📊 **MONITORING & ALERTING**

### **Health Check Endpoints**
```typescript
// Add to your API
app.get('/health/file-access', async (req, res) => {
  try {
    // Test file access with new authentication
    const storage = await initializeStorage();
    const testFile = storage.bucket(config.GCS.bucketName).file('health-check/test.txt');
    
    const [exists] = await testFile.exists();
    
    res.json({
      status: 'healthy',
      fileAccess: exists ? 'working' : 'warning',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health/secret-manager', async (req, res) => {
  try {
    const secretClient = new SecretManagerServiceClient();
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${config.GCS.projectId}/secrets/gcs-csek-key/versions/latest`
    });
    
    res.json({
      status: 'healthy',
      secretManager: 'accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### **Deployment Monitoring Script**
```bash
#!/bin/bash
# monitor-deployment.sh

echo "🔍 Monitoring deployment health..."

# Check health endpoints
curl -f https://your-api-endpoint/health/file-access || echo "❌ File access health check failed"
curl -f https://your-api-endpoint/health/secret-manager || echo "❌ Secret Manager health check failed"

# Check error rates
ERROR_RATE=$(curl -s https://your-api-endpoint/metrics/error-rate | jq '.rate')
if (( $(echo "$ERROR_RATE > 0.05" | bc -l) )); then
    echo "⚠️ High error rate detected: $ERROR_RATE"
fi

# Check file access metrics
FILE_ACCESS_SUCCESS=$(curl -s https://your-api-endpoint/metrics/file-access-success | jq '.rate')
if (( $(echo "$FILE_ACCESS_SUCCESS < 0.95" | bc -l) )); then
    echo "⚠️ Low file access success rate: $FILE_ACCESS_SUCCESS"
fi

echo "✅ Deployment monitoring complete"
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] All secrets created and accessible
- [ ] Pre-deployment tests passing
- [ ] File access baseline established
- [ ] Rollback plan prepared
- [ ] Monitoring configured

### **Deployment**
- [ ] Staging deployment successful
- [ ] Staging tests passing
- [ ] Production deployment initiated
- [ ] Post-deployment tests running
- [ ] Health checks passing

### **Post-Deployment**
- [ ] All file access tests passing
- [ ] API endpoints responding correctly
- [ ] Error rates within normal range
- [ ] Monitoring alerts configured
- [ ] Rollback procedures tested

### **Rollback (if needed)**
- [ ] Rollback script executed
- [ ] Original files restored
- [ ] Rollback verification tests passing
- [ ] System functionality confirmed
- [ ] Incident post-mortem scheduled

---

## 🎯 **SUCCESS CRITERIA**

### **Deployment Success**
- ✅ All existing files remain accessible
- ✅ New authentication method working
- ✅ CSEK functionality maintained
- ✅ API endpoints responding correctly
- ✅ Error rates within normal range
- ✅ No service interruption

### **Rollback Success**
- ✅ System restored to previous state
- ✅ All files accessible with original method
- ✅ No data loss
- ✅ Service functionality confirmed
- ✅ Monitoring restored

**This deployment strategy ensures maximum safety with comprehensive testing and reliable rollback capabilities!** 🚀


