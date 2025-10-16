// test/setup.ts
import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting GCS Security Testing Suite');
  console.log('=====================================');
});

afterAll(() => {
  console.log('=====================================');
  console.log('✅ GCS Security Testing Suite Complete');
});

// Global test timeout
jest.setTimeout(60000);

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

// Export test utilities
export const testUtils = {
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  generateTestFileName: (prefix: string = 'test') => 
    `${prefix}/test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.txt`,
  
  createTestContent: (content: string = 'test content') => 
    `Test content: ${content} - ${new Date().toISOString()}`,
  
  logTestResult: (testName: string, success: boolean, details?: string) => {
    const status = success ? '✅' : '❌';
    const message = details ? `${status} ${testName}: ${details}` : `${status} ${testName}`;
    console.log(message);
  }
};

