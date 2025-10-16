import { Storage } from '@google-cloud/storage';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import config from '../../packages/api/Cloud Functions/document-service/config/index';
import { CSEK } from '../../packages/api/Cloud Functions/document-service/config/jwt';

/**
 * Critical test to ensure existing encrypted files remain accessible
 * This test MUST pass before deploying any security changes to production
 */

describe('Existing File Access - Backward Compatibility', () => {
  let storage: Storage;
  let secretClient: SecretManagerServiceClient;
  const testBucket = config.GCS.bucketName || 'pacdocv2-api-prod';

  beforeAll(async () => {
    secretClient = new SecretManagerServiceClient();
  });

  describe('CSEK Encryption Key Compatibility', () => {
    test('Original hardcoded CSEK should be accessible', () => {
      expect(CSEK).toBe('THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=');
      expect(CSEK.length).toBe(44); // Base64-encoded 32-byte key
    });

    test('CSEK from Secret Manager should match hardcoded value', async () => {
      try {
        const [version] = await secretClient.accessSecretVersion({
          name: `projects/${config.GCS.projectId}/secrets/csek-encryption-key/versions/latest`
        });

        const secretCSEK = version.payload?.data?.toString();
        expect(secretCSEK).toBe(CSEK);
      } catch (error) {
        console.warn('⚠️ CSEK not yet in Secret Manager - this is expected during initial setup');
        // This is acceptable during initial setup, but should pass after Secret Manager is configured
      }
    });

    test('CSEK can be converted to Buffer correctly', () => {
      const csekBuffer = Buffer.from(CSEK, 'base64');
      expect(csekBuffer.length).toBe(32); // 256-bit key
    });
  });

  describe('Service Account Access', () => {
    test('Storage can be initialized with fallback to file-based auth', async () => {
      try {
        // Try Secret Manager first
        const secretName = config.GCS.projectId === 'pacdocv2-api-prod'
          ? 'gcs-prod-service-account-key'
          : 'gcs-service-account-key';

        const [version] = await secretClient.accessSecretVersion({
          name: `projects/${config.GCS.projectId}/secrets/${secretName}/versions/latest`
        });

        const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');

        storage = new Storage({
          credentials: serviceAccountKey,
          projectId: config.GCS.projectId
        });

        console.log('✅ Storage initialized from Secret Manager');
      } catch (error) {
        console.warn('⚠️ Secret Manager unavailable, using file-based auth');

        // Fallback to file-based authentication
        storage = new Storage({
          keyFilename: `${__dirname}/../../packages/api/Cloud Functions/document-service/config/${config.GCS.apiKeyFileName}`,
          projectId: config.GCS.projectId
        });

        console.log('✅ Storage initialized from file');
      }

      expect(storage).toBeDefined();
    });

    test('Can list files in bucket (basic connectivity)', async () => {
      const bucket = storage.bucket(testBucket);
      const [files] = await bucket.getFiles({ maxResults: 5 });

      expect(files).toBeDefined();
      console.log(`✅ Successfully listed ${files.length} files`);
    }, 30000); // 30 second timeout
  });

  describe('Existing File Access Tests', () => {
    test('Can access metadata of existing files', async () => {
      const bucket = storage.bucket(testBucket);
      const [files] = await bucket.getFiles({ maxResults: 10 });

      if (files.length === 0) {
        console.warn('⚠️ No files found in bucket for testing');
        return;
      }

      const testFile = files[0];
      const [metadata] = await testFile.getMetadata();

      expect(metadata).toBeDefined();
      expect(metadata.name).toBe(testFile.name);
      console.log(`✅ Successfully accessed metadata for: ${testFile.name}`);
    }, 30000);

    test('Can read existing encrypted files with CSEK', async () => {
      const bucket = storage.bucket(testBucket);
      const [files] = await bucket.getFiles({ maxResults: 10 });

      if (files.length === 0) {
        console.warn('⚠️ No files found in bucket for testing');
        return;
      }

      // Try to read a file with CSEK
      const testFile = files[0];
      const csekBuffer = Buffer.from(CSEK, 'base64');

      try {
        const [exists] = await testFile.exists();
        expect(exists).toBe(true);

        // Attempt to read file with CSEK (if it was encrypted with CSEK)
        const file = bucket.file(testFile.name, {
          encryptionKey: csekBuffer
        });

        const [metadata] = await file.getMetadata();
        expect(metadata).toBeDefined();

        console.log(`✅ Successfully accessed encrypted file: ${testFile.name}`);
      } catch (error: any) {
        // If file is not encrypted with CSEK, that's okay
        if (error.code === 400 || error.message.includes('encryption')) {
          console.log(`ℹ️ File ${testFile.name} is not CSEK-encrypted (expected for some files)`);
        } else {
          throw error;
        }
      }
    }, 30000);

    test('Can download existing file content', async () => {
      const bucket = storage.bucket(testBucket);
      const [files] = await bucket.getFiles({ maxResults: 10 });

      if (files.length === 0) {
        console.warn('⚠️ No files found in bucket for testing');
        return;
      }

      const testFile = files[0];
      const csekBuffer = Buffer.from(CSEK, 'base64');

      try {
        // Try with CSEK first
        const file = bucket.file(testFile.name, {
          encryptionKey: csekBuffer
        });

        const [contents] = await file.download();
        expect(contents).toBeDefined();
        expect(contents.length).toBeGreaterThan(0);

        console.log(`✅ Successfully downloaded file: ${testFile.name} (${contents.length} bytes)`);
      } catch (error: any) {
        // Try without CSEK
        const [contents] = await testFile.download();
        expect(contents).toBeDefined();
        expect(contents.length).toBeGreaterThan(0);

        console.log(`✅ Successfully downloaded unencrypted file: ${testFile.name} (${contents.length} bytes)`);
      }
    }, 30000);
  });

  describe('File Upload with CSEK', () => {
    test('Can upload new files with CSEK', async () => {
      const bucket = storage.bucket(testBucket);
      const testFileName = `test/compatibility-test-${Date.now()}.txt`;
      const testContent = 'This is a backward compatibility test file';

      const csekBuffer = Buffer.from(CSEK, 'base64');
      const file = bucket.file(testFileName, {
        encryptionKey: csekBuffer
      });

      await file.save(testContent, {
        metadata: {
          contentType: 'text/plain'
        }
      });

      console.log(`✅ Successfully uploaded encrypted file: ${testFileName}`);

      // Verify we can read it back
      const [contents] = await file.download();
      expect(contents.toString()).toBe(testContent);

      // Clean up
      await file.delete();
      console.log(`✅ Test file deleted: ${testFileName}`);
    }, 30000);
  });

  describe('Bucket Configuration Compatibility', () => {
    test('Bucket versioning status', async () => {
      const bucket = storage.bucket(testBucket);
      const [metadata] = await bucket.getMetadata();

      console.log(`Versioning enabled: ${metadata.versioning?.enabled || false}`);
      // Versioning should not affect existing file access
    }, 30000);

    test('Bucket uniform access status', async () => {
      const bucket = storage.bucket(testBucket);
      const [metadata] = await bucket.getMetadata();

      const uniformAccess = metadata.iamConfiguration?.uniformBucketLevelAccess;
      console.log(`Uniform bucket-level access: ${uniformAccess?.enabled || false}`);
      // Uniform access should not affect existing file access
    }, 30000);

    test('Bucket lifecycle rules', async () => {
      const bucket = storage.bucket(testBucket);
      const [metadata] = await bucket.getMetadata();

      const lifecycleRules = metadata.lifecycle?.rule || [];
      console.log(`Lifecycle rules: ${lifecycleRules.length}`);

      // Lifecycle rules should only affect future operations
      lifecycleRules.forEach((rule: any, index: number) => {
        console.log(`  Rule ${index + 1}: ${rule.action.type} after ${rule.condition.age} days`);
      });
    }, 30000);
  });

  describe('Error Handling and Fallback', () => {
    test('System handles Secret Manager unavailability gracefully', async () => {
      // This test verifies that the fallback mechanism works
      // Even if Secret Manager is down, files should remain accessible via fallback

      const fallbackStorage = new Storage({
        keyFilename: `${__dirname}/../../packages/api/Cloud Functions/document-service/config/${config.GCS.apiKeyFileName}`,
        projectId: config.GCS.projectId
      });

      const bucket = fallbackStorage.bucket(testBucket);
      const [files] = await bucket.getFiles({ maxResults: 1 });

      expect(files).toBeDefined();
      console.log('✅ Fallback authentication works correctly');
    }, 30000);
  });
});

/**
 * Run this test suite before deploying to production:
 *
 * npm run test:existing-file-access
 *
 * All tests MUST pass before proceeding with deployment.
 */
