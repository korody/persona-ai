/**
 * API Route: Upload e processa documento para base de conhecimento
 * POST /api/avatar-training/upload-document
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  parseDocument,
  cleanText,
  smartSplit,
  getChunkStats,
  generateEmbeddings,
} from '@/lib/rag'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutos para processar documentos grandes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const avatarId = formData.get('avatar_id') as string
    const file = formData.get('file') as File
    const tagsString = formData.get('tags') as string | null
    
    // Validação
    if (!avatarId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: avatar_id, file' },
        { status: 400 }
      )
    }

    // Usar nome do arquivo como título (mantém acentuação)
    const title = file.name.replace(/\.[^/.]+$/, '') // Remove extensão
    const tags: string[] = tagsString 
      ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const contentType = 'document'

    console.log(`📄 Processing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    if (tags.length > 0) {
      console.log(`🏷️  Tags: ${tags.join(', ')}`)
    }

    // Converter file para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = await createAdminClient()

    // Sanitizar nome do arquivo para Storage (remove acentos e caracteres especiais)
    const sanitizeFileName = (name: string): string => {
      return name
        .normalize('NFD') // Decompõe caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por _
        .replace(/_+/g, '_') // Remove underscores duplicados
    }

    // 1. Upload do arquivo para Supabase Storage
    const sanitizedFileName = sanitizeFileName(file.name)
    const fileName = `${avatarId}/${Date.now()}-${sanitizedFileName}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('knowledge-base')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 2. Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from('knowledge-base')
      .getPublicUrl(fileName)

    // 3. Parse do documento
    console.log(`Parsing document: ${file.name}`)
    const parsed = await parseDocument(buffer, file.name)
    const cleanedText = cleanText(parsed.text)

    if (!cleanedText || cleanedText.length < 10) {
      return NextResponse.json(
        { error: 'Document appears to be empty or invalid' },
        { status: 400 }
      )
    }

    // 4. Dividir em chunks
    console.log(`Splitting text into chunks (${cleanedText.length} characters)`)
    const chunks = await smartSplit(cleanedText, {
      chunkSize: 1000,
      chunkOverlap: 200,
    })

    const stats = getChunkStats(chunks)
    console.log(`Created ${stats.count} chunks, avg ${stats.avgTokens} tokens`)

    // 5. Criar registro na tabela knowledge_base
    const { data: knowledgeBase, error: kbError } = await supabase
      .from('avatar_knowledge_base')
      .insert({
        avatar_id: avatarId,
        title,
        content: cleanedText.substring(0, 10000), // Primeiros 10k chars como preview
        content_type: contentType,
        file_url: publicUrl,
        file_type: file.name.split('.').pop()?.toLowerCase(),
        tags: tags,
        is_active: true,
        metadata: {
          original_filename: file.name,
          file_size: file.size,
          chunks_count: stats.count,
          total_tokens: stats.totalTokens,
          parsed_metadata: parsed.metadata,
        },
      })
      .select()
      .single()

    if (kbError) {
      console.error('Error creating knowledge base:', kbError)
      return NextResponse.json(
        { error: `Failed to create knowledge base: ${kbError.message}` },
        { status: 500 }
      )
    }

    // 6. Gerar embeddings para todos os chunks (em batch)
    console.log(`Generating embeddings for ${chunks.length} chunks...`)
    const chunkTexts = chunks.map(c => c.content)
    const embeddings = await generateEmbeddings(chunkTexts)

    // 7. Inserir chunks com embeddings
    console.log(`💾 Inserting ${chunks.length} chunks with embeddings...`)
    
    let insertedCount = 0
    const errors: any[] = []
    
    // Inserir um por um para evitar problemas de batch
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = embeddings[i]
      
      try {
        const { error } = await supabase
          .from('knowledge_chunks')
          .insert({
            knowledge_base_id: knowledgeBase.id,
            avatar_id: avatarId,
            content: chunk.content,
            embedding: JSON.stringify(embedding), // Salvar como JSON string
            chunk_index: chunk.index,
            token_count: chunk.tokenCount,
            metadata: chunk.metadata || {}
          })
        
        if (error) {
          console.error(`Error inserting chunk ${i}:`, error)
          errors.push({ chunk: i, error })
        } else {
          insertedCount++
        }
      } catch (err) {
        console.error(`Exception inserting chunk ${i}:`, err)
        errors.push({ chunk: i, error: err })
      }
    }
    
    console.log(`✅ Inserted ${insertedCount}/${chunks.length} chunks`)
    
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} errors during insertion`)
    }

    // 8. Retornar sucesso
    return NextResponse.json({
      success: true,
      knowledge_base_id: knowledgeBase.id,
      chunks_created: chunks.length,
      stats: {
        total_chunks: stats.count,
        total_tokens: stats.totalTokens,
        avg_tokens_per_chunk: stats.avgTokens,
        file_size_bytes: file.size,
      },
      file_url: publicUrl,
    })

  } catch (error) {
    console.error('Error processing document:', error)
    return NextResponse.json(
      {
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
