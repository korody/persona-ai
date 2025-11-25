/**
 * RAG Client-Side com SQL Direto
 * Bypass temporário para o problema de cache do PostgREST
 */

import { generateEmbedding } from '@/lib/rag/embeddings'
import type { SearchResult } from '@/lib/rag/vector-search'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY!

/**
 * Executa SQL direto no banco via fetch (bypass PostgREST cache)
 */
async function executeSql(sql: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ sql })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error))
  }

  return response.json()
}

/**
 * Insere conhecimento via SQL direto
 */
export async function insertKnowledgeDirect(
  avatarId: string,
  title: string,
  content: string,
  contentType: string = 'text',
  tags: string[] = [],
  metadata: Record<string, any> = {}
): Promise<string> {
  // Gerar embedding
  const embedding = await generateEmbedding(content)
  
  const sql = `
    INSERT INTO avatar_knowledge_base (
      avatar_id, title, content, content_type, tags, metadata, embedding
    ) VALUES (
      '${avatarId}',
      '${title.replace(/'/g, "''")}',
      '${content.replace(/'/g, "''")}',
      '${contentType}',
      ARRAY[${tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[],
      '${JSON.stringify(metadata)}'::jsonb,
      '[${embedding.join(',')}]'::vector
    )
    RETURNING id;
  `

  const result = await executeSql(sql)
  return result[0]?.id
}

/**
 * Busca conhecimento via SQL direto
 */
export async function searchKnowledgeDirect(
  query: string,
  avatarId: string,
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<SearchResult[]> {
  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)
  
  const sql = `
    SELECT
      id,
      title,
      content,
      content_type,
      tags,
      metadata,
      1 - (embedding <=> '[${queryEmbedding.join(',')}]'::vector) as similarity
    FROM avatar_knowledge_base
    WHERE avatar_id = '${avatarId}'
      AND 1 - (embedding <=> '[${queryEmbedding.join(',')}]'::vector) >= ${matchThreshold}
    ORDER BY embedding <=> '[${queryEmbedding.join(',')}]'::vector
    LIMIT ${matchCount};
  `

  const results = await executeSql(sql)
  
  return results.map((item: any) => ({
    id: item.id,
    content: item.content,
    similarity: item.similarity,
    title: item.title,
    content_type: item.content_type,
    tags: item.tags,
    metadata: item.metadata,
  }))
}

/**
 * Insere exemplo de conversa via SQL direto
 */
export async function insertExampleDirect(
  avatarId: string,
  userMessage: string,
  assistantResponse: string,
  category?: string,
  tags: string[] = []
): Promise<string> {
  const sql = `
    INSERT INTO avatar_conversation_examples (
      avatar_id, user_message, assistant_response, category, tags
    ) VALUES (
      '${avatarId}',
      '${userMessage.replace(/'/g, "''")}',
      '${assistantResponse.replace(/'/g, "''")}',
      ${category ? `'${category.replace(/'/g, "''")}'` : 'NULL'},
      ARRAY[${tags.map(t => `'${t.replace(/'/g, "''")}'`).join(',')}]::text[]
    )
    RETURNING id;
  `

  const result = await executeSql(sql)
  return result[0]?.id
}

/**
 * Busca exemplos via SQL direto
 */
export async function searchExamplesDirect(
  avatarId: string,
  limit: number = 5
): Promise<Array<{ user_message: string; assistant_response: string; category?: string }>> {
  const sql = `
    SELECT user_message, assistant_response, category
    FROM avatar_conversation_examples
    WHERE avatar_id = '${avatarId}'
      AND is_active = true
    ORDER BY order_index
    LIMIT ${limit};
  `

  const results = await executeSql(sql)
  return results
}
