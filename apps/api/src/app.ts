import express, { type Express } from 'express';
import cors             from 'cors';
import { config }       from './config.js';
import { httpLogger }   from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { authRouter }   from './routes/auth.js';
import { teamsRouter }  from './routes/teams.js';
import { searchRouter } from './routes/search.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.NEXT_PUBLIC_APP_URL }));
  app.use(express.json({ limit: '1mb' }));
  app.use(httpLogger);

  app.get('/health', (_req, res) => {
    res.json({ ok: true, env: config.NODE_ENV });
  });

  app.use('/auth',   authRouter);
  app.use('/teams',  teamsRouter);
  app.use('/search', searchRouter);

  // Upcoming:
  // app.use('/context-units', contextUnitsRouter);

  app.use(errorHandler);

  return app;
}
