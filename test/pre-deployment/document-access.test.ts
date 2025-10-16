// test/pre-deployment/document-access.test.ts
import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Pre-Deployment Document Access Tests', () => {
  let storage: Storage;
  let secretClient: SecretManagerServiceClient;

  beforeAll(async () => {
    secretClient = new SecretManagerServiceClient();
    
    // Test current authentication method (file-based)
    try {
      storage = new Storage({
        keyFilename: './packages/api/Cloud Functions/document-service/config/GCS-Prod.json',
        projectId: 'pacdocv2-api-prod'
      });
      console.log('✅ Pre-deployment: Using file-based authentication');
    } catch (error) {
      console.log('⚠️ Pre-deployment: File-based auth not available, testing Secret Manager');
      
      // Fallback to Secret Manager for testing
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      
      storage = new Storage({
        credentials: serviceAccountKey,
        projectId: 'pacdocv2-api-prod'
      });
      console.log('✅ Pre-deployment: Using Secret Manager authentication');
    }
  });

  test('Should access existing borrower documents', async () => {
    const testFiles = [
      'borrower/13040000/test-document.pdf',
      'borrower/13050000/loan-document.pdf',
      'borrower/13052258/final-document.pdf'
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
          console.log(`✅ Pre-deployment: Can access ${filePath}`);
        } else {
          console.log(`⚠️ Pre-deployment: File ${filePath} not found`);
        }
      } catch (error) {
        console.log(`❌ Pre-deployment: Error accessing ${filePath} - ${error.message}`);
      }
    }

    console.log(`📊 Pre-deployment: ${accessibleFiles}/${totalFiles} borrower files accessible`);
    expect(accessibleFiles).toBeGreaterThan(0); // At least some files should be accessible
  }, 30000);

  test('Should access existing signer documents', async () => {
    const testFiles = [
      'signers/drivers-license/test-id.pdf',
      'signers/passport/test-passport.pdf',
      'signers/insurance/test-insurance.pdf'
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
          console.log(`✅ Pre-deployment: Can access ${filePath}`);
        } else {
          console.log(`⚠️ Pre-deployment: File ${filePath} not found`);
        }
      } catch (error) {
        console.log(`❌ Pre-deployment: Error accessing ${filePath} - ${error.message}`);
      }
    }

    console.log(`📊 Pre-deployment: ${accessibleFiles}/${totalFiles} signer files accessible`);
    expect(accessibleFiles).toBeGreaterThan(0); // At least some files should be accessible
  }, 30000);

  test('Should verify CSEK encryption works', async () => {
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
        console.log(`✅ Pre-deployment: CSEK encryption works for ${testFile}`);
      } catch (error) {
        console.log(`⚠️ Pre-deployment: CSEK test failed for ${testFile} - ${error.message}`);
      }
    }

    console.log(`📊 Pre-deployment: ${encryptedFilesAccessible} encrypted files accessible`);
    expect(encryptedFilesAccessible).toBeGreaterThan(0); // At least some encrypted files should be accessible
  }, 30000);

  test('Should verify bucket access and permissions', async () => {
    try {
      const bucket = storage.bucket('pacdoc');
      const [metadata] = await bucket.getMetadata();
      
      expect(metadata.name).toBe('pacdoc');
      console.log(`✅ Pre-deployment: Bucket access verified - ${metadata.name}`);
      
      // Test listing files
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log(`✅ Pre-deployment: Can list files (${files.length} files found)`);
      
      expect(files.length).toBeGreaterThan(0);
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Bucket access failed - ${error.message}`);
    }
  }, 15000);

  test('Should verify file upload capability', async () => {
    const testFileName = `test/pre-deployment-test-${Date.now()}.txt`;
    const testContent = 'Pre-deployment test file content';
    
    try {
      const file = storage.bucket('pacdoc').file(testFileName);
      await file.save(testContent);
      
      console.log(`✅ Pre-deployment: File upload successful - ${testFileName}`);
      
      // Verify file exists
      const [exists] = await file.exists();
      expect(exists).toBe(true);
      
      // Clean up test file
      await file.delete();
      console.log(`✅ Pre-deployment: Test file cleaned up - ${testFileName}`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: File upload test failed - ${error.message}`);
    }
  }, 15000);
});
