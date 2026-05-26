import { Router }               from 'express';
import jwt                      from 'jsonwebtoken';
import { config }               from '../config.js';
import { query, queryOne }      from '../db/index.js';
import { requireAuth }          from '../middleware/auth.js';
import { logger }               from '../middleware/logger.js';

export const authRouter: Router = Router();

// Step 1: redirect the browser to GitHub's login page
authRouter.get('/github', (_req, res) => {
  const params = new URLSearchParams({
    client_id:    config.GITHUB_CLIENT_ID,
    redirect_uri: config.GITHUB_REDIRECT_URI,
    scope:        'read:user user:email',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// Step 2: GitHub redirects here with a one-time code
authRouter.get('/github/callback', async (req, res) => {
  const { code } = req.query;

  if (typeof code !== 'string') {
    res.status(400).json({
      error: { message: 'Missing code parameter', code: 'BAD_REQUEST' },
    });
    return;
  }

  try {
    // Step 3: exchange code for GitHub access token (server-to-server)
    const tokenRes = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({
          client_id:     config.GITHUB_CLIENT_ID,
          client_secret: config.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json() as {
      access_token?: string;
      error?:        string;
    };

    if (!tokenData.access_token) {
      logger.warn({ githubError: tokenData.error }, 'GitHub token exchange failed');
      res.status(400).json({
        error: { message: 'GitHub OAuth failed', code: 'OAUTH_ERROR' },
      });
      return;
    }

    // Step 4: fetch GitHub user profile using the access token
    const ghUser = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent':  'memex/1.0',
      },
    }).then(r => r.json()) as {
      id:         number;
      login:      string;
      name:       string | null;
      avatar_url: string;
      email:      string | null;
    };

    // Upsert: return existing user or create a new one
    const existing = await queryOne<{ id: string; team_id: string }>(
      'SELECT id, team_id FROM users WHERE github_id = $1',
      [ghUser.id]
    );

    let userId: string;
    let teamId: string;

    if (existing) {
      userId = existing.id;
      teamId = existing.team_id;
      // Refresh profile in case name or avatar changed on GitHub
      await query(
        'UPDATE users SET login=$1, name=$2, avatar_url=$3 WHERE id=$4',
        [ghUser.login, ghUser.name ?? ghUser.login, ghUser.avatar_url, userId]
      );
    } else {
      // New user — create team first (FK constraint), then user
      const [team] = await query<{ id: string }>(
        'INSERT INTO teams (name) VALUES ($1) RETURNING id',
        [`${ghUser.login}'s workspace`]
      );
      teamId = team!.id;

      const [user] = await query<{ id: string }>(
        `INSERT INTO users
           (team_id, github_id, login, name, email, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          teamId,
          ghUser.id,
          ghUser.login,
          ghUser.name ?? ghUser.login,
          ghUser.email,
          ghUser.avatar_url,
        ]
      );
      userId = user!.id;
    }

    // Issue our own JWT — scoped to this API only
    // We discard GitHub's access_token after getting the user profile
    const signOptions: jwt.SignOptions | undefined = config.JWT_EXPIRES_IN
      ? ({ expiresIn: config.JWT_EXPIRES_IN } as unknown as jwt.SignOptions)
      : undefined;

    const token = jwt.sign(
      { sub: userId, teamId },
      config.JWT_SECRET as string | Buffer,
      signOptions
    );

    logger.info({ userId, teamId }, 'User authenticated');

    // Browser clients get a redirect; API/extension clients get JSON
    const acceptsHtml = (req.headers.accept ?? '').includes('text/html');
    if (acceptsHtml) {
      res.redirect(`${config.NEXT_PUBLIC_APP_URL}/auth/success?token=${token}`);
    } else {
      res.json({ data: { token, userId, teamId } });
    }
  } catch (err) {
    logger.error({ err }, 'OAuth callback error');
    res.status(500).json({
      error: { message: 'Authentication failed', code: 'INTERNAL_ERROR' },
    });
  }
});

// GET /auth/me — lets the extension verify its token and get user info
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await queryOne<{
      id:         string;
      login:      string;
      name:       string;
      avatar_url: string;
      email:      string | null;
      team_id:    string;
    }>(
      'SELECT id, login, name, avatar_url, email, team_id FROM users WHERE id = $1',
      [req.auth.userId]
    );

    if (!user) {
      res.status(404).json({
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
      return;
    }

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});
