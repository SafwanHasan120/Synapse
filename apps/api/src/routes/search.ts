import { Router }      from 'express';
import { z }           from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { queryOne }    from '../db/index.js';
import { semanticSearch } from '../services/embeddings.js';
type RouterType = ReturnType<typeof Router>;

export const searchRouter: RouterType = Router();

const searchSchema = z.object({
  query:     z.string().min(1).max(1000),
  projectId: z.string().uuid(),
  limit:     z.coerce.number().int().min(1).max(20).default(8),
});

searchRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const body     = searchSchema.parse(req.body);
    const { teamId } = req.auth;

    // Authorization: project must belong to user's team
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

    const results = await semanticSearch(
      body.projectId,
      body.query,
      body.limit
    );

    res.json({
      data: {
        results,
        query:     body.query,
        projectId: body.projectId,
      },
    });
  } catch (err) {
    next(err);
  }
});
