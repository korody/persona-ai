/**
 * Vector Search Functions for RAG System
 * Includes anamnese-aware filtering and BAÇO→TERRA mapping
 */

import { createAdminClient } from '@/lib/supabase/server'
import { generateEmbedding } from './embeddings'
import type { QuizLead } from '@/lib/types/anamnese'

// ============================================================================
// ELEMENTO MAPPING - Maps organs/systems to their element
// MTC: 5 Elementos e seus órgãos correspondentes
// ============================================================================

const ELEMENTO_MAP: Record<string, string> = {
  // TERRA (土 - Tǔ)
  'BAÇO': 'TERRA',
  'BACO': 'TERRA',
  'ESTOMAGO': 'TERRA',
  'ESTÔMAGO': 'TERRA',
  'PÂNCREAS': 'TERRA',
  'PANCREAS': 'TERRA',
  
  // METAL (金 - Jīn)
  'PULMÃO': 'METAL',
  'PULMAO': 'METAL',
  'INTESTINO GROSSO': 'METAL',
  'INTESTINO-GROSSO': 'METAL',
  
  // ÁGUA (水 - Shuǐ)
  'RIM': 'ÁGUA',
  'RINS': 'ÁGUA',
  'BEXIGA': 'ÁGUA',
  'AGUA': 'ÁGUA',
  
  // MADEIRA (木 - Mù)
  'FÍGADO': 'MADEIRA',
  'FIGADO': 'MADEIRA',
  'VESÍCULA': 'MADEIRA',
  'VESÍCULA BILIAR': 'MADEIRA',
  'VESICULA': 'MADEIRA',
  'VESICULA BILIAR': 'MADEIRA',
  
  // FOGO (火 - Huǒ)
  'CORAÇÃO': 'FOGO',
  'CORACAO': 'FOGO',
  'INTESTINO DELGADO': 'FOGO',
  'INTESTINO-DELGADO': 'FOGO',
}

/**
 * Normaliza elemento para o nome padrão (ex: BAÇO → TERRA, PULMÃO → METAL)
 * Garante que órgãos sejam convertidos para seus elementos correspondentes
 */
function normalizeElemento(elemento: string | undefined | null): string {
  if (!elemento) return ''
  const upper = elemento.toUpperCase().trim()
  return ELEMENTO_MAP[upper] || elemento
}

// ============================================================================
// TYPES
// ============================================================================

export interface SearchResult {
  id: string
  content: string
  similarity: number
  title?: string
  content_type?: string
  tags?: string[]
  metadata?: any
  category?: string
}

export interface AnamneseSearchResult extends SearchResult {
  elemento: string | null
  is_primary: boolean
  is_secondary: boolean
}

export interface ExampleResult {
  id: string
  user_message: string
  assistant_response: string
  similarity: number
  title?: string
  category?: string
  tags?: string[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
 * Parse embedding from string to array if needed
 */
function parseEmbedding(embedding: any): number[] | null {
  if (Array.isArray(embedding)) {
    return embedding
  }
  
  if (typeof embedding === 'string') {
    try {
      const cleaned = embedding.replace(/^\[|\]$/g, '')
      const parsed = cleaned.split(',').map((v: string) => parseFloat(v.trim()))
      return parsed.length === 1536 ? parsed : null
    } catch {
      return null
    }
  }
  
  return null
}

/**
 * Get secondary elementos from anamnese (score > 2)
 */
function getSecondaryElementos(
  contagemElementos: Record<string, number>,
  elementoPrincipal: string
): string[] {
  return Object.entries(contagemElementos)
    .filter(([elem, count]) => elem !== elementoPrincipal && count > 2)
    .map(([elem]) => normalizeElemento(elem))
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Generic knowledge search - used when user has NO anamnese
 */
export async function searchKnowledgeGeneric(
  query: string,
  avatarId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
): Promise<SearchResult[]> {
  const {
    matchThreshold = 0.4,
    matchCount = 5,
  } = options

  try {
    const queryEmbedding = await generateEmbedding(query)
    const supabase = await createAdminClient()

    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding, metadata')
      .eq('avatar_id', avatarId)
      .limit(100)

    if (error || !chunks || chunks.length === 0) {
      return []
    }

    // Parse embeddings and calculate similarity
    const validChunks = chunks
      .map((chunk: any) => ({
        ...chunk,
        embedding: parseEmbedding(chunk.embedding)
      }))
      .filter((chunk: any) => chunk.embedding !== null)

    const results = validChunks
      .map((chunk: any) => {
        const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding)
        return {
          id: chunk.id,
          content: chunk.content,
          similarity,
          title: chunk.metadata?.title,
          category: chunk.metadata?.category,
          metadata: chunk.metadata,
        }
      })
      .filter((r) => r.similarity >= matchThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount)

    return results
  } catch (error) {
    console.error('Error in searchKnowledgeGeneric:', error)
    return []
  }
}

/**
 * Anamnese-aware knowledge search - filters by elemento principal + secundários
 * Includes BAÇO→TERRA mapping for elemento matching
 */
export async function searchKnowledgeWithAnamnese(
  query: string,
  avatarId: string,
  quizLead: QuizLead,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
): Promise<AnamneseSearchResult[]> {
  const {
    matchThreshold = 0.3,
    matchCount = 5,
  } = options

  try {
    const queryEmbedding = await generateEmbedding(query)
    const supabase = await createAdminClient()

    // Map BAÇO to TERRA for matching
    const elementoPrincipal = normalizeElemento(quizLead.elemento_principal)
    const elementosSecundarios = getSecondaryElementos(
      quizLead.contagem_elementos,
      quizLead.elemento_principal
    )

    const { data: chunks, error } = await supabase
      .from('knowledge_chunks')
      .select('id, content, embedding, metadata')
      .eq('avatar_id', avatarId)
      .limit(100)

    if (error || !chunks || chunks.length === 0) {
      return []
    }

    // Parse embeddings and calculate similarity
    const validChunks = chunks
      .map((chunk: any) => ({
        ...chunk,
        embedding: parseEmbedding(chunk.embedding)
      }))
      .filter((chunk: any) => chunk.embedding !== null)

    const results = validChunks
      .map((chunk: any) => {
        const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding)
        const chunkElemento = chunk.metadata?.elemento as string | undefined
        
        // Map chunk elemento (BAÇO→TERRA)
        const mappedChunkElemento = normalizeElemento(chunkElemento)
        
        const isPrimary = mappedChunkElemento === elementoPrincipal
        const isSecondary = mappedChunkElemento ? elementosSecundarios.includes(mappedChunkElemento) : false

        return {
          id: chunk.id,
          content: chunk.content,
          similarity,
          elemento: mappedChunkElemento,
          is_primary: isPrimary,
          is_secondary: isSecondary,
          title: chunk.metadata?.title,
          category: chunk.metadata?.category,
          metadata: chunk.metadata,
        }
      })
      .filter((r) => r.similarity >= matchThreshold)
      .sort((a, b) => {
        // Priority: Primary > Secondary > General, then by similarity
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        if (a.is_secondary && !b.is_secondary) return -1
        if (!a.is_secondary && b.is_secondary) return 1
        return b.similarity - a.similarity
      })
      .slice(0, matchCount)

    return results
  } catch (error) {
    console.error('Error in searchKnowledgeWithAnamnese:', error)
    return []
  }
}

/**
 * Legacy function - alias for searchKnowledgeGeneric
 */
export async function searchKnowledge(
  query: string,
  avatarId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
): Promise<SearchResult[]> {
  return searchKnowledgeGeneric(query, avatarId, options)
}

/**
 * Search knowledge chunks (low-level access)
 */
export async function searchChunks(
  query: string,
  avatarId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
): Promise<SearchResult[]> {
  return searchKnowledgeGeneric(query, avatarId, options)
}

/**
 * Hybrid search combining multiple strategies
 */
export async function searchHybrid(
  query: string,
  avatarId: string,
  options: {
    matchThreshold?: number
    matchCount?: number
  } = {}
): Promise<SearchResult[]> {
  // For now, just use generic search
  // Can be enhanced later with keyword + semantic search combination
  return searchKnowledgeGeneric(query, avatarId, options)
}

/**
 * Search conversation examples
 */
export async function searchExamples(
  query: string,
  avatarId: string,
  matchCount: number = 3
): Promise<ExampleResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query)
    const supabase = await createAdminClient()

    const { data: examples, error } = await supabase
      .from('avatar_conversation_examples')
      .select('id, user_message, assistant_response, category, tags, embedding')
      .eq('avatar_id', avatarId)
      .eq('is_active', true)
      .limit(50)

    if (error || !examples || examples.length === 0) {
      return []
    }

    // Parse embeddings and calculate similarity
    const validExamples = examples
      .map((example: any) => ({
        ...example,
        embedding: parseEmbedding(example.embedding)
      }))
      .filter((example: any) => example.embedding !== null)

    const results = validExamples
      .map((example: any) => {
        const similarity = calculateCosineSimilarity(queryEmbedding, example.embedding)
        return {
          id: example.id,
          user_message: example.user_message,
          assistant_response: example.assistant_response,
          similarity,
          title: example.title,
          category: example.category,
          tags: example.tags,
        }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, matchCount)

    return results
  } catch (error) {
    console.error('Error in searchExamples:', error)
    return []
  }
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format knowledge context for generic search (no anamnese)
 */
export function formatKnowledgeContext(knowledge: SearchResult[]): string {
  if (knowledge.length === 0) {
    return ''
  }

  const context = knowledge
    .map((item, index) => {
      return `
[Documento ${index + 1}: ${item.title || 'Sem título'}]
${item.category ? `Categoria: ${item.category}` : ''}
Conteúdo: ${item.content}
${item.metadata?.tags?.length ? `Tags: ${item.metadata.tags.join(', ')}` : ''}
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
 * Format knowledge context with anamnese filtering info
 */
export function formatKnowledgeContextWithAnamnese(knowledge: AnamneseSearchResult[]): string {
  if (knowledge.length === 0) {
    return ''
  }

  const context = knowledge
    .map((item, index) => {
      const badge = item.is_primary 
        ? '⭐ ELEMENTO PRINCIPAL' 
        : item.is_secondary 
          ? '⚠️ ELEMENTO SECUNDÁRIO' 
          : '📄 CONHECIMENTO GERAL'
      
      return `
[Documento ${index + 1}: ${item.title || 'Sem título'}]
${badge} ${item.elemento ? `(${item.elemento})` : ''}
${item.category ? `Categoria: ${item.category}` : ''}
Conteúdo: ${item.content}
${item.metadata?.tags?.length ? `Tags: ${item.metadata.tags.join(', ')}` : ''}
Relevância: ${(item.similarity * 100).toFixed(1)}%
`
    })
    .join('\n---\n')

  return `
CONHECIMENTO BASE RELEVANTE (FILTRADO POR ANAMNESE):
${context}

IMPORTANTE: Este conhecimento foi filtrado baseado no elemento principal do paciente.
Os documentos marcados com ⭐ são específicos do elemento em desequilíbrio.
Priorize essas informações ao formular sua resposta.
`
}

/**
 * Format conversation examples
 */
export function formatExamples(examples: ExampleResult[]): string {
  if (examples.length === 0) {
    return ''
  }

  const context = examples
    .map((item, index) => {
      return `
[Exemplo ${index + 1}]
${item.category ? `Categoria: ${item.category}` : ''}
Pergunta do Usuário: ${item.user_message}
Resposta do Assistente: ${item.assistant_response}
Similaridade: ${(item.similarity * 100).toFixed(1)}%
`
    })
    .join('\n---\n')

  return `
${context}

Use estes exemplos como referência de tom e estilo de resposta.
Não copie as respostas literalmente, mas mantenha o mesmo nível de empatia e profundidade.
`
}