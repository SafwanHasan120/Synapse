import { cookies } from 'next/headers';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function apiFetch<T>(path: string): Promise<T> {
  const token = cookies().get('synapse_token')?.value;
  if (!token) throw new Error('UNAUTHORIZED');

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);

  const json = await res.json() as { data: T };
  return json.data;
}

export interface TeamData {
  team:     { id: string; name: string; github_org: string | null };
  members:  Array<{ id: string; login: string; name: string; avatar_url: string }>;
  projects: Array<{ id: string; name: string; repo_url: string | null; created_at: string }>;
  userId:   string;
}

export interface QueueItem {
  id:           string;
  content:      string;
  scope:        string;
  tags:         string[];
  author_type:  'human' | 'agent';
  agent_name:   string | null;
  source:       string | null;
  author_login: string | null;
  author_name:  string | null;
  created_at:   string;
}

export interface KnowledgeItem extends QueueItem {
  updated_at: string;
}

export interface StatsData {
  total_count:    string;
  accepted_count: string;
  pending_count:  string;
  last_activity:  string | null;
}

export async function getTeamData(): Promise<TeamData> {
  return apiFetch<TeamData>('/teams/me');
}

export async function getQueue(projectId: string): Promise<QueueItem[]> {
  return apiFetch<QueueItem[]>(`/context-units/queue?projectId=${projectId}`);
}

export async function getKnowledge(projectId: string): Promise<KnowledgeItem[]> {
  return apiFetch<KnowledgeItem[]>(`/context-units?projectId=${projectId}`);
}

export async function getStats(projectId: string): Promise<StatsData> {
  return apiFetch<StatsData>(`/teams/projects/${projectId}/stats`);
}
