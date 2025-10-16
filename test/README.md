# 🧪 GCS Security Testing Suite

## 📋 **Overview**

This comprehensive testing suite validates our GCS security implementation with Secret Manager integration, ensuring backward compatibility and providing rollback verification.

---

## 🎯 **Testing Phases**

### **Phase 1: Pre-Deployment Tests**
- ✅ **Secret Manager Access**: Verify all secrets are accessible
- ✅ **File Access Verification**: Test current file access methods
- ✅ **Document Access Tests**: Validate existing file accessibility
- ✅ **CSEK Functionality**: Test encryption key operations

### **Phase 2: Post-Deployment Tests**
- ✅ **New Authentication**: Test Secret Manager-based authentication
- ✅ **API Endpoint Tests**: Validate API functionality
- ✅ **Backward Compatibility**: Ensure existing functionality works
- ✅ **Performance Tests**: Verify no performance degradation

### **Phase 3: Rollback Verification**
- ✅ **Original Authentication**: Test file-based authentication
- ✅ **System Stability**: Verify rollback doesn't break functionality
- ✅ **CSEK Compatibility**: Ensure encryption still works
- ✅ **File Operations**: Test all file operations after rollback

---

## 🚀 **Quick Start**

### **Run All Tests**
```bash
# From project root
./test/scripts/run-all-tests.sh
```

### **Run Individual Test Phases**
```bash
# Pre-deployment tests
cd test && npm run test:pre-deployment

# Post-deployment tests
cd test && npm run test:post-deployment

# Rollback verification
cd test && npm run test:rollback-verification
```

### **Run Specific Tests**
```bash
# Secret Manager tests
cd test && npm run test:security

# File access tests
cd test && npm run test:file-access

# New authentication tests
cd test && npm run test:new-auth

# API endpoint tests
cd test && npm run test:api-endpoints
```

---

## 🔧 **Setup Requirements**

### **Prerequisites**
- Node.js 18+
- Google Cloud SDK
- Access to Secret Manager
- Access to GCS bucket

### **Environment Variables**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
export API_BASE_URL="https://your-api-endpoint"
export NODE_ENV="test"
```

### **Install Dependencies**
```bash
cd test
npm install
```

---

## 📊 **Test Structure**

```
test/
├── pre-deployment/
│   ├── document-access.test.ts      # File access verification
│   └── secret-manager.test.ts       # Secret Manager access tests
├── post-deployment/
│   ├── new-auth.test.ts             # New authentication tests
│   └── api-endpoints.test.ts        # API endpoint tests
├── rollback/
│   └── rollback-verification.test.ts # Rollback verification tests
├── scripts/
│   ├── verify-secrets.js            # Secret verification script
│   ├── verify-file-access.js       # File access verification script
│   └── run-all-tests.sh             # Comprehensive test runner
├── package.json                     # Test dependencies and scripts
└── setup.ts                        # Test setup and utilities
```

---

## 🧪 **Test Details**

### **Pre-Deployment Tests**

#### **Document Access Tests**
- Tests access to existing borrower documents
- Tests access to existing signer documents
- Verifies CSEK encryption functionality
- Tests bucket access and permissions
- Tests file upload capability

#### **Secret Manager Tests**
- Tests production service account secret access
- Tests development service account secret access
- Tests CSEK secret access
- Verifies secret permissions and metadata
- Tests secret version history

### **Post-Deployment Tests**

#### **New Authentication Tests**
- Tests file access with Secret Manager authentication
- Verifies CSEK encryption compatibility
- Tests environment-specific secret selection
- Tests fallback mechanism
- Tests file operations with new authentication
- Tests performance with new authentication

#### **API Endpoint Tests**
- Tests file upload without CSEK in request
- Tests file download without CSEK in request
- Tests backward compatibility with CSEK in request
- Tests file listing functionality
- Tests file deletion functionality
- Tests health endpoints
- Tests API response times
- Tests error handling

### **Rollback Verification Tests**

#### **Rollback Verification**
- Tests file access with original authentication
- Tests CSEK functionality after rollback
- Tests bucket access and permissions
- Tests file operations with original authentication
- Tests performance with original authentication
- Tests system stability after rollback

---

## 📈 **Success Criteria**

### **Pre-Deployment Success**
- ✅ All secrets accessible in Secret Manager
- ✅ File access working with current authentication
- ✅ CSEK functionality working
- ✅ Bucket permissions correct

### **Post-Deployment Success**
- ✅ File access working with Secret Manager authentication
- ✅ CSEK functionality maintained
- ✅ API endpoints responding correctly
- ✅ Backward compatibility maintained
- ✅ Performance within acceptable limits

### **Rollback Success**
- ✅ System restored to previous state
- ✅ All files accessible with original method
- ✅ CSEK functionality maintained
- ✅ No data loss
- ✅ System stability confirmed

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Secret Manager Access Denied**
```bash
# Check authentication
gcloud auth list
gcloud config get-value project

# Verify permissions
gcloud projects get-iam-policy pacdocv2-api-prod
```

#### **File Access Issues**
```bash
# Check bucket permissions
gsutil iam get gs://pacdoc

# Test bucket access
gsutil ls gs://pacdoc
```

#### **CSEK Issues**
```bash
# Verify CSEK secret
gcloud secrets versions access latest --secret="gcs-csek-key"
```

### **Test Failures**

#### **If Pre-Deployment Tests Fail**
- Check Secret Manager permissions
- Verify GCS bucket access
- Ensure CSEK secret is correct
- Check network connectivity

#### **If Post-Deployment Tests Fail**
- Verify Secret Manager integration
- Check environment-specific secrets
- Test fallback mechanisms
- Verify API endpoint availability

#### **If Rollback Tests Fail**
- Check original authentication files
- Verify rollback procedures
- Test system stability
- Check for data corruption

---

## 📞 **Support**

### **Test Issues**
- Check test logs for detailed error messages
- Verify environment setup
- Check network connectivity
- Verify permissions

### **Deployment Issues**
- Review deployment logs
- Check Secret Manager access
- Verify GCS permissions
- Test rollback procedures

---

## 🎉 **Current Status**

**✅ Testing Suite Ready**

The comprehensive testing suite is now ready to validate our GCS security implementation. All test phases are implemented with detailed verification and rollback capabilities.

**Ready to run tests and validate the security implementation!** 🚀
