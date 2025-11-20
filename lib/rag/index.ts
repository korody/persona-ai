/**
 * RAG System - Export all functions
 */

// Document processing
export * from './document-parser'
export * from './chunk-splitter'

// Embeddings
export * from './embeddings'

// Vector search
export * from './vector-search'

// Legacy exports (manter compatibilidade)
export {
  generateEmbedding,
  generateEmbeddings,
  generateEmbeddingsBatch,
  estimateEmbeddingCost,
} from './embeddings'

export {
  searchKnowledge,
  searchKnowledgeGeneric,
  searchChunks,
  searchHybrid,
  searchExamples,
  formatKnowledgeContext,
  formatKnowledgeContextWithAnamnese,
  formatExamples,
} from './vector-search'

export {
  parseDocument,
  parsePDF,
  parseDOCX,
  parseTXT,
  detectDocumentType,
  cleanText,
} from './document-parser'

export {
  splitTextIntoChunks,
  splitByHeadings,
  splitByParagraphs,
  smartSplit,
  countTokens,
  getChunkStats,
} from './chunk-splitter'
