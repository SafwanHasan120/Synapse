import { McpServer }            from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z }                    from 'zod';

const API_URL    = process.env['SYNAPSE_API_URL']    ?? 'http://localhost:3001';
const API_TOKEN  = process.env['SYNAPSE_API_TOKEN']  ?? '';
const PROJECT_ID = process.env['SYNAPSE_PROJECT_ID'] ?? '';
const AGENT_NAME = process.env['SYNAPSE_AGENT_NAME'] ?? 'mcp-agent';

if (!API_TOKEN)  { console.error('SYNAPSE_API_TOKEN is required');  process.exit(1); }
if (!PROJECT_ID) { console.error('SYNAPSE_PROJECT_ID is required'); process.exit(1); }

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Synapse API ${res.status} on ${path}: ${text}`);
  }
  const json = await res.json() as { data: T };
  return json.data;
}

interface SearchResultItem {
  unitId:  string;
  content: string;
  score:   number;
  provenance: {
    authorLogin: string;
    authorName:  string;
    authorType:  'human' | 'agent';
    agentName:   string | null;
    source:      string | null;
    createdAt:   string;
  };
}

interface ProposalResult {
  id:        string;
  state:     string;
  createdAt: string;
}

const ReadContextSchema = z.object({
  query: z.string().min(1).max(500)
    .describe('Natural language search query'),
  scope: z.enum(['repo','service','team','org']).optional()
    .describe("Optional scope filter: 'repo', 'service', 'team', or 'org'"),
  limit: z.number().int().min(1).max(20).default(8)
    .describe('Max results (default: 8)'),
}).strict();

const ProposeContextSchema = z.object({
  content: z.string().min(1).max(10_000)
    .describe('The fact, convention, or decision to capture — be specific and concise'),
  scope: z.enum(['repo','service','team','org']).default('team')
    .describe("Scope: 'repo', 'service', 'team', or 'org' (default: 'team')"),
  tags: z.array(z.string().max(50)).max(10).default([])
    .describe('Optional tags, e.g. ["auth","security"]'),
  source: z.string().max(500).optional()
    .describe('Where this came from, e.g. "PR #42", "ADR-003"'),
}).strict();

type ReadContextInput    = z.infer<typeof ReadContextSchema>;
type ProposeContextInput = z.infer<typeof ProposeContextSchema>;

const server = new McpServer({ name: 'synapse-mcp-server', version: '0.1.0' });

server.registerTool(
  'read_context',
  {
    title: 'Read Team Context',
    description: `Search Synapse for relevant team context. Returns accepted context units with provenance. Use before architectural decisions or when you need to understand how the team has solved a problem.

Args: query (string), scope (optional), limit (1-20, default 8)
Returns: Numbered results with score, author, source, and content.`,
    inputSchema: ReadContextSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  async (params: ReadContextInput) => {
    const results = await apiPost<SearchResultItem[]>('/search', {
      query:     params.query,
      projectId: PROJECT_ID,
      limit:     params.limit,
    });

    if (results.length === 0) {
      return {
        content:           [{ type: 'text' as const, text: 'No relevant context found for this query.' }],
        structuredContent: { results: [] as SearchResultItem[] },
      };
    }

    const text = results
      .map((r, i) => {
        const who  = r.provenance.authorType === 'agent'
          ? (r.provenance.agentName ?? 'agent')
          : r.provenance.authorLogin;
        const from = r.provenance.source ? ` | Source: ${r.provenance.source}` : '';
        return `[${i + 1}] Score: ${r.score.toFixed(3)} | By: ${who}${from}\n${r.content}`;
      })
      .join('\n\n');

    return {
      content:           [{ type: 'text' as const, text }],
      structuredContent: { results } as unknown as Record<string, unknown>,
    };
  }
);

server.registerTool(
  'propose_context',
  {
    title: 'Propose Team Context',
    description: `Propose a new context unit for human review. MUST be approved before becoming canonical. Use when you discover a convention mid-task or make an architectural decision.

Args: content (string, required), scope, tags, source (all optional)
Returns: Proposal ID confirming submission.`,
    inputSchema: ProposeContextSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
  async (params: ProposeContextInput) => {
    const result = await apiPost<ProposalResult>('/context-units/propose', {
      projectId:  PROJECT_ID,
      content:    params.content,
      scope:      params.scope,
      tags:       params.tags,
      source:     params.source ?? null,
      agentName:  AGENT_NAME,
      authorType: 'agent',
    });

    const text =
      `Context unit proposed (ID: ${result.id})\n` +
      `State: ${result.state}\n` +
      `A team member must review and approve this before it becomes canonical.`;

    return {
      content:           [{ type: 'text' as const, text }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
