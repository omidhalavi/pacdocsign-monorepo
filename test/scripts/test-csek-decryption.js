const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function testCSEKDecryption() {
  console.log('🔐 Testing CSEK Decryption Methods');
  console.log('==================================');
  
  const secretClient = new SecretManagerServiceClient();
  let storage;
  
  // Initialize storage
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    
    console.log('✅ Storage initialized');
  } catch (error) {
    console.error('❌ Storage initialization failed:', error.message);
    return;
  }

  // Get CSEK key
  let csekKey;
  try {
    const [csekVersion] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    csekKey = csekVersion.payload?.data?.toString() || '';
    console.log('✅ CSEK key retrieved');
  } catch (error) {
    console.error(`❌ CSEK key access failed: ${error.message}`);
    return;
  }

  // Test different CSEK decryption approaches
  const bucketName = 'pacdoc';
  const testFile = 'borrower/12820768/user file 3.pdf';
  
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(testFile);
    
    console.log(`\n📁 Testing file: ${testFile}`);
    
    // Method 1: Direct buffer
    try {
      console.log('\n🔍 Method 1: Direct Buffer');
      const encryptionKey = Buffer.from(csekKey, 'base64');
      const [data] = await file.download({
        encryptionKey: encryptionKey
      });
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    // Method 2: String key
    try {
      console.log('\n🔍 Method 2: String Key');
      const [data] = await file.download({
        encryptionKey: csekKey
      });
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    // Method 3: Uint8Array
    try {
      console.log('\n🔍 Method 3: Uint8Array');
      const encryptionKey = new Uint8Array(Buffer.from(csekKey, 'base64'));
      const [data] = await file.download({
        encryptionKey: encryptionKey
      });
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    // Method 4: Using file.get() with encryption
    try {
      console.log('\n🔍 Method 4: file.get() with encryption');
      const encryptionKey = Buffer.from(csekKey, 'base64');
      const [data] = await file.get({
        encryptionKey: encryptionKey
      });
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    // Method 5: Create file with encryption key
    try {
      console.log('\n🔍 Method 5: Create file with encryption key');
      const encryptionKey = Buffer.from(csekKey, 'base64');
      const encryptedFile = bucket.file(testFile, { encryptionKey: encryptionKey });
      const [data] = await encryptedFile.download();
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
    // Method 6: Try with different bucket initialization
    try {
      console.log('\n🔍 Method 6: Different bucket initialization');
      const encryptionKey = Buffer.from(csekKey, 'base64');
      const encryptedBucket = storage.bucket(bucketName, { encryptionKey: encryptionKey });
      const encryptedFile = encryptedBucket.file(testFile);
      const [data] = await encryptedFile.download();
      console.log(`✅ Success: ${data.length} bytes`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Test setup error: ${error.message}`);
  }
}

// Run the test
testCSEKDecryption().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
