import { createApp } from './app.js';
import { config }    from './config.js';
import { pool }      from './db/index.js';
import { logger }    from './middleware/logger.js';

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    'API server started'
  );
});

// Graceful shutdown — ECS sends SIGTERM before stopping the container
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down...');
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // Force exit after 10s if graceful fails
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT',  () => void shutdown('SIGINT'));