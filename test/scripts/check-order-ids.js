const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function checkOrderIds() {
  console.log('🔍 Checking order IDs in the bucket...');
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
  const orderIds = new Set();

  try {
    // Get all files in borrower/ folder (including subdirectories)
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: 'borrower/'
    });

    console.log(`📁 Found ${files.length} files in borrower/ folder`);

    // Extract order IDs from file paths
    for (const file of files) {
      const pathParts = file.name.split('/');
      if (pathParts.length >= 2 && pathParts[0] === 'borrower') {
        const orderId = parseInt(pathParts[1]);
        if (!isNaN(orderId)) {
          orderIds.add(orderId);
        }
      }
    }

    // Convert to array and sort
    const sortedOrderIds = Array.from(orderIds).sort((a, b) => a - b);
    
    console.log('📊 Order ID Statistics:');
    console.log(`   Total unique order IDs: ${sortedOrderIds.length}`);
    console.log(`   Lowest order ID: ${sortedOrderIds[0]}`);
    console.log(`   Highest order ID: ${sortedOrderIds[sortedOrderIds.length - 1]}`);
    
    // Check if 2161928 exists
    if (orderIds.has(2161928)) {
      console.log('✅ Order ID 2161928 EXISTS in the bucket');
      
      // Check files for this specific order
      const [orderFiles] = await storage.bucket(bucketName).getFiles({
        prefix: 'borrower/2161928/',
        delimiter: '/'
      });
      
      console.log(`📄 Files for order 2161928: ${orderFiles.length}`);
      orderFiles.forEach(file => {
        console.log(`   - ${file.name}`);
      });
    } else {
      console.log('❌ Order ID 2161928 NOT FOUND in the bucket');
    }

    // Show recent order IDs
    console.log('\n📋 Recent Order IDs (last 10):');
    sortedOrderIds.slice(-10).forEach(id => {
      console.log(`   ${id}`);
    });

  } catch (error) {
    console.error('❌ Error checking order IDs:', error.message);
  }
}

checkOrderIds().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
