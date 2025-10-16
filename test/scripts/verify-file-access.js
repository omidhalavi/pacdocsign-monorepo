// test/scripts/verify-file-access.js
const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function verifyFileAccess() {
  console.log('🔍 Verifying file access...');
  console.log('============================');
  
  const secretClient = new SecretManagerServiceClient();
  let storage;
  
  // Try to initialize storage with Secret Manager
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    
    console.log('✅ Using Secret Manager authentication');
    
  } catch (error) {
    console.log('⚠️ Secret Manager not available, trying file-based auth');
    
    try {
      storage = new Storage({
        keyFilename: './packages/api/Cloud Functions/document-service/config/GCS-Prod.json',
        projectId: 'pacdocv2-api-prod'
      });
      
      console.log('✅ Using file-based authentication');
      
    } catch (fileError) {
      console.log('❌ Both authentication methods failed');
      throw new Error('Cannot initialize storage');
    }
  }

  // Test file access
  const testFiles = [
    'borrower/13040000/test-document.pdf',
    'borrower/13050000/loan-document.pdf',
    'signers/drivers-license/test-id.pdf',
    'signers/passport/test-passport.pdf'
  ];

  let accessibleFiles = 0;

  for (const filePath of testFiles) {
    try {
      const file = storage.bucket('pacdoc').file(filePath);
      const [exists] = await file.exists();
      
      if (exists) {
        const [metadata] = await file.getMetadata();
        accessibleFiles++;
        console.log(`✅ ${filePath}: Accessible (${metadata.size} bytes)`);
      } else {
        console.log(`⚠️ ${filePath}: Not found`);
      }
      
    } catch (error) {
      console.log(`❌ ${filePath}: Error - ${error.message}`);
    }
  }

  // Test CSEK functionality
  console.log('\n🔐 Testing CSEK functionality...');
  
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    const CSEK = version.payload?.data?.toString();
    const testFile = 'borrower/13040000/test-encrypted.pdf';
    
    const file = storage
      .bucket('pacdoc')
      .file(testFile)
      .setEncryptionKey(Buffer.from(CSEK, 'base64'));

    const [metadata] = await file.getMetadata();
    console.log(`✅ CSEK functionality: Working (${metadata.size} bytes)`);
    
  } catch (error) {
    console.log(`⚠️ CSEK functionality: ${error.message}`);
  }

  // Test file operations
  console.log('\n📁 Testing file operations...');
  
  const testFileName = `test/verify-access-${Date.now()}.txt`;
  const testContent = 'File access verification test';
  
  try {
    const file = storage.bucket('pacdoc').file(testFileName);
    
    // Upload
    await file.save(testContent);
    console.log('✅ File upload: Working');
    
    // Download
    const [fileContent] = await file.download();
    if (fileContent.toString() === testContent) {
      console.log('✅ File download: Working');
    } else {
      console.log('❌ File download: Content mismatch');
    }
    
    // Delete
    await file.delete();
    console.log('✅ File deletion: Working');
    
  } catch (error) {
    console.log(`❌ File operations: ${error.message}`);
  }

  console.log('============================');
  console.log(`📊 Results: ${accessibleFiles}/${testFiles.length} files accessible`);
  
  if (accessibleFiles > 0) {
    console.log('✅ File access is working!');
    process.exit(0);
  } else {
    console.log('❌ File access is not working!');
    process.exit(1);
  }
}

// Run verification
verifyFileAccess().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});

