/**
 * Slack Service
 * Handles Slack API integration
 */

import { WebClient } from '@slack/web-api';
import { logger } from '../utils/logger';
import axios from 'axios';

interface SlackNotification {
  text: string;
  blocks?: any[];
  channel?: string;
}

interface SlackReply {
  channel: string;
  threadTs: string;
  text: string;
}

class SlackService {
  private client: WebClient | null = null;
  private webhookUrl: string | null = null;

  constructor() {
    const token = process.env.SLACK_BOT_TOKEN;
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;

    if (token) {
      this.client = new WebClient(token);
    } else if (!this.webhookUrl) {
      logger.warn('Slack bot token and webhook URL not configured');
    }
  }

  /**
   * Send a notification to Slack
   */
  async sendNotification(data: SlackNotification): Promise<void> {
    try {
      const channel = data.channel || process.env.SLACK_CHANNEL || '#general';

      // Use webhook if available (simpler, no bot token needed)
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, {
          text: data.text,
          blocks: data.blocks,
          channel,
        });
        logger.info('Sent Slack notification via webhook');
        return;
      }

      // Use Web API if bot token is available
      if (this.client) {
        await this.client.chat.postMessage({
          channel,
          text: data.text,
          blocks: data.blocks,
        });
        logger.info('Sent Slack notification via Web API');
        return;
      }

      logger.warn('Cannot send Slack notification: no configuration');
    } catch (error: any) {
      logger.error('Error sending Slack notification', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Reply in a Slack thread
   */
  async replyInThread(data: SlackReply): Promise<void> {
    try {
      if (!this.client) {
        throw new Error('Slack bot token not configured');
      }

      await this.client.chat.postMessage({
        channel: data.channel,
        thread_ts: data.threadTs,
        text: data.text,
      });

      logger.info('Replied in Slack thread', {
        channel: data.channel,
      });
    } catch (error: any) {
      logger.error('Error replying in Slack thread', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get Slack service status
   */
  async getStatus(): Promise<{ status: string; available: boolean; message?: string }> {
    try {
      if (this.client) {
        // Test connection
        await this.client.auth.test();
        return {
          status: 'healthy',
          available: true,
          message: 'Web API connected',
        };
      }

      if (this.webhookUrl) {
        return {
          status: 'available',
          available: true,
          message: 'Webhook URL configured',
        };
      }

      return {
        status: 'not_configured',
        available: false,
        message: 'Slack bot token or webhook URL not configured',
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

export const slackService = new SlackService();
