/**
 * Cursor API routes
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { cursorService } from '../services/cursorService';

export const cursorRouter = Router();

/**
 * POST /cursor/query
 * Send a query directly to Cursor
 */
cursorRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, context, options } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Missing required field: query',
      });
    }

    logger.info('Received Cursor query', {
      queryLength: query.length,
      hasContext: !!context,
    });

    const response = await cursorService.query({
      query,
      context,
      options,
    });

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error processing Cursor query', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Failed to process Cursor query',
      message: error.message,
    });
  }
});

/**
 * GET /cursor/status
 * Check Cursor service status
 */
cursorRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await cursorService.getStatus();
    res.json(status);
  } catch (error: any) {
    logger.error('Error checking Cursor status', {
      error: error.message,
    });

    res.status(500).json({
      error: 'Failed to check Cursor status',
      message: error.message,
    });
  }
});
