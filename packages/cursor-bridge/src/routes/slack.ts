/**
 * Slack integration routes
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { slackService } from '../services/slackService';
import { cursorService } from '../services/cursorService';

export const slackRouter = Router();

/**
 * POST /slack/events
 * Slack Events API endpoint
 */
slackRouter.post('/events', async (req: Request, res: Response) => {
  try {
    const { type, event, challenge } = req.body;

    // URL verification
    if (type === 'url_verification') {
      return res.send(challenge);
    }

    // Handle events
    if (type === 'event_callback' && event) {
      // Handle mentions of @Cursor
      if (event.type === 'app_mention' || event.type === 'message') {
        const text = event.text || '';
        const userId = event.user;
        const channel = event.channel;

        // Check if message mentions Cursor or is directed to Cursor
        if (
          text.includes('<@CURSOR_BOT_ID>') ||
          text.toLowerCase().includes('@cursor') ||
          text.toLowerCase().includes('cursor')
        ) {
          logger.info('Received Slack message for Cursor', {
            userId,
            channel,
            textLength: text.length,
          });

          // Extract the actual query (remove mentions)
          const query = text
            .replace(/<@[^>]+>/g, '')
            .replace(/@cursor/gi, '')
            .trim();

          if (query) {
            // Send to Cursor
            const cursorResponse = await cursorService.query({
              query,
              context: {
                source: 'slack',
                userId,
                channel,
              },
            });

            // Reply in Slack thread
            await slackService.replyInThread({
              channel,
              threadTs: event.ts,
              text: cursorResponse.response || 'No response from Cursor',
            });
          }
        }
      }

      res.status(200).send('OK');
    } else {
      res.status(200).send('OK');
    }
  } catch (error: any) {
    logger.error('Error processing Slack event', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Failed to process Slack event',
      message: error.message,
    });
  }
});

/**
 * POST /slack/command
 * Slack Slash Command endpoint
 */
slackRouter.post('/command', async (req: Request, res: Response) => {
  try {
    const { text, user_id, channel_id, response_url } = req.body;

    if (!text) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a query for Cursor. Usage: /cursor <your question>',
      });
    }

    logger.info('Received Slack slash command', {
      userId: user_id,
      channelId: channel_id,
      query: text,
    });

    // Send to Cursor
    const cursorResponse = await cursorService.query({
      query: text,
      context: {
        source: 'slack-command',
        userId: user_id,
        channel: channel_id,
      },
    });

    // Return response
    res.json({
      response_type: 'in_channel',
      text: cursorResponse.response || 'No response from Cursor',
    });
  } catch (error: any) {
    logger.error('Error processing Slack command', {
      error: error.message,
    });

    res.json({
      response_type: 'ephemeral',
      text: `Error: ${error.message}`,
    });
  }
});
