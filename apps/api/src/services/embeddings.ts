import OpenAI from 'openai';
import { config } from '../config.js';
import { query }  from '../db/index.js';
import { logger } from '../middleware/logger.js';

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

// Configuration constants
const CHUNK_SIZE = 400;      // tokens per chunk
const CHUNK_OVERLAP = 50;    // tokens overlap between chunks
const MIN_CHUNK_SIZE = 30;   // minimum tokens to keep a chunk

// Split text into overlapping chunks of ~CHUNK_SIZE words
export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    // Take CHUNK_SIZE words starting at position i
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ');

    // Only keep chunks that are long enough
    if (chunk.trim().split(/\s+/).length >= MIN_CHUNK_SIZE) {
      chunks.push(chunk);
    }

    // Move forward by (CHUNK_SIZE - CHUNK_OVERLAP) so chunks overlap
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

// Call OpenAI to embed multiple texts at once
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    encoding_format: 'float',
  });

  // response.data is array of { embedding: number[] }
  // Sort by index to match input order
  const sorted = response.data.sort((a, b) => a.index - b.index);
  return sorted.map(d => d.embedding);
}

export async function embedAndStore(
  eventId: string,
  projectId: string,
  content: string
): Promise<void> {
  try {
    const chunks = chunkText(content);

    if (chunks.length === 0) {
      logger.warn({ eventId }, 'No chunks produced from content');
      return;
    }

    // Get embeddings for all chunks in one API call
    const embeddings = await getEmbeddings(chunks);

    logger.debug(
      { eventId, chunkCount: chunks.length },
      'Got embeddings from OpenAI'
    );

    // Insert each chunk + embedding into memory_chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      if (!chunk || !embedding) {
        logger.error({ eventId, index: i }, 'Missing embedding at index');
        continue;
      }

      // Convert number array to Postgres vector literal: [0.1,-0.2,0.3,...]
      const vectorLiteral = `[${embedding.join(',')}]`;
      const tokenCount = chunk.split(/\s+/).length;

      await query(
        `INSERT INTO memory_chunks
           (event_id, project_id, content, embedding, chunk_index, token_count)
         VALUES ($1, $2, $3, $4::vector, $5, $6)`,
        [eventId, projectId, chunk, vectorLiteral, i, tokenCount]
      );
    }

    logger.info({ eventId, chunks: chunks.length }, 'Embeddings stored');
  } catch (err) {
    // Log the error but don't throw — the event is already created
    // The user got their 201 response; they shouldn't see this error
    logger.error(
      { err, eventId, projectId },
      'Failed to embed and store event'
    );
  }
}
