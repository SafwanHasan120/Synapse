import express, { type Express } from 'express';
import cors           from 'cors';
import { config }     from './config.js';
import { httpLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { eventsRouter } from './routes/events.js';

export function createApp(): Express {
  const app = express();

  // Middleware 
  app.use(cors({ origin: config.NEXT_PUBLIC_APP_URL }));
  app.use(express.json({ limit: '1mb' }));
  app.use(httpLogger);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ ok: true, env: config.NODE_ENV });
  });

  // Routes will be added here as you build them:
  // app.use('/auth',   authRouter);
  app.use('/events', eventsRouter);
  // app.use('/search', searchRouter);
  // app.use('/teams',  teamsRouter);

  app.use(errorHandler);

  return app;
}