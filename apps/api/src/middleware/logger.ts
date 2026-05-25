import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from '../config.js';

export const logger = pino(
  {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  config.NODE_ENV === 'development'
    ? pino.transport({ target: 'pino-pretty', options: { colorize: true } })
    : undefined,
);

export const httpLogger = pinoHttp({
  logger,
  customLogLevel(_req, res) {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  redact: ['req.headers.authorization'],
});