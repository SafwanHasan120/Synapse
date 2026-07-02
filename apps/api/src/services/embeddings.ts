import OpenAI from 'openai';
import { config } from '../config.js';
import { query }  from '../db/index.js';
import { logger } from '../middleware/logger.js';
import type { SearchResult } from '@synapse/shared';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// Embed one or more texts via OpenAI — returns vectors in input order
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model:           'text-embedding-3-small',
    input:           texts,
    encoding_format: 'float',
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

// Embed a single context unit and write the vector back to its row.
// Called after a CU is approved — never on proposal.
// Errors are logged but not thrown: the CU is already accepted, a failed
// embedding is a background concern, not a request failure.
export async function embedContextUnit(
  unitId:  string,
  content: string
): Promise<void> {
  try {
    const [embedding] = await getEmbeddings([content]);

    if (!embedding) {
      logger.error({ unitId }, 'No embedding returned from OpenAI');
      return;
    }

    const vectorLiteral = `[${embedding.join(',')}]`;

    await query(
      `UPDATE context_units
         SET embedding  = $1::vector,
             updated_at = NOW()
       WHERE id = $2`,
      [vectorLiteral, unitId]
    );

    logger.info({ unitId }, 'Context unit embedded');
  } catch (err) {
    logger.error({ err, unitId }, 'Failed to embed context unit');
  }
}

// Semantic search over accepted, embedded context units.
// Returns results with full provenance — who proposed it, which agent, source session.
export async function semanticSearch(
  projectId: string,
  queryText: string,
  limit:     number
): Promise<SearchResult[]> {
  const [queryEmbedding] = await getEmbeddings([queryText]);

  if (!queryEmbedding) {
    throw new Error('Failed to generate query embedding');
  }

  const vectorLiteral = `[${queryEmbedding.join(',')}]`;

  const rows = await query<{
    unit_id:      string;
    content:      string;
    score:        number;
    author_login: string | null;
    author_name:  string | null;
    author_type:  string;
    agent_name:   string | null;
    source:       string | null;
    created_at:   string;
  }>(
    `SELECT
       cu.id                                    AS unit_id,
       cu.content,
       1 - (cu.embedding <=> $1::vector)       AS score,
       u.login                                  AS author_login,
       u.name                                   AS author_name,
       cu.author_type,
       cu.agent_name,
       cu.source,
       cu.created_at
     FROM  context_units cu
     LEFT  JOIN users u ON u.id = cu.author_id
     WHERE cu.project_id = $2
       AND cu.state     = 'accepted'
       AND cu.embedding IS NOT NULL
       AND 1 - (cu.embedding <=> $1::vector) > 0.5
     ORDER BY cu.embedding <=> $1::vector
     LIMIT  $3`,
    [vectorLiteral, projectId, limit]
  );

  return rows.map(r => ({
    chunkId: r.unit_id,
    unitId:  r.unit_id,
    content: r.content,
    score:   Number(r.score),
    provenance: {
      authorLogin: r.author_login ?? 'unknown',
      authorName:  r.author_name  ?? 'unknown',
      authorType:  r.author_type as 'human' | 'agent',
      agentName:   r.agent_name,
      source:      r.source,
      createdAt:   r.created_at,
    },
  }));
}
