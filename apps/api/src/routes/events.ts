import { Router }          from 'express';
import { z }               from 'zod';
import { requireAuth }     from '../middleware/auth.js';
import { query, queryOne } from '../db/index.js';
import { logger }          from '../middleware/logger.js';
type RouterType = ReturnType<typeof Router>;

export const eventsRouter: RouterType = Router();

const createEventSchema = z.object({
  projectId: z.string().uuid(),
  type:      z.enum([
    'ai_prompt',
    'ai_response',
    'file_save',
    'manual_capture',
    'decision',
  ]),
  content:  z.string().min(1).max(100_000),
  metadata: z.object({
    filePaths:  z.array(z.string()).optional(),
    language:   z.string().optional(),
    editorId:   z.string().optional(),
    commitHash: z.string().optional(),
    tags:       z.array(z.string()).optional(),
  }).default({}),
});

eventsRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body     = createEventSchema.parse(req.body);
    const { userId, teamId } = req.auth;

    // Authorization: confirm the project belongs to this user's team
    const project = await queryOne<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1 AND team_id = $2',
      [body.projectId, teamId]
    );

    if (!project) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const [event] = await query<{ id: string; created_at: string }>(
      `INSERT INTO events (project_id, user_id, type, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [body.projectId, userId, body.type, body.content, JSON.stringify(body.metadata)]
    );

    // TODO: kick off background embedding once embeddings service is built
    // embedAndStore(event!.id, body.projectId, body.content)
    //   .catch(err => logger.error({ err, eventId: event!.id }, 'Embed failed'));

    logger.debug({ eventId: event!.id, type: body.type, userId }, 'Event created');

    res.status(201).json({
      data: { id: event!.id, createdAt: event!.created_at },
    });
  } catch (err) {
    next(err);
  }
});

// GET /events?projectId=&limit=50&offset=0
eventsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.auth;

    const querySchema = z.object({
      projectId: z.string().uuid(),
      limit:     z.coerce.number().int().min(1).max(100).default(50),
      offset:    z.coerce.number().int().min(0).default(0),
    });

    const params = querySchema.parse(req.query);

    // Verify project access
    const project = await queryOne<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1 AND team_id = $2',
      [params.projectId, teamId]
    );

    if (!project) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const events = await query<{
      id:           string;
      type:         string;
      content:      string;
      metadata:     Record<string, unknown>;
      created_at:   string;
      author_login: string;
      author_name:  string;
      author_avatar: string;
    }>(
      `SELECT
         e.id,
         e.type,
         e.content,
         e.metadata,
         e.created_at,
         u.login      AS author_login,
         u.name       AS author_name,
         u.avatar_url AS author_avatar
       FROM  events e
       JOIN  users  u ON u.id = e.user_id
       WHERE e.project_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [params.projectId, params.limit, params.offset]
    );

    res.json({ data: events });
  } catch (err) {
    next(err);
  }
});
