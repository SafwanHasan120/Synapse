import { Router }          from 'express';
import { z }               from 'zod';
import { requireAuth }     from '../middleware/auth.js';
import { query, queryOne } from '../db/index.js';
type RouterType = ReturnType<typeof Router>;

export const teamsRouter: RouterType = Router();

// GET /teams/me — returns the current user's team, members, and projects
teamsRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { teamId, userId } = req.auth;

    const [team, members, projects] = await Promise.all([
      queryOne<{ id: string; name: string; github_org: string | null }>(
        'SELECT id, name, github_org FROM teams WHERE id = $1',
        [teamId]
      ),
      query<{ id: string; login: string; name: string; avatar_url: string }>(
        `SELECT id, login, name, avatar_url
         FROM   users
         WHERE  team_id = $1
         ORDER  BY created_at`,
        [teamId]
      ),
      query<{ id: string; name: string; repo_url: string | null; created_at: string }>(
        `SELECT id, name, repo_url, created_at
         FROM   projects
         WHERE  team_id = $1
         ORDER  BY created_at`,
        [teamId]
      ),
    ]);

    res.json({ data: { team, members, projects, userId } });
  } catch (err) {
    next(err);
  }
});

// POST /teams/projects — create a project under the current team
const createProjectSchema = z.object({
  name:    z.string().min(1).max(100),
  repoUrl: z.string().url().optional(),
});

teamsRouter.post('/projects', requireAuth, async (req, res, next) => {
  try {
    const { teamId } = req.auth;
    const body       = createProjectSchema.parse(req.body);

    const [project] = await query<{ id: string; created_at: string }>(
      `INSERT INTO projects (team_id, name, repo_url)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [teamId, body.name, body.repoUrl ?? null]
    );

    res.status(201).json({
      data: { id: project!.id, createdAt: project!.created_at },
    });
  } catch (err) {
    next(err);
  }
});

// GET /teams/projects/:projectId/stats — memory counts for the dashboard
teamsRouter.get('/projects/:projectId/stats', requireAuth, async (req, res, next) => {
  try {
    const { teamId }    = req.auth;
    const { projectId } = req.params;

    const project = await queryOne<{ id: string }>(
      'SELECT id FROM projects WHERE id = $1 AND team_id = $2',
      [projectId, teamId]
    );

    if (!project) {
      res.status(403).json({
        error: { message: 'Project not found or access denied', code: 'FORBIDDEN' },
      });
      return;
    }

    const stats = await queryOne<{
      event_count:   string;
      chunk_count:   string;
      member_count:  string;
      last_activity: string | null;
    }>(
      `SELECT
         COUNT(DISTINCT e.id)      AS event_count,
         COUNT(DISTINCT mc.id)     AS chunk_count,
         COUNT(DISTINCT e.user_id) AS member_count,
         MAX(e.created_at)         AS last_activity
       FROM  events e
       LEFT  JOIN memory_chunks mc ON mc.event_id = e.id
       WHERE e.project_id = $1`,
      [projectId]
    );

    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
});
