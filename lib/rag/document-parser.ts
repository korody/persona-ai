/**
 * Document Parser - Parse PDF, DOCX e TXT para texto puro
 */

import mammoth from 'mammoth'

// PDF parse não é usado no cliente, apenas server-side
// Vamos comentar por enquanto para não quebrar o build
// import pdf from 'pdf-parse'

export type DocumentType = 'pdf' | 'docx' | 'txt' | 'md' | 'unknown'

export interface ParsedDocument {
  text: string
  pageCount?: number
  metadata?: Record<string, any>
}

/**
 * Detecta o tipo de documento pelo buffer
 */
export function detectDocumentType(buffer: Buffer, filename?: string): DocumentType {
  // Check magic numbers
  const pdfMagic = buffer.toString('utf-8', 0, 5)
  if (pdfMagic === '%PDF-') {
    return 'pdf'
  }

  // DOCX é um ZIP que contém word/document.xml
  const zipMagic = buffer.toString('hex', 0, 4)
  if (zipMagic === '504b0304') {
    return 'docx'
  }

  // Fallback para extensão do arquivo
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx' || ext === 'doc') return 'docx'
    if (ext === 'txt') return 'txt'
    if (ext === 'md' || ext === 'markdown') return 'md'
  }

  return 'txt' // Default para texto
}

/**
 * Parse PDF usando pdf-parse
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    // Importação dinâmica apenas server-side
    // @ts-ignore - pdf-parse tem problemas com ESM no Next.js
    const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'))
    const data = await pdfParse(buffer)
    
    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        info: data.info,
        version: data.version,
      }
    }
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse DOCX usando mammoth
 */
export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    
    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }
    
    return {
      text: result.value,
      metadata: {
        warnings: result.messages,
      }
    }
  } catch (error) {
    console.error('Error parsing DOCX:', error)
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse TXT (simplesmente converte buffer para string)
 */
export async function parseTXT(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const text = buffer.toString('utf-8')
    
    return {
      text,
      metadata: {
        encoding: 'utf-8',
        size: buffer.length,
      }
    }
  } catch (error) {
    console.error('Error parsing TXT:', error)
    throw new Error(`Failed to parse TXT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Parse documento automaticamente baseado no tipo
 */
export async function parseDocument(
  buffer: Buffer,
  filename?: string
): Promise<ParsedDocument> {
  const docType = detectDocumentType(buffer, filename)
  
  console.log(`Parsing document as ${docType}${filename ? ` (${filename})` : ''}`)
  
  switch (docType) {
    case 'pdf':
      return parsePDF(buffer)
    case 'docx':
      return parseDOCX(buffer)
    case 'txt':
    case 'md':
      return parseTXT(buffer)
    default:
      // Tenta como texto por padrão
      return parseTXT(buffer)
  }
}

/**
 * Limpa e normaliza texto extraído
 */
export function cleanText(text: string): string {
  return text
    // Remove múltiplas quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços extras
    .replace(/ {2,}/g, ' ')
    // Remove espaços no início/fim de cada linha
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove linhas vazias duplicadas
    .replace(/\n\n+/g, '\n\n')
    .trim()
}
