-- Drop old tables — cascades handle FK references
DROP TABLE IF EXISTS memory_chunks;
DROP TABLE IF EXISTS events;

-- Context Units: atomic governed facts/decisions
CREATE TABLE context_units (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  embedding   vector(1536),
  scope       TEXT        NOT NULL DEFAULT 'team'
                          CHECK (scope IN ('repo','service','team','org')),
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  state       TEXT        NOT NULL DEFAULT 'proposed'
                          CHECK (state IN ('proposed','accepted','rejected','superseded')),
  author_id   UUID        REFERENCES users(id) ON DELETE SET NULL,
  author_type TEXT        NOT NULL DEFAULT 'human'
                          CHECK (author_type IN ('human','agent')),
  agent_name  TEXT,
  source      TEXT,
  confidence  FLOAT       NOT NULL DEFAULT 1.0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX context_units_project_idx       ON context_units (project_id);
CREATE INDEX context_units_project_state_idx ON context_units (project_id, state);

-- Reviews: append-only approval/rejection audit log
CREATE TABLE reviews (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_unit_id UUID        NOT NULL REFERENCES context_units(id) ON DELETE CASCADE,
  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL
                              CHECK (action IN ('approved','rejected')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reviews_context_unit_idx ON reviews (context_unit_id);
CREATE INDEX reviews_project_idx      ON reviews (project_id);
