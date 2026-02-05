/**
 * Webhook routes for receiving messages from Excersys AI App
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { cursorService } from '../services/cursorService';
import { slackService } from '../services/slackService';

export const webhookRouter = Router();

/**
 * POST /webhook
 * Receives messages from Excersys AI App and forwards to Cursor
 */
webhookRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { message, source, metadata } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing required field: message',
      });
    }

    logger.info('Received webhook from Excersys AI App', {
      source: source || 'unknown',
      messageLength: message.length,
      metadata,
    });

    // Forward to Cursor
    const cursorResponse = await cursorService.sendToCursor({
      message,
      source: source || 'excersys-ai-app',
      metadata,
    });

    // Optionally notify via Slack
    if (process.env.SLACK_NOTIFICATIONS_ENABLED === 'true') {
      await slackService.sendNotification({
        text: `📨 Message from Excersys AI App forwarded to Cursor`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n${message.substring(0, 500)}${message.length > 500 ? '...' : ''}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Cursor Response:*\n${cursorResponse.response?.substring(0, 500) || 'No response'}${cursorResponse.response && cursorResponse.response.length > 500 ? '...' : ''}`,
            },
          },
        ],
      });
    }

    res.json({
      success: true,
      message: 'Message forwarded to Cursor',
      cursorResponse: cursorResponse.response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error processing webhook', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message,
    });
  }
});

/**
 * GET /webhook
 * Webhook verification endpoint
 */
webhookRouter.get('/', (req: Request, res: Response) => {
  const challenge = req.query.challenge;
  
  if (challenge) {
    // Webhook verification
    res.send(challenge);
  } else {
    res.json({
      status: 'active',
      endpoint: '/webhook',
      method: 'POST',
    });
  }
});
