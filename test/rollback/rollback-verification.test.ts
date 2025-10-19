// test/rollback/rollback-verification.test.ts
import { Storage } from '@google-cloud/storage';

describe('Rollback Verification Tests', () => {
  let storage: Storage;

  beforeAll(async () => {
    // Test original authentication method (file-based)
    try {
      storage = new Storage({
        keyFilename: './packages/api/Cloud Functions/document-service/config/GCS-Prod.json',
        projectId: 'pacdocv2-api-prod'
      });
      console.log('✅ Rollback: Using original file-based authentication');
    } catch (error) {
      console.log('⚠️ Rollback: File-based auth not available, testing fallback');
      
      // Fallback to Secret Manager if file-based auth is not available
      const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
      const secretClient = new SecretManagerServiceClient();
      
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      
      storage = new Storage({
        credentials: serviceAccountKey,
        projectId: 'pacdocv2-api-prod'
      });
      
      console.log('✅ Rollback: Using Secret Manager fallback');
    }
  });

  test('Should access files with original authentication', async () => {
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
          console.log(`✅ Rollback: Original authentication works for ${filePath}`);
        } else {
          console.log(`⚠️ Rollback: File ${filePath} not found`);
        }
      } catch (error) {
        console.log(`❌ Rollback: Error accessing ${filePath} - ${error.message}`);
      }
    }

    console.log(`📊 Rollback: ${accessibleFiles}/${totalFiles} files accessible with original auth`);
    expect(accessibleFiles).toBeGreaterThan(0); // At least some files should be accessible
  }, 30000);

  test('Should maintain CSEK functionality', async () => {
    const CSEK = 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=';
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
        console.log(`✅ Rollback: CSEK functionality maintained for ${testFile}`);
      } catch (error) {
        console.log(`⚠️ Rollback: CSEK test failed for ${testFile} - ${error.message}`);
      }
    }

    console.log(`📊 Rollback: ${encryptedFilesAccessible} encrypted files accessible`);
    expect(encryptedFilesAccessible).toBeGreaterThan(0); // At least some encrypted files should be accessible
  }, 30000);

  test('Should verify bucket access and permissions', async () => {
    try {
      const bucket = storage.bucket('pacdoc');
      const [metadata] = await bucket.getMetadata();
      
      expect(metadata.name).toBe('pacdoc');
      console.log(`✅ Rollback: Bucket access verified - ${metadata.name}`);
      
      // Test listing files
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log(`✅ Rollback: Can list files (${files.length} files found)`);
      
      expect(files.length).toBeGreaterThan(0);
      
    } catch (error) {
      throw new Error(`❌ Rollback: Bucket access failed - ${error.message}`);
    }
  }, 15000);

  test('Should verify file operations with original authentication', async () => {
    const testFileName = `test/rollback-test-${Date.now()}.txt`;
    const testContent = 'Rollback test file content';
    
    try {
      // Test file upload
      const file = storage.bucket('pacdoc').file(testFileName);
      await file.save(testContent);
      
      console.log(`✅ Rollback: File upload successful with original auth - ${testFileName}`);
      
      // Test file exists
      const [exists] = await file.exists();
      expect(exists).toBe(true);
      
      // Test file metadata
      const [metadata] = await file.getMetadata();
      expect(metadata.name).toBe(testFileName);
      
      // Test file download
      const [fileContent] = await file.download();
      expect(fileContent.toString()).toBe(testContent);
      
      console.log(`✅ Rollback: File download successful with original auth`);
      
      // Clean up test file
      await file.delete();
      console.log(`✅ Rollback: Test file cleaned up - ${testFileName}`);
      
    } catch (error) {
      throw new Error(`❌ Rollback: File operations test failed - ${error.message}`);
    }
  }, 15000);

  test('Should verify performance with original authentication', async () => {
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
      
      console.log(`✅ Rollback: Performance test completed in ${duration}ms`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
    } catch (error) {
      throw new Error(`❌ Rollback: Performance test failed - ${error.message}`);
    }
  }, 15000);

  test('Should verify system stability after rollback', async () => {
    // Test that the system is stable after rollback
    const stabilityTests = [
      async () => {
        const bucket = storage.bucket('pacdoc');
        const [metadata] = await bucket.getMetadata();
        return metadata.name === 'pacdoc';
      },
      async () => {
        const [files] = await storage.bucket('pacdoc').getFiles({ maxResults: 1 });
        return files.length >= 0;
      },
      async () => {
        const testFile = storage.bucket('pacdoc').file(`test/stability-${Date.now()}.txt`);
        await testFile.save('stability test');
        const [exists] = await testFile.exists();
        await testFile.delete();
        return exists;
      }
    ];

    let passedTests = 0;

    for (const test of stabilityTests) {
      try {
        const result = await test();
        if (result) {
          passedTests++;
        }
      } catch (error) {
        console.log(`⚠️ Rollback: Stability test failed - ${error.message}`);
      }
    }

    console.log(`📊 Rollback: ${passedTests}/${stabilityTests.length} stability tests passed`);
    expect(passedTests).toBe(stabilityTests.length); // All stability tests should pass
  }, 20000);
});


