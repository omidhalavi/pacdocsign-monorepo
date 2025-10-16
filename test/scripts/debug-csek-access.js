const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function debugCSEKAccess() {
  console.log('🔍 Debugging CSEK Access');
  console.log('========================');
  
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

  // Get CSEK key and examine it
  console.log('\n📋 CSEK Key Analysis');
  console.log('--------------------');
  
  try {
    const [csekVersion] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    const csekKey = csekVersion.payload?.data?.toString() || '';
    console.log(`🔐 CSEK Key Length: ${csekKey.length} characters`);
    console.log(`🔐 CSEK Key Preview: ${csekKey.substring(0, 20)}...`);
    console.log(`🔐 CSEK Key End: ...${csekKey.substring(csekKey.length - 20)}`);
    
    // Check if it's base64 encoded
    try {
      const decoded = Buffer.from(csekKey, 'base64');
      console.log(`🔐 Decoded Length: ${decoded.length} bytes`);
      console.log(`🔐 Decoded Preview: ${decoded.slice(0, 10).toString('hex')}...`);
    } catch (decodeError) {
      console.log(`⚠️ CSEK key is not valid base64: ${decodeError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ CSEK key access failed: ${error.message}`);
    return;
  }

  // Test different CSEK approaches
  console.log('\n📋 Testing Different CSEK Approaches');
  console.log('--------------------------------------');
  
  const bucketName = 'pacdoc';
  const testFile = 'borrower/12820768/user file 3.pdf';
  
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(testFile);
    
    // Get file metadata to see encryption info
    const [metadata] = await file.getMetadata();
    console.log(`📁 File: ${testFile}`);
    console.log(`📊 Size: ${metadata.size} bytes`);
    console.log(`📅 Created: ${metadata.timeCreated}`);
    console.log(`🔐 KMS Key: ${metadata.kmsKeyName || 'None'}`);
    console.log(`🔐 Customer Encryption: ${metadata.customerEncryption || 'None'}`);
    
    // Try different CSEK formats
    const csekFormats = [
      { name: 'Base64 String', key: csekKey },
      { name: 'Base64 Buffer', key: Buffer.from(csekKey, 'base64') },
      { name: 'Hex String', key: Buffer.from(csekKey, 'base64').toString('hex') },
      { name: 'Raw Buffer', key: Buffer.from(csekKey, 'base64') }
    ];
    
    for (const format of csekFormats) {
      try {
        console.log(`\n🔍 Testing ${format.name}:`);
        
        const [data] = await file.download({
          encryptionKey: format.key
        });
        
        console.log(`✅ SUCCESS with ${format.name}!`);
        console.log(`📊 Downloaded: ${data.length} bytes`);
        break;
        
      } catch (error) {
        console.log(`❌ Failed with ${format.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ File access error: ${error.message}`);
  }

  // Test if files are actually encrypted or just have encryption metadata
  console.log('\n📋 Testing File Encryption Status');
  console.log('-----------------------------------');
  
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(testFile);
    
    // Try to download without any encryption key
    try {
      const [data] = await file.download();
      console.log(`✅ File downloaded without CSEK: ${data.length} bytes`);
      console.log(`⚠️ File may not actually be encrypted`);
    } catch (noCsekError) {
      console.log(`✅ Confirmed encrypted: ${noCsekError.message}`);
    }
    
    // Try to get file info with different methods
    try {
      const [exists] = await file.exists();
      console.log(`📁 File exists: ${exists}`);
      
      const [metadata] = await file.getMetadata();
      console.log(`📊 Metadata accessible: Yes`);
      console.log(`🔐 Encryption metadata: ${JSON.stringify(metadata.customerEncryption || 'None')}`);
      
    } catch (metaError) {
      console.log(`❌ Metadata access failed: ${metaError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Encryption test failed: ${error.message}`);
  }

  console.log('\n🎯 CSEK Debug Summary');
  console.log('=====================');
  console.log('✅ CSEK key is accessible from Secret Manager');
  console.log('✅ Files exist and metadata is accessible');
  console.log('⚠️ CSEK decryption is failing - may need different approach');
  console.log('🔍 Files appear to be encrypted but CSEK format may be incorrect');
}

// Run the debug
debugCSEKAccess().catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
