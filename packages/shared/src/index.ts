// ─── Context Unit — the new core primitive ─────────────────────────

export type ContextUnitState =
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'superseded';

export interface ContextUnit {
  id:          string;
  projectId:   string;
  content:     string;
  scope:       string;
  tags:        string[];
  state:       ContextUnitState;
  authorId:    string | null;
  authorType:  'human' | 'agent';
  agentName:   string | null;
  source:      string | null;
  confidence:  number;
  createdAt:   string;
  updatedAt:   string;
}

export interface Review {
  id:            string;
  contextUnitId: string;
  reviewerId:    string;
  action:        'approved' | 'rejected';
  note:          string | null;
  createdAt:     string;
}

// ─── Search ────────────────────────────────────────────────────────

export interface SearchResult {
  chunkId:    string;
  unitId:     string;
  content:    string;
  score:      number;
  provenance: {
    authorLogin: string;
    authorName:  string;
    authorType:  'human' | 'agent';
    agentName:   string | null;
    source:      string | null;
    createdAt:   string;
  };
}

// ─── Auth ──────────────────────────────────────────────────────────

export interface JwtPayload {
  sub:    string;
  teamId: string;
  iat:    number;
  exp:    number;
}

export interface ApiError {
  error: { message: string; code: string };
}

// ─── User / Team ───────────────────────────────────────────────────

export interface User {
  id:        string;
  githubId:  number;
  login:     string;
  name:      string;
  avatarUrl: string;
  email:     string | null;
}

export interface Team {
  id:             string;
  name:           string;
  githubOrgLogin: string | null;
}

export interface Project {
  id:      string;
  teamId:  string;
  name:    string;
  repoUrl: string | null;
}
