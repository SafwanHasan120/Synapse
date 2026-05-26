import express, { type Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const eventsRouter: Router = express.Router();

// A simple authenticated endpoint that returns a stubbed response.
eventsRouter.get('/', requireAuth, (_req, res) => {
  res.json({ ok: true, message: 'Events endpoint reached' });
});

eventsRouter.post('/', requireAuth, (_req, res) => {
  res.json({ ok: true, message: 'Event created' });
});
