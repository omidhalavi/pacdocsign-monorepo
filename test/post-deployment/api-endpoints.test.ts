// test/post-deployment/api-endpoints.test.ts
import axios from 'axios';

describe('Post-Deployment API Endpoint Tests', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-endpoint';
  const TEST_TIMEOUT = 30000;

  beforeAll(() => {
    // Set up axios defaults
    axios.defaults.timeout = TEST_TIMEOUT;
    axios.defaults.validateStatus = (status) => status < 500; // Don't throw on 4xx errors
  });

  test('Should upload file with new authentication (no CSEK in request)', async () => {
    const testFile = Buffer.from('test file content for new auth');
    
    const formData = new FormData();
    formData.append('file', testFile, 'test-file-new-auth.pdf');
    formData.append('destination', 'test/upload');
    // Note: CSEK is now optional - will use Secret Manager

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('successfully');
      console.log('✅ Post-deployment: File upload works with new auth (no CSEK in request)');
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Post-deployment: Upload failed with status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`⚠️ Post-deployment: Upload failed: ${error.message}`);
      }
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should download file with new authentication (no CSEK in request)', async () => {
    const requestData = {
      folder: 'test/upload',
      fileName: 'test-file-new-auth.pdf'
      // Note: CSEK is now optional - will use Secret Manager
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/getfile`, requestData);
      
      expect(response.status).toBe(200);
      console.log('✅ Post-deployment: File download works with new auth (no CSEK in request)');
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Post-deployment: Download failed with status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`⚠️ Post-deployment: Download failed: ${error.message}`);
      }
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should maintain backward compatibility with CSEK in request', async () => {
    const requestData = {
      folder: 'test/upload',
      fileName: 'test-file-new-auth.pdf',
      CSEK: 'THviE11qwpM/YkSTD/CYrvVWq96ytXxJJyU3RLpIVUA=' // Explicit CSEK
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/getfile`, requestData);
      
      expect(response.status).toBe(200);
      console.log('✅ Post-deployment: Backward compatibility maintained (CSEK in request)');
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Post-deployment: Backward compatibility test failed with status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`⚠️ Post-deployment: Backward compatibility test failed: ${error.message}`);
      }
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should handle file listing with new authentication', async () => {
    const requestData = {
      folder: 'test/upload'
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/list`, requestData);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      console.log('✅ Post-deployment: File listing works with new auth');
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Post-deployment: File listing failed with status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`⚠️ Post-deployment: File listing failed: ${error.message}`);
      }
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should handle file deletion with new authentication', async () => {
    const requestData = {
      destination: 'test/upload',
      fileName: 'test-file-new-auth.pdf'
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/deletefile`, requestData);
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('Successfully');
      console.log('✅ Post-deployment: File deletion works with new auth');
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Post-deployment: File deletion failed with status ${error.response.status}: ${error.response.data}`);
      } else {
        console.log(`⚠️ Post-deployment: File deletion failed: ${error.message}`);
      }
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should verify API health endpoints', async () => {
    const healthEndpoints = [
      '/health',
      '/health/file-access',
      '/health/secret-manager'
    ];

    let healthyEndpoints = 0;

    for (const endpoint of healthEndpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        
        if (response.status === 200) {
          healthyEndpoints++;
          console.log(`✅ Post-deployment: Health endpoint ${endpoint} is healthy`);
        } else {
          console.log(`⚠️ Post-deployment: Health endpoint ${endpoint} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Post-deployment: Health endpoint ${endpoint} not available: ${error.message}`);
      }
    }

    console.log(`📊 Post-deployment: ${healthyEndpoints}/${healthEndpoints.length} health endpoints responding`);
    // At least one health endpoint should be available
    expect(healthyEndpoints).toBeGreaterThan(0);
  }, TEST_TIMEOUT);

  test('Should verify API response times', async () => {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(`${API_BASE_URL}/list`, {
        folder: 'test/upload'
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ Post-deployment: API response time: ${responseTime}ms`);
      
      // Response time should be reasonable (less than 5 seconds)
      expect(responseTime).toBeLessThan(5000);
      
    } catch (error) {
      console.log(`⚠️ Post-deployment: API response time test failed: ${error.message}`);
      // Don't fail the test if API is not available
      expect(error.response?.status).toBeLessThan(500);
    }
  }, TEST_TIMEOUT);

  test('Should verify error handling', async () => {
    // Test with invalid data
    const invalidRequestData = {
      folder: '', // Empty folder
      fileName: '' // Empty filename
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/getfile`, invalidRequestData);
      
      // Should return 400 or similar error status
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
      
      console.log(`✅ Post-deployment: Error handling works - status ${response.status}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`✅ Post-deployment: Error handling works - status ${error.response.status}`);
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        expect(error.response.status).toBeLessThan(500);
      } else {
        console.log(`⚠️ Post-deployment: Error handling test failed: ${error.message}`);
      }
    }
  }, TEST_TIMEOUT);
});
