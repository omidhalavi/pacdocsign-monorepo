// test/pre-deployment/secret-manager.test.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

describe('Pre-Deployment Secret Manager Tests', () => {
  let secretClient: SecretManagerServiceClient;

  beforeAll(() => {
    secretClient = new SecretManagerServiceClient();
  });

  test('Should access production service account secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      
      expect(serviceAccountKey.client_email).toBe('document-service@pacdocv2-api-prod.iam.gserviceaccount.com');
      expect(serviceAccountKey.project_id).toBe('pacdocv2-api-prod');
      expect(serviceAccountKey.type).toBe('service_account');
      
      console.log('✅ Pre-deployment: Production secret accessible');
      console.log(`📧 Service Account: ${serviceAccountKey.client_email}`);
      console.log(`🆔 Project ID: ${serviceAccountKey.project_id}`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access production secret - ${error.message}`);
    }
  }, 10000);

  test('Should access development service account secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/docstorage-286015/secrets/gcs-service-account-key/versions/latest'
      });
      
      const serviceAccountKey = JSON.parse(version.payload?.data?.toString() || '{}');
      
      expect(serviceAccountKey.client_email).toBe('pacdoc-live@docstorage-286015.iam.gserviceaccount.com');
      expect(serviceAccountKey.project_id).toBe('docstorage-286015');
      expect(serviceAccountKey.type).toBe('service_account');
      
      console.log('✅ Pre-deployment: Development secret accessible');
      console.log(`📧 Service Account: ${serviceAccountKey.client_email}`);
      console.log(`🆔 Project ID: ${serviceAccountKey.project_id}`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access development secret - ${error.message}`);
    }
  }, 10000);

  test('Should access CSEK secret', async () => {
    try {
      const [version] = await secretClient.accessSecretVersion({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-csek-key/versions/latest'
      });
      
      const csek = version.payload?.data?.toString();
      
      expect(csek).toBe('THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=');
      
      console.log('✅ Pre-deployment: CSEK secret accessible');
      console.log(`🔐 CSEK: ${csek?.substring(0, 10)}...`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access CSEK secret - ${error.message}`);
    }
  }, 10000);

  test('Should verify secret permissions and access', async () => {
    const secrets = [
      'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key',
      'projects/docstorage-286015/secrets/gcs-service-account-key',
      'projects/pacdocv2-api-prod/secrets/gcs-csek-key'
    ];

    let accessibleSecrets = 0;

    for (const secretName of secrets) {
      try {
        const [version] = await secretClient.accessSecretVersion({
          name: `${secretName}/versions/latest`
        });
        
        const secretData = version.payload?.data?.toString();
        expect(secretData).toBeTruthy();
        
        accessibleSecrets++;
        console.log(`✅ Pre-deployment: Secret accessible - ${secretName.split('/').pop()}`);
        
      } catch (error) {
        console.log(`❌ Pre-deployment: Secret not accessible - ${secretName.split('/').pop()} - ${error.message}`);
      }
    }

    console.log(`📊 Pre-deployment: ${accessibleSecrets}/${secrets.length} secrets accessible`);
    expect(accessibleSecrets).toBe(secrets.length); // All secrets should be accessible
  }, 15000);

  test('Should verify secret metadata and versions', async () => {
    try {
      const [secret] = await secretClient.getSecret({
        name: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key'
      });
      
      expect(secret.name).toContain('gcs-prod-service-account-key');
      expect(secret.replication).toBeDefined();
      
      console.log('✅ Pre-deployment: Secret metadata accessible');
      console.log(`📋 Secret Name: ${secret.name?.split('/').pop()}`);
      console.log(`🔄 Replication: ${secret.replication?.automatic ? 'Automatic' : 'Manual'}`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access secret metadata - ${error.message}`);
    }
  }, 10000);

  test('Should verify secret version history', async () => {
    try {
      const [versions] = await secretClient.listSecretVersions({
        parent: 'projects/pacdocv2-api-prod/secrets/gcs-prod-service-account-key'
      });
      
      expect(versions.length).toBeGreaterThan(0);
      
      console.log('✅ Pre-deployment: Secret version history accessible');
      console.log(`📊 Version Count: ${versions.length}`);
      
      // Check if latest version is enabled
      const latestVersion = versions[0];
      expect(latestVersion.state).toBe('ENABLED');
      
      console.log(`✅ Pre-deployment: Latest version enabled - ${latestVersion.name?.split('/').pop()}`);
      
    } catch (error) {
      throw new Error(`❌ Pre-deployment: Cannot access secret version history - ${error.message}`);
    }
  }, 10000);
});


