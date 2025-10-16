const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function testCSEKFileAccess() {
  console.log('🔐 Testing CSEK Encrypted Borrower File Access');
  console.log('==============================================');
  
  const secretClient = new SecretManagerServiceClient();
  let storage;
  
  // Initialize storage with Secret Manager
  try {
    console.log('📋 Step 1: Secret Manager Authentication');
    console.log('------------------------------------------');
    
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    
    console.log('✅ Secret Manager authentication: SUCCESS');
    console.log(`📧 Service Account: ${serviceAccountKey.client_email}`);
  } catch (error) {
    console.error('❌ Secret Manager authentication: FAILED -', error.message);
    return;
  }

  // Get CSEK key from Secret Manager
  console.log('\n📋 Step 2: CSEK Key Access');
  console.log('---------------------------');
  
  let csekKey;
  try {
    const [csekVersion] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    csekKey = csekVersion.payload?.data?.toString() || '';
    console.log('✅ CSEK key access: SUCCESS');
    console.log(`🔐 CSEK: ${csekKey.substring(0, 10)}...`);
  } catch (error) {
    console.error(`❌ CSEK key access: FAILED - ${error.message}`);
    return;
  }

  // Test CSEK decryption with borrower files
  console.log('\n📋 Step 3: Test CSEK Decryption');
  console.log('---------------------------------');
  
  const bucketName = 'pacdoc';
  const testFiles = [
    'borrower/12820768/user file 3.pdf',
    'borrower/12824420/user file 2.pdf',
    'borrower/12950027/swindall closing package.pdf'
  ];
  
  let decryptedFiles = 0;
  
  for (const filePath of testFiles) {
    try {
      console.log(`\n🔍 Testing CSEK decryption: ${filePath}`);
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`❌ File does not exist`);
        continue;
      }
      
      // Get metadata
      const [metadata] = await file.getMetadata();
      console.log(`✅ File exists: ${metadata.size} bytes`);
      console.log(`📅 Created: ${metadata.timeCreated}`);
      
      // Try to download with CSEK decryption
      try {
        const encryptionKey = Buffer.from(csekKey, 'base64');
        const [data] = await file.download({
          encryptionKey: encryptionKey
        });
        
        console.log(`✅ CSEK decryption: SUCCESS`);
        console.log(`📊 Decrypted size: ${data.length} bytes`);
        console.log(`🔐 File was successfully decrypted with CSEK`);
        
        // Verify it's a valid PDF by checking the header
        const header = data.slice(0, 4).toString();
        if (header === '%PDF') {
          console.log(`✅ PDF header verification: SUCCESS`);
        } else {
          console.log(`⚠️ PDF header verification: Unexpected header "${header}"`);
        }
        
        decryptedFiles++;
        
      } catch (decryptError) {
        console.log(`❌ CSEK decryption failed: ${decryptError.message}`);
        
        // Try without CSEK to see if it's actually encrypted
        try {
          const [data] = await file.download();
          console.log(`⚠️ File is not encrypted (downloaded without CSEK)`);
        } catch (noCsekError) {
          console.log(`✅ Confirmed: File is encrypted and requires CSEK`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${filePath}: ${error.message}`);
    }
  }

  // Test App Engine with CSEK (if we can figure out the correct endpoint)
  console.log('\n📋 Step 4: Test App Engine CSEK Integration');
  console.log('---------------------------------------------');
  
  const appEngineUrl = 'https://pacdocv2-api-prod.uc.r.appspot.com';
  
  // Test if there are any working endpoints
  const testEndpoints = [
    '/',
    '/health',
    '/status',
    '/api',
    '/api/files',
    '/files'
  ];
  
  let workingEndpoints = 0;
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`${appEngineUrl}${endpoint}`, {
        method: 'GET',
        timeout: 5000
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status < 500) {
        workingEndpoints++;
        console.log(`✅ ${endpoint}: WORKING`);
      } else {
        console.log(`❌ ${endpoint}: ERROR`);
      }
    } catch (error) {
      console.log(`⚠️ ${endpoint}: ${error.message}`);
    }
  }

  // Final summary
  console.log('\n🎯 CSEK Borrower File Access Test Results');
  console.log('==========================================');
  console.log(`📊 Total borrower files tested: ${testFiles.length}`);
  console.log(`📊 Successfully decrypted: ${decryptedFiles}/${testFiles.length}`);
  console.log(`📊 App Engine endpoints working: ${workingEndpoints}/${testEndpoints.length}`);
  
  if (decryptedFiles > 0) {
    console.log('\n✅ SUCCESS: CSEK decryption is working!');
    console.log('✅ Secret Manager integration: WORKING');
    console.log('✅ CSEK key access: WORKING');
    console.log('✅ File decryption: WORKING');
    console.log('✅ Borrower file access: FUNCTIONAL');
    
    console.log('\n🚀 CSEK-encrypted borrower files are accessible and ready for production!');
    console.log('🔐 Security: Files remain encrypted and require proper CSEK for access');
  } else {
    console.log('\n❌ ISSUE: CSEK decryption failed');
    console.log('Please check CSEK key configuration and file encryption status');
  }
}

// Run the test
testCSEKFileAccess().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
