/**
 * Cursor Service
 * Handles communication with Cursor API
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface CursorQuery {
  query: string;
  context?: Record<string, any>;
  options?: Record<string, any>;
}

interface CursorMessage {
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

class CursorService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CURSOR_API_KEY || '';
    this.baseUrl = process.env.CURSOR_API_URL || 'https://api.cursor.sh';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      timeout: 30000,
    });
  }

  /**
   * Send a message to Cursor
   */
  async sendToCursor(data: CursorMessage): Promise<{ response: string; success: boolean }> {
    try {
      logger.info('Sending message to Cursor', {
        source: data.source,
        messageLength: data.message.length,
      });

      // Option 1: If Cursor has a webhook/API endpoint
      if (process.env.CURSOR_WEBHOOK_URL) {
        const response = await axios.post(process.env.CURSOR_WEBHOOK_URL, {
          message: data.message,
          source: data.source,
          metadata: data.metadata,
        });

        return {
          response: response.data.response || response.data.message || 'Message received by Cursor',
          success: true,
        };
      }

      // Option 2: Use Cursor API (if available)
      if (this.apiKey) {
        const response = await this.client.post('/v1/chat', {
          messages: [
            {
              role: 'user',
              content: data.message,
            },
          ],
          context: data.metadata,
        });

        return {
          response: response.data.choices?.[0]?.message?.content || 'No response from Cursor',
          success: true,
        };
      }

      // Option 3: Fallback - simulate response or use alternative method
      logger.warn('No Cursor API configuration found, using fallback');
      return {
        response: `Message received from ${data.source}: "${data.message}". Cursor integration pending configuration.`,
        success: false,
      };
    } catch (error: any) {
      logger.error('Error sending message to Cursor', {
        error: error.message,
        stack: error.stack,
      });

      throw new Error(`Failed to communicate with Cursor: ${error.message}`);
    }
  }

  /**
   * Query Cursor with a question
   */
  async query(data: CursorQuery): Promise<{ response: string; success: boolean }> {
    try {
      logger.info('Querying Cursor', {
        queryLength: data.query.length,
        hasContext: !!data.context,
      });

      // Use the same method as sendToCursor
      return await this.sendToCursor({
        message: data.query,
        source: data.context?.source || 'api',
        metadata: {
          ...data.context,
          query: true,
          options: data.options,
        },
      });
    } catch (error: any) {
      logger.error('Error querying Cursor', {
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Get Cursor service status
   */
  async getStatus(): Promise<{ status: string; available: boolean; message?: string }> {
    try {
      const hasConfig = !!(this.apiKey || process.env.CURSOR_WEBHOOK_URL);

      if (!hasConfig) {
        return {
          status: 'not_configured',
          available: false,
          message: 'Cursor API key or webhook URL not configured',
        };
      }

      // Try to ping Cursor service
      if (process.env.CURSOR_WEBHOOK_URL) {
        try {
          await axios.get(process.env.CURSOR_WEBHOOK_URL.replace('/webhook', '/health'), {
            timeout: 5000,
          });
          return {
            status: 'healthy',
            available: true,
          };
        } catch (error) {
          // Webhook might not have health endpoint, that's OK
          return {
            status: 'available',
            available: true,
            message: 'Webhook URL configured',
          };
        }
      }

      return {
        status: 'available',
        available: true,
        message: 'API key configured',
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        available: false,
        message: error.message,
      };
    }
  }
}

export const cursorService = new CursorService();
