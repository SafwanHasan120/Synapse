import { Router }                        from 'express';
import { z }                             from 'zod';
import { requireAuth }                   from '../middleware/auth.js';
import { query, queryOne, withTransaction } from '../db/index.js';
import { embedContextUnit }              from '../services/embeddings.js';
import { logger }                        from '../middleware/logger.js';
type RouterType = ReturnType<typeof Router>;

export const contextUnitsRouter: RouterType = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const proposeSchema = z.object({
  projectId:  z.string().uuid(),
  content:    z.string().min(1).max(10_000),
  scope:      z.enum(['repo','service','team','org']).default('team'),
  tags:       z.array(z.string().max(50)).max(10).default([]),
  source:     z.string().max(500).optional(),
  agentName:  z.string().max(100).optional(),
  authorType: z.enum(['human','agent']).default('human'),
});

const reviewSchema = z.object({
  action: z.enum(['approved','rejected']),
  note:   z.string().max(1000).optional(),
});

const listSchema = z.object({
  projectId: z.string().uuid(),
  scope:     z.enum(['repo','service','team','org']).optional(),
  limit:     z.coerce.number().int().min(1).max(100).default(50),
  offset:    z.coerce.number().int().min(0).default(0),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function assertProjectAccess(
  projectId: string,
  teamId:    string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    'SELECT id FROM projects WHERE id = $1 AND team_id = $2',
    [projectId, teamId]
  );
  return row !== null;
}

// ─── POST /propose ────────────────────────────────────────────────────────────

contextUnitsRouter.post('/propose', requireAuth, async (req, res, next) => {
  try {
    const body             = proposeSchema.parse(req.body);
    const { userId, teamId } = req.auth;

    if (!(await assertProjectAccess(body.projectId, teamId))) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const [cu] = await query<{ id: string; created_at: string }>(
      `INSERT INTO context_units
         (project_id, content, scope, tags, state,
          author_id, author_type, agent_name, source)
       VALUES ($1,$2,$3,$4,'proposed',$5,$6,$7,$8)
       RETURNING id, created_at`,
      [
        body.projectId,
        body.content,
        body.scope,
        body.tags,
        body.authorType === 'human' ? userId : null,
        body.authorType,
        body.agentName ?? null,
        body.source    ?? null,
      ]
    );

    logger.info(
      { unitId: cu!.id, projectId: body.projectId, authorType: body.authorType },
      'Context unit proposed'
    );

    res.status(201).json({
      data: { id: cu!.id, state: 'proposed', createdAt: cu!.created_at },
    });
  } catch (err) { next(err); }
});

// ─── GET /queue ───────────────────────────────────────────────────────────────

contextUnitsRouter.get('/queue', requireAuth, async (req, res, next) => {
  try {
    const params           = listSchema.parse(req.query);
    const { teamId }       = req.auth;

    if (!(await assertProjectAccess(params.projectId, teamId))) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const units = await query<{
      id:           string;
      content:      string;
      scope:        string;
      tags:         string[];
      author_type:  string;
      agent_name:   string | null;
      source:       string | null;
      author_login: string | null;
      author_name:  string | null;
      created_at:   string;
    }>(
      `SELECT
         cu.id, cu.content, cu.scope, cu.tags,
         cu.author_type, cu.agent_name, cu.source,
         u.login AS author_login,
         u.name  AS author_name,
         cu.created_at
       FROM  context_units cu
       LEFT  JOIN users u ON u.id = cu.author_id
       WHERE cu.project_id = $1
         AND cu.state      = 'proposed'
       ORDER BY cu.created_at ASC
       LIMIT $2 OFFSET $3`,
      [params.projectId, params.limit, params.offset]
    );

    res.json({ data: units });
  } catch (err) { next(err); }
});

// ─── GET / ────────────────────────────────────────────────────────────────────
// Canonical knowledge base — accepted CUs only.
// Registered before /:id so 'queue' and '' don't match as IDs.

contextUnitsRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const params     = listSchema.parse(req.query);
    const { teamId } = req.auth;

    if (!(await assertProjectAccess(params.projectId, teamId))) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const units = await query<{
      id:           string;
      content:      string;
      scope:        string;
      tags:         string[];
      author_type:  string;
      agent_name:   string | null;
      source:       string | null;
      author_login: string | null;
      author_name:  string | null;
      created_at:   string;
      updated_at:   string;
    }>(
      `SELECT
         cu.id, cu.content, cu.scope, cu.tags,
         cu.author_type, cu.agent_name, cu.source,
         u.login AS author_login,
         u.name  AS author_name,
         cu.created_at,
         cu.updated_at
       FROM  context_units cu
       LEFT  JOIN users u ON u.id = cu.author_id
       WHERE cu.project_id        = $1
         AND cu.state             = 'accepted'
         AND ($4::text IS NULL OR cu.scope = $4)
       ORDER BY cu.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [params.projectId, params.limit, params.offset, params.scope ?? null]
    );

    res.json({ data: units });
  } catch (err) { next(err); }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

contextUnitsRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { teamId } = req.auth;

    const cu = await queryOne<{
      id: string; content: string; scope: string; tags: string[];
      state: string; author_type: string; agent_name: string | null;
      source: string | null; confidence: number;
      author_login: string | null; author_name: string | null;
      created_at: string; updated_at: string;
    }>(
      `SELECT
         cu.id, cu.content, cu.scope, cu.tags, cu.state,
         cu.author_type, cu.agent_name, cu.source, cu.confidence,
         u.login AS author_login,
         u.name  AS author_name,
         cu.created_at, cu.updated_at
       FROM  context_units cu
       LEFT  JOIN users    u ON u.id = cu.author_id
       JOIN   projects     p ON p.id = cu.project_id
       WHERE  cu.id = $1 AND p.team_id = $2`,
      [id, teamId]
    );

    if (!cu) {
      res.status(404).json({
        error: { message: 'Context unit not found', code: 'NOT_FOUND' },
      });
      return;
    }

    const reviews = await query<{
      id: string; action: string; note: string | null;
      reviewer_login: string | null; reviewer_name: string | null;
      created_at: string;
    }>(
      `SELECT
         r.id, r.action, r.note,
         u.login AS reviewer_login,
         u.name  AS reviewer_name,
         r.created_at
       FROM  reviews r
       LEFT  JOIN users u ON u.id = r.reviewer_id
       WHERE r.context_unit_id = $1
       ORDER BY r.created_at ASC`,
      [id]
    );

    res.json({ data: { ...cu, reviews } });
  } catch (err) { next(err); }
});

// ─── PATCH /:id/review ────────────────────────────────────────────────────────

contextUnitsRouter.patch('/:id/review', requireAuth, async (req, res, next) => {
  try {
    const id                 = req.params.id!;
    const body               = reviewSchema.parse(req.body);
    const { userId, teamId } = req.auth;

    const cu = await queryOne<{
      id: string; project_id: string; state: string; content: string;
    }>(
      `SELECT cu.id, cu.project_id, cu.state, cu.content
       FROM  context_units cu
       JOIN  projects      p ON p.id = cu.project_id
       WHERE cu.id = $1 AND p.team_id = $2`,
      [id, teamId]
    );

    if (!cu) {
      res.status(403).json({
        error: { message: 'Context unit not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    if (cu.state !== 'proposed') {
      res.status(409).json({
        error: {
          message: `Cannot review a unit already in '${cu.state}' state`,
          code:    'CONFLICT',
        },
      });
      return;
    }

    const newState = body.action === 'approved' ? 'accepted' : 'rejected';

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE context_units SET state = $1, updated_at = NOW() WHERE id = $2`,
        [newState, id]
      );
      await client.query(
        `INSERT INTO reviews (context_unit_id, project_id, reviewer_id, action, note)
         VALUES ($1,$2,$3,$4,$5)`,
        [id, cu.project_id, userId, body.action, body.note ?? null]
      );
    });

    logger.info({ unitId: id, action: body.action, reviewerId: userId }, 'Context unit reviewed');

    if (body.action === 'approved') {
      embedContextUnit(id, cu.content).catch(
        err => logger.error({ err, unitId: id }, 'Background embedding failed')
      );
    }

    res.json({
      data: { id, state: newState, reviewedAt: new Date().toISOString() },
    });
  } catch (err) { next(err); }
});
