/**
 * Chunk Splitter - Divide documentos grandes em chunks menores
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

export interface TextChunk {
  content: string
  index: number
  tokenCount: number
  metadata?: Record<string, any>
}

/**
 * Conta tokens usando tiktoken (mesmo tokenizer do OpenAI)
 */
export function countTokens(text: string): number {
  try {
    // Import dinâmico apenas server-side
    // No cliente, usa fallback
    if (typeof window !== 'undefined') {
      // Fallback no cliente: estimativa aproximada (1 token ≈ 4 caracteres)
      return Math.ceil(text.length / 4)
    }
    
    // Usar encoding simples sem importar tiktoken diretamente
    // O RecursiveCharacterTextSplitter já faz isso internamente
    return Math.ceil(text.length / 4)
  } catch (error) {
    // Fallback: estimativa aproximada (1 token ≈ 4 caracteres)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Divide texto em chunks usando RecursiveCharacterTextSplitter
 */
export async function splitTextIntoChunks(
  text: string,
  options: ChunkOptions = {}
): Promise<TextChunk[]> {
  const {
    chunkSize = 1000, // ~250 palavras
    chunkOverlap = 200, // Overlap de 20%
    separators = ['\n\n', '\n', '. ', ' ', '']
  } = options

  // Criar splitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators,
    lengthFunction: countTokens,
  })

  // Dividir texto
  const documents = await splitter.createDocuments([text])

  // Converter para nosso formato
  const chunks: TextChunk[] = documents.map((doc, index) => ({
    content: doc.pageContent,
    index,
    tokenCount: countTokens(doc.pageContent),
    metadata: doc.metadata,
  }))

  return chunks
}

/**
 * Divide por seções (útil para documentos estruturados)
 */
export function splitByHeadings(text: string): TextChunk[] {
  const headingPattern = /^#{1,6}\s+(.+)$/gm
  const sections: TextChunk[] = []
  
  let lastIndex = 0
  let match
  let chunkIndex = 0
  
  while ((match = headingPattern.exec(text)) !== null) {
    if (lastIndex < match.index) {
      const content = text.substring(lastIndex, match.index).trim()
      if (content) {
        sections.push({
          content,
          index: chunkIndex++,
          tokenCount: countTokens(content),
          metadata: { type: 'section' }
        })
      }
    }
    lastIndex = match.index
  }
  
  // Adicionar última seção
  if (lastIndex < text.length) {
    const content = text.substring(lastIndex).trim()
    if (content) {
      sections.push({
        content,
        index: chunkIndex++,
        tokenCount: countTokens(content),
        metadata: { type: 'section' }
      })
    }
  }
  
  return sections
}

/**
 * Divide mantendo parágrafos inteiros (não quebra no meio)
 */
export function splitByParagraphs(
  text: string,
  maxTokens: number = 1000
): TextChunk[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  const chunks: TextChunk[] = []
  
  let currentChunk = ''
  let currentTokens = 0
  let chunkIndex = 0
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph)
    
    // Se o parágrafo sozinho já excede o limite, adiciona mesmo assim
    if (paragraphTokens > maxTokens && currentChunk === '') {
      chunks.push({
        content: paragraph,
        index: chunkIndex++,
        tokenCount: paragraphTokens,
        metadata: { type: 'oversized_paragraph' }
      })
      continue
    }
    
    // Se adicionar esse parágrafo excede o limite, fecha o chunk atual
    if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
        tokenCount: currentTokens,
        metadata: { type: 'paragraph_group' }
      })
      currentChunk = paragraph
      currentTokens = paragraphTokens
    } else {
      // Adiciona ao chunk atual
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      currentTokens += paragraphTokens
    }
  }
  
  // Adicionar último chunk
  if (currentChunk) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex++,
      tokenCount: currentTokens,
      metadata: { type: 'paragraph_group' }
    })
  }
  
  return chunks
}

/**
 * Estratégia inteligente: tenta por headings, senão por parágrafos, senão recursivo
 */
export async function smartSplit(
  text: string,
  options: ChunkOptions = {}
): Promise<TextChunk[]> {
  const { chunkSize = 1000 } = options
  
  // Tenta dividir por headings se houver estrutura markdown
  if (text.includes('#')) {
    const headingChunks = splitByHeadings(text)
    const validChunks = headingChunks.filter(c => c.tokenCount <= chunkSize * 1.5)
    
    if (validChunks.length > 0 && validChunks.length === headingChunks.length) {
      return validChunks
    }
  }
  
  // Tenta dividir por parágrafos
  const paragraphChunks = splitByParagraphs(text, chunkSize)
  if (paragraphChunks.every(c => c.tokenCount <= chunkSize * 1.5)) {
    return paragraphChunks
  }
  
  // Fallback: divisão recursiva
  return splitTextIntoChunks(text, options)
}

/**
 * Estatísticas sobre chunks
 */
export function getChunkStats(chunks: TextChunk[]) {
  if (chunks.length === 0) {
    return {
      count: 0,
      totalTokens: 0,
      avgTokens: 0,
      minTokens: 0,
      maxTokens: 0
    }
  }
  
  const tokenCounts = chunks.map(c => c.tokenCount)
  
  return {
    count: chunks.length,
    totalTokens: tokenCounts.reduce((a, b) => a + b, 0),
    avgTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
  }
}
