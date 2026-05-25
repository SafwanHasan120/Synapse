CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE teams (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  github_org TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id    UUID        REFERENCES teams(id) ON DELETE CASCADE,
  github_id  BIGINT      UNIQUE NOT NULL,
  login      TEXT        NOT NULL,
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT,
  avatar_url TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id    UUID        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  repo_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX events_project_idx    ON events (project_id);
CREATE INDEX events_created_at_idx ON events (created_at DESC);

-- This is the core table — stores the vector embeddings
CREATE TABLE memory_chunks (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID        NOT NULL REFERENCES events(id)   ON DELETE CASCADE,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  embedding   vector(1536),
  chunk_index INTEGER     NOT NULL DEFAULT 0,
  token_count INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX memory_chunks_project_idx ON memory_chunks (project_id);

-- Only add this ivfflat index after you have >1000 rows
-- CREATE INDEX memory_chunks_embedding_idx
--   ON memory_chunks USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);