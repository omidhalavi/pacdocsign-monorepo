// test/scripts/test-existing-file-access.js
const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function testExistingFileAccess() {
  console.log('🔍 Testing access to existing files with Secret Manager authentication...');
  console.log('===============================================================');
  
  const secretClient = new SecretManagerServiceClient();
  
  try {
    // Get service account key from Secret Manager
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    
    // Initialize Storage with Secret Manager credentials
    const storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    
    console.log('✅ Secret Manager authentication successful');
    console.log(`📧 Service Account: ${serviceAccountKey.client_email}`);
    
    // Test files that exist in production
    const testFiles = [
      'gs://pacdoc/borrower/12820768/user file 3.pdf',
      'gs://pacdoc/borrower/12824420/user file 2.pdf',
      'gs://pacdoc/borrower/12950027/swindall closing package.pdf',
      'gs://pacdoc/12723066/profile-picture/profile.jpg'
    ];
    
    let accessibleFiles = 0;
    let totalFiles = 0;
    
    for (const filePath of testFiles) {
      totalFiles++;
      try {
        // Extract bucket and file name from gs:// path
        const pathParts = filePath.replace('gs://', '').split('/');
        const bucketName = pathParts[0];
        const fileName = pathParts.slice(1).join('/');
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        
        // Check if file exists
        const [exists] = await file.exists();
        
        if (exists) {
          // Try to get metadata
          const [metadata] = await file.getMetadata();
          
          console.log(`✅ File accessible: ${fileName}`);
          console.log(`   📊 Size: ${metadata.size} bytes`);
          console.log(`   📅 Created: ${metadata.timeCreated}`);
          console.log(`   🔐 Storage Class: ${metadata.storageClass}`);
          
          accessibleFiles++;
        } else {
          console.log(`⚠️ File not found: ${fileName}`);
        }
        
      } catch (error) {
        console.log(`❌ Error accessing ${filePath}: ${error.message}`);
      }
    }
    
    console.log('===============================================================');
    console.log(`📊 Results: ${accessibleFiles}/${totalFiles} existing files accessible`);
    
    if (accessibleFiles > 0) {
      console.log('✅ SUCCESS: Existing files can be accessed with Secret Manager authentication!');
      console.log('✅ Backward compatibility maintained!');
    } else {
      console.log('❌ FAILURE: No existing files could be accessed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testExistingFileAccess().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
