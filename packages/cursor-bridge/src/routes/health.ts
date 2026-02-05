/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { cursorService } from '../services/cursorService';
import { slackService } from '../services/slackService';

export const healthRouter = Router();

/**
 * GET /health
 * Health check endpoint
 */
healthRouter.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'cursor-bridge',
      version: '1.0.0',
      checks: {
        cursor: await cursorService.getStatus(),
        slack: await slackService.getStatus(),
      },
    };

    const allHealthy = Object.values(health.checks).every(
      (check: any) => check.status === 'healthy' || check.status === 'available'
    );

    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error: any) {
    logger.error('Health check failed', {
      error: error.message,
    });

    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
