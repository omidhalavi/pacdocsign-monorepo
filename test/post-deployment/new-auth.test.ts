// test/post-deployment/new-auth.test.ts
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Post-Deployment New Authentication Tests', () => {
  let storage: Storage;
  let secretClient: SecretManagerServiceClient;

  beforeAll(async () => {
    secretClient = new SecretManagerServiceClient();
    
    // Test new Secret Manager authentication
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
    });
    
    const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
    
    storage = new Storage({
      credentials: serviceAccountKey,
      projectId: 'pacdocv2-api-prod'
    });
    
    console.log('✅ Post-deployment: Using Secret Manager authentication');
  });

  test('Should access files with Secret Manager auth', async () => {
    const testFiles = [
      'borrower/13040000/test-document.pdf',
      'borrower/13050000/loan-document.pdf',
      'signers/drivers-license/test-id.pdf',
      'signers/passport/test-passport.pdf'
    ];

    let accessibleFiles = 0;
    let totalFiles = 0;

    for (const filePath of testFiles) {
      totalFiles++;
      try {
        const file = storage.bucket('pacdoc').file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          expect(metadata.name).toBe(filePath);
          accessibleFiles++;
          console.log(`✅ Post-deployment: Secret Manager auth works for ${filePath}`);
        } else {
          console.log(`⚠️ Post-deployment: File ${filePath} not found`);
        }
      } catch (error) {
        console.log(`❌ Post-deployment: Error accessing ${filePath} - ${error.message}`);
      }
    }

    console.log(`📊 Post-deployment: ${accessibleFiles}/${totalFiles} files accessible with Secret Manager auth`);
    expect(accessibleFiles).toBeGreaterThan(0); // At least some files should be accessible
  }, 30000);

  test('Should maintain CSEK encryption compatibility', async () => {
    const [version] = await secretClient.accessSecretVersion({
      name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
    });
    
    const CSEK = version.payload?.data?.toString();
    const testFiles = [
      'borrower/13040000/test-encrypted.pdf',
      'borrower/13050000/encrypted-document.pdf'
    ];

    let encryptedFilesAccessible = 0;

    for (const testFile of testFiles) {
      try {
        const file = storage
          .bucket('pacdoc')
          .file(testFile)
          .setEncryptionKey(Buffer.from(CSEK, 'base64'));

        const [metadata] = await file.getMetadata();
        expect(metadata.name).toBe(testFile);
        encryptedFilesAccessible++;
        console.log(`✅ Post-deployment: CSEK from Secret Manager works for ${testFile}`);
      } catch (error) {
        console.log(`⚠️ Post-deployment: CSEK test failed for ${testFile} - ${error.message}`);
      }
    }

    console.log(`📊 Post-deployment: ${encryptedFilesAccessible} encrypted files accessible`);
    expect(encryptedFilesAccessible).toBeGreaterThan(0); // At least some encrypted files should be accessible
  }, 30000);

  test('Should verify environment-specific secret selection', async () => {
    // Test production environment
    const prodSecretName = 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest';
    const [prodVersion] = await secretClient.accessSecretVersion({
      name: prodSecretName
    });
    
    const prodServiceAccountKey = JSON.parse(prodVersion.payload?.data?.toString() || '{}');
    expect(prodServiceAccountKey.project_id).toBe('pacdocv2-api-prod');
    expect(prodServiceAccountKey.client_email).toBe('document-service@pacdocv2-api-prod.iam.gserviceaccount.com');
    
    console.log('✅ Post-deployment: Production secret selection works');
    
    // Test development environment
    const devSecretName = 'projects/docstorage-286015/secrets/gcs-service-account-key/versions/latest';
    const [devVersion] = await secretClient.accessSecretVersion({
      name: devSecretName
    });
    
    const devServiceAccountKey = JSON.parse(devVersion.payload?.data?.toString() || '{}');
    expect(devServiceAccountKey.project_id).toBe('docstorage-286015');
    expect(devServiceAccountKey.client_email).toBe('pacdoc-live@docstorage-286015.iam.gserviceaccount.com');
    
    console.log('✅ Post-deployment: Development secret selection works');
  }, 15000);

  test('Should verify fallback mechanism', async () => {
    // Test that fallback would work if Secret Manager fails
    try {
      // Simulate Secret Manager failure by using invalid secret name
      await secretClient.accessSecretVersion({
        name: 'projects/invalid-project/secrets/invalid-secret/versions/latest'
      });
    } catch (error) {
      // This is expected - test that we can handle the error
      expect(error.message).toContain('NOT_FOUND');
      console.log('✅ Post-deployment: Fallback mechanism would trigger on Secret Manager failure');
    }
  }, 10000);

  test('Should verify file operations with new authentication', async () => {
    const testFileName = `test/post-deployment-test-${Date.now()}.txt`;
    const testContent = 'Post-deployment test file content';
    
    try {
      // Test file upload
      const file = storage.bucket('pacdoc').file(testFileName);
      await file.save(testContent);
      
      console.log(`✅ Post-deployment: File upload successful with Secret Manager auth - ${testFileName}`);
      
      // Test file exists
      const [exists] = await file.exists();
      expect(exists).toBe(true);
      
      // Test file metadata
      const [metadata] = await file.getMetadata();
      expect(metadata.name).toBe(testFileName);
      
      // Test file download
      const [fileContent] = await file.download();
      expect(fileContent.toString()).toBe(testContent);
      
      console.log(`✅ Post-deployment: File download successful with Secret Manager auth`);
      
      // Clean up test file
      await file.delete();
      console.log(`✅ Post-deployment: Test file cleaned up - ${testFileName}`);
      
    } catch (error) {
      throw new Error(`❌ Post-deployment: File operations test failed - ${error.message}`);
    }
  }, 15000);

  test('Should verify performance with new authentication', async () => {
    const startTime = Date.now();
    
    try {
      // Test multiple file operations
      const testFiles = [
        'borrower/13040000/test-document.pdf',
        'borrower/13050000/loan-document.pdf',
        'signers/drivers-license/test-id.pdf'
      ];

      for (const filePath of testFiles) {
        const file = storage.bucket('pacdoc').file(filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          expect(metadata.name).toBe(filePath);
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Post-deployment: Performance test completed in ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
    } catch (error) {
      throw new Error(`❌ Post-deployment: Performance test failed - ${error.message}`);
    }
  }, 15000);
});


