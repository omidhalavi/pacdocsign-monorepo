const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const crypto = require('crypto');

async function verifyCSEKKey() {
  console.log('🔐 Verifying CSEK Key');
  console.log('=====================');
  
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
    console.log(`🔐 Key length: ${csekKey.length} characters`);
  } catch (error) {
    console.error(`❌ CSEK key access failed: ${error.message}`);
    return;
  }

  // Test with a borrower file
  const bucketName = 'pacdoc';
  const testFile = 'borrower/12820768/user file 3.pdf';
  
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(testFile);
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    console.log(`\n📁 File: ${testFile}`);
    console.log(`📊 Size: ${metadata.size} bytes`);
    
    if (metadata.customerEncryption) {
      console.log(`🔐 Encryption: ${metadata.customerEncryption.encryptionAlgorithm}`);
      console.log(`🔐 Key SHA256: ${metadata.customerEncryption.keySha256}`);
      
      // Calculate SHA256 of our CSEK key
      const csekBuffer = Buffer.from(csekKey, 'base64');
      const csekSha256 = crypto.createHash('sha256').update(csekBuffer).digest('base64');
      
      console.log(`🔐 Our CSEK SHA256: ${csekSha256}`);
      console.log(`🔐 File CSEK SHA256: ${metadata.customerEncryption.keySha256}`);
      
      if (csekSha256 === metadata.customerEncryption.keySha256) {
        console.log('✅ CSEK keys match!');
        
        // Try to download with the correct CSEK
        try {
          const [data] = await file.download({
            encryptionKey: csekBuffer
          });
          
          console.log(`✅ File downloaded successfully: ${data.length} bytes`);
          
          // Verify PDF header
          const header = data.slice(0, 4).toString();
          if (header === '%PDF') {
            console.log('✅ PDF header verification: SUCCESS');
            console.log('🎉 CSEK decryption is working correctly!');
          } else {
            console.log(`⚠️ PDF header verification: Unexpected header "${header}"`);
          }
          
        } catch (downloadError) {
          console.log(`❌ Download failed: ${downloadError.message}`);
        }
        
      } else {
        console.log('❌ CSEK keys do not match!');
        console.log('🔍 The files were encrypted with a different CSEK key');
        console.log('💡 We need to find the correct CSEK key or re-encrypt the files');
      }
    }
    
  } catch (error) {
    console.error(`❌ File access error: ${error.message}`);
  }
}

// Run the verification
verifyCSEKKey().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
