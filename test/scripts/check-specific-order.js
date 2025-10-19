const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function checkSpecificOrder() {
  console.log('🔍 Checking specific order ID 2161928...');
  console.log('===============================================================');

  const secretClient = new SecretManagerServiceClient();
  let storage;

  try {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    console.log('✅ Secret Manager authentication successful');
  } catch (error) {
    console.error('❌ Failed to initialize storage with Secret Manager:', error.message);
    process.exit(1);
  }

  const bucketName = 'pacdoc';

  try {
    // Check if order 2161928 exists in any folder structure
    console.log('🔍 Checking for order 2161928 in various folder structures...');
    
    const possiblePaths = [
      'borrower/2161928/',
      'client/2161928/',
      'customer/2161928/',
      'signed/2161928/',
      'signers/2161928/'
    ];

    for (const path of possiblePaths) {
      try {
        const [files] = await storage.bucket(bucketName).getFiles({
          prefix: path
        });
        
        if (files.length > 0) {
          console.log(`✅ Found ${files.length} files in ${path}`);
          files.forEach(file => {
            console.log(`   - ${file.name}`);
          });
        } else {
          console.log(`❌ No files found in ${path}`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${path}: ${error.message}`);
      }
    }

    // Also check if there are any files with 2161928 in the name
    console.log('\n🔍 Checking for files containing "2161928" in the name...');
    const [allFiles] = await storage.bucket(bucketName).getFiles();
    const matchingFiles = allFiles.filter(file => file.name.includes('2161928'));
    
    if (matchingFiles.length > 0) {
      console.log(`✅ Found ${matchingFiles.length} files containing "2161928":`);
      matchingFiles.forEach(file => {
        console.log(`   - ${file.name}`);
      });
    } else {
      console.log('❌ No files found containing "2161928"');
    }

  } catch (error) {
    console.error('❌ Error checking specific order:', error.message);
  }
}

checkSpecificOrder().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

