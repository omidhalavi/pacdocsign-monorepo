/**
 * Cursor Bridge Service
 * 
 * Communication bridge between Excersys AI App and Cursor
 * Supports webhook forwarding, Slack integration, and API endpoints
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { webhookRouter } from './routes/webhook';
import { cursorRouter } from './routes/cursor';
import { slackRouter } from './routes/slack';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/webhook', webhookRouter);
app.use('/cursor', cursorRouter);
app.use('/slack', slackRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Cursor Bridge',
    version: '1.0.0',
    description: 'Communication bridge between Excersys AI App and Cursor',
    endpoints: {
      health: '/health',
      webhook: '/webhook',
      cursor: '/cursor',
      slack: '/slack',
    },
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Cursor Bridge service started on port ${PORT}`);
  logger.info(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  logger.info(`🤖 Cursor endpoint: http://localhost:${PORT}/cursor`);
  logger.info(`💬 Slack endpoint: http://localhost:${PORT}/slack`);
});

export default app;
