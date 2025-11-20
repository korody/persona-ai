// Funções para RAG (Retrieval-Augmented Generation)

import { createAdminClient } from '@/lib/supabase/server'

/**
 * Gera embedding de um texto usando OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Busca conhecimento relevante na base usando similaridade vetorial
 */
export async function searchKnowledge(
  query: string,
  avatarId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
) {
  const {
    matchThreshold = 0.7,
    matchCount = 3,
  } = options

  try {
    // Gerar embedding da query
    const queryEmbedding = await generateEmbedding(query)

    // Buscar no banco usando consulta SQL direta (contorna cache do RPC)
    const supabase = await createAdminClient()
    
    // Converter array para string no formato PostgreSQL
    const embeddingStr = `[${queryEmbedding.join(',')}]`
    
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .select('id, title, content, content_type, tags, embedding')
      .eq('avatar_id', avatarId)
      .eq('is_active', true)
      .limit(50) // Pegar mais para filtrar por similaridade

    if (error) {
      console.error('Error searching knowledge:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Calcular similaridade manualmente e filtrar
    const results = data
      .map((item) => {
        // Calcular produto escalar (dot product) para similaridade de cosseno
        const similarity = calculateCosineSimilarity(queryEmbedding, item.embedding)
        return {
          ...item,
          similarity,
        }
      })
      .filter((item) => item.similarity >= matchThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount)

    return results
  } catch (error) {
    console.error('Error in searchKnowledge:', error)
    return []
  }
}

/**
 * Calcula similaridade de cosseno entre dois vetores
 */
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * Formata conhecimento encontrado para injetar no prompt
 */
export function formatKnowledgeContext(knowledge: any[]): string {
  if (knowledge.length === 0) {
    return ''
  }

  const context = knowledge
    .map((item, index) => {
      return `
[Documento ${index + 1}: ${item.title}]
Tipo: ${item.content_type}
Conteúdo: ${item.content}
${item.tags?.length ? `Tags: ${item.tags.join(', ')}` : ''}
Relevância: ${(item.similarity * 100).toFixed(1)}%
`
    })
    .join('\n---\n')

  return `
CONHECIMENTO BASE RELEVANTE:
${context}

Use essas informações para complementar sua resposta quando apropriado.
Cite as fontes quando usar informações desses documentos.
`
}

/**
 * Adiciona conhecimento à base (com embedding)
 */
export async function addKnowledge(
  avatarId: string,
  title: string,
  content: string,
  contentType: string,
  tags: string[] = [],
  userId?: string | null
) {
  try {
    // Gerar embedding do conteúdo
    const embedding = await generateEmbedding(content)

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .insert({
        avatar_id: avatarId,
        title,
        content,
        content_type: contentType,
        tags,
        embedding,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error adding knowledge:', error)
    throw error
  }
}

/**
 * Atualiza conhecimento existente (regenera embedding)
 */
export async function updateKnowledge(
  knowledgeId: string,
  updates: {
    title?: string
    content?: string
    contentType?: string
    tags?: string[]
  }
) {
  try {
    const supabase = await createAdminClient()
    
    // Se o conteúdo mudou, regenerar embedding
    let embedding: number[] | undefined
    if (updates.content) {
      embedding = await generateEmbedding(updates.content)
    }

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    if (embedding) {
      updateData.embedding = embedding
    }

    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .update(updateData)
      .eq('id', knowledgeId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating knowledge:', error)
    throw error
  }
}
