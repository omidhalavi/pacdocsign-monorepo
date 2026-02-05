/**
 * Tests for Cursor Service
 */

import { cursorService } from '../cursorService';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('CursorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CURSOR_API_KEY = '';
    process.env.CURSOR_WEBHOOK_URL = '';
  });

  describe('sendToCursor', () => {
    it('should send message via webhook URL when configured', async () => {
      process.env.CURSOR_WEBHOOK_URL = 'https://test-cursor.com/webhook';
      axios.post.mockResolvedValue({
        data: { response: 'Test response from Cursor' },
      });

      const result = await cursorService.sendToCursor({
        message: 'Test message',
        source: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('Test response from Cursor');
      expect(axios.post).toHaveBeenCalledWith(
        'https://test-cursor.com/webhook',
        expect.objectContaining({
          message: 'Test message',
          source: 'test',
        })
      );
    });

    it('should return fallback response when no configuration', async () => {
      const result = await cursorService.sendToCursor({
        message: 'Test message',
        source: 'test',
      });

      expect(result.success).toBe(false);
      expect(result.response).toContain('Message received from test');
    });
  });

  describe('query', () => {
    it('should process query correctly', async () => {
      process.env.CURSOR_WEBHOOK_URL = 'https://test-cursor.com/webhook';
      axios.post.mockResolvedValue({
        data: { response: 'Query response' },
      });

      const result = await cursorService.query({
        query: 'What is the status?',
        context: { source: 'api' },
      });

      expect(result.success).toBe(true);
      expect(result.response).toBe('Query response');
    });
  });

  describe('getStatus', () => {
    it('should return not_configured when no config', async () => {
      const status = await cursorService.getStatus();
      expect(status.status).toBe('not_configured');
      expect(status.available).toBe(false);
    });

    it('should return available when webhook URL configured', async () => {
      process.env.CURSOR_WEBHOOK_URL = 'https://test-cursor.com/webhook';
      const status = await cursorService.getStatus();
      expect(status.status).toBe('available');
      expect(status.available).toBe(true);
    });
  });
});
