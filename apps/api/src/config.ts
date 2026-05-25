import { z } from 'zod';

const schema = z.object({
  NODE_ENV:              z.enum(['development','production','test']).default('development'),
  PORT:                  z.coerce.number().default(3001),
  DATABASE_URL:          z.string().url(),
  JWT_SECRET:            z.string().min(32),
  JWT_EXPIRES_IN:        z.string().default('7d'),
  GITHUB_CLIENT_ID:      z.string().min(1),
  GITHUB_CLIENT_SECRET:  z.string().min(1),
  GITHUB_REDIRECT_URI:   z.string().url(),
  OPENAI_API_KEY:        z.string().startsWith('sk-'),
  SENTRY_DSN:            z.string().url().optional(),
  NEXT_PUBLIC_APP_URL:   z.string().url().default('http://localhost:3000'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  console.error('\nMissing or invalid environment variables:\n');
  for (const [key, msgs] of Object.entries(
    result.error.flatten().fieldErrors
  )) {
    console.error(`   ${key}: ${msgs?.join(', ')}`);
  }
  console.error('\n   Check your .env file.\n');
  process.exit(1);
}

export const config = result.data;