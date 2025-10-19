// test/scripts/verify-secrets.js
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

async function verifySecrets() {
  console.log('🔍 Verifying Secret Manager access...');
  console.log('=====================================');
  
  const secretClient = new SecretManagerServiceClient();
  const secrets = [
    {
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key',
      description: 'Production Service Account Key'
    },
    {
      name: 'projects/docstorage-286015/secrets/gcs-service-account-key',
      description: 'Development Service Account Key'
    },
    {
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key',
      description: 'CSEK Encryption Key'
    }
  ];

  let accessibleSecrets = 0;

  for (const secret of secrets) {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: `${secret.name}/versions/latest`
      });
      
      const secretData = version.payload?.data?.toString();
      
      if (secretData) {
        accessibleSecrets++;
        console.log(`✅ ${secret.description}: Accessible`);
        
        // For service account keys, parse and show email
        if (secret.name.includes('service-account-key')) {
          try {
            const serviceAccountKey = JSON.parse(secretData);
            console.log(`   📧 Service Account: ${serviceAccountKey.client_email}`);
            console.log(`   🆔 Project ID: ${serviceAccountKey.project_id}`);
          } catch (e) {
            console.log(`   ⚠️ Could not parse service account key`);
          }
        }
        
        // For CSEK, show partial key
        if (secret.name.includes('csek-key')) {
          console.log(`   🔐 CSEK: ${secretData.substring(0, 10)}...`);
        }
      } else {
        console.log(`❌ ${secret.description}: No data found`);
      }
      
    } catch (error) {
      console.log(`❌ ${secret.description}: ${error.message}`);
    }
  }

  console.log('=====================================');
  console.log(`📊 Results: ${accessibleSecrets}/${secrets.length} secrets accessible`);
  
  if (accessibleSecrets === secrets.length) {
    console.log('✅ All secrets are accessible!');
    process.exit(0);
  } else {
    console.log('❌ Some secrets are not accessible!');
    process.exit(1);
  }
}

// Run verification
verifySecrets().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});


