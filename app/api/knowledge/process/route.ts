/**
 * API Endpoint: Processar documento e criar chunks automaticamente
 * Chamado após upload de documento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag/embeddings'

// Extrair metadados YAML
function extractYAMLMetadata(content: string): any {
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!yamlMatch) return {}

  const yamlContent = yamlMatch[1]
  const metadata: any = {}
  const lines = yamlContent.split('\n')
  
  for (const line of lines) {
    if (line.includes('METADATA_DOCUMENTO:')) continue
    
    const arrayMatch = line.match(/^(\w+):\s*\[(.+)\]/)
    if (arrayMatch) {
      metadata[arrayMatch[1].trim()] = arrayMatch[2].split(',').map(v => v.trim())
      continue
    }
    
    const kvMatch = line.match(/^(\w+):\s*(.+)/)
    if (kvMatch) {
      metadata[kvMatch[1].trim()] = kvMatch[2].trim()
    }
  }

  return metadata
}

// Splitter otimizado
function splitIntoChunks(text: string, maxChunkSize = 1500): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Buscar documento
    const { data: doc, error: docError } = await supabase
      .from('avatar_knowledge_base')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    console.log(`📄 Processando: ${doc.title}`)

    // Verificar se já tem chunks
    const { data: existingChunks } = await supabase
      .from('knowledge_chunks')
      .select('id')
      .eq('knowledge_base_id', doc.id)

    if (existingChunks && existingChunks.length > 0) {
      console.log(`⏭️  Documento já possui ${existingChunks.length} chunks`)
      return NextResponse.json({
        success: true,
        message: 'Documento já processado',
        chunksCount: existingChunks.length
      })
    }

    // Extrair metadata YAML
    const yamlMetadata = extractYAMLMetadata(doc.content)
    console.log(`📋 Elemento: ${yamlMetadata.elemento || 'N/A'}`)

    // Remover YAML do conteúdo
    const contentWithoutYAML = doc.content.replace(/^---\n[\s\S]*?\n---\n\n/, '')

    // Dividir em chunks
    const textChunks = splitIntoChunks(contentWithoutYAML, 1500)
    console.log(`✂️  ${textChunks.length} chunks criados`)

    // Gerar embeddings e salvar
    const chunksCreated = []
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunkContent = textChunks[i]
      const embedding = await generateEmbedding(chunkContent)

      const { data: chunk, error: chunkError } = await supabase
        .from('knowledge_chunks')
        .insert({
          avatar_id: doc.avatar_id,
          knowledge_base_id: doc.id,
          content: chunkContent,
          embedding: embedding,
          metadata: {
            knowledge_base_id: doc.id,
            title: doc.title,
            content_type: 'markdown',
            elemento: yamlMetadata.elemento,
            orgaos: yamlMetadata.orgaos,
            emocao_principal: yamlMetadata.emocao_principal,
            sintomas_fisicos: yamlMetadata.sintomas_fisicos,
            sintomas_emocionais: yamlMetadata.sintomas_emocionais,
            tipo_conteudo: yamlMetadata.tipo_conteudo,
            chunk_index: i,
          }
        })
        .select()
        .single()

      if (chunkError) {
        console.error(`❌ Erro no chunk ${i}:`, chunkError)
      } else {
        chunksCreated.push(chunk)
      }
    }

    console.log(`✅ ${chunksCreated.length} chunks salvos com sucesso`)

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      documentTitle: doc.title,
      chunksCount: chunksCreated.length,
      elemento: yamlMetadata.elemento || null
    })

  } catch (error: any) {
    console.error('❌ Erro ao processar documento:', error)
    
    return NextResponse.json(
      { error: error.message || 'Erro ao processar documento' },
      { status: 500 }
    )
  }
}

// Endpoint para reprocessar documento existente
export async function PUT(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Deletar chunks antigos
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('knowledge_base_id', documentId)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Erro ao deletar chunks antigos' },
        { status: 500 }
      )
    }

    // Processar novamente (reutilizar lógica do POST)
    const response = await POST(request)
    return response

  } catch (error: any) {
    console.error('❌ Erro ao reprocessar documento:', error)
    
    return NextResponse.json(
      { error: error.message || 'Erro ao reprocessar documento' },
      { status: 500 }
    )
  }
}
