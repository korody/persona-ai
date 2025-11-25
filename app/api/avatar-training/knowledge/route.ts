/**
 * API Route: Adiciona conhecimento manual (texto direto)
 * POST /api/avatar-training/knowledge
 * GET  /api/avatar-training/knowledge?avatar_id=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const avatarId = searchParams.get('avatar_id')

    if (!avatarId) {
      return NextResponse.json(
        { error: 'Missing avatar_id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .select('*')
      .eq('avatar_id', avatarId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ knowledge: data })

  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatar_id, title, content, content_type, tags, metadata: customMetadata } = body

    console.log('📥 POST /api/avatar-training/knowledge received:', {
      avatar_id,
      title,
      content_length: content?.length || 0,
      has_metadata: !!customMetadata
    })

    // Validação
    if (!avatar_id || !content) {
      console.error('❌ Validation failed:', { avatar_id: !!avatar_id, content: !!content })
      return NextResponse.json(
        { error: 'Missing required fields: avatar_id, content' },
        { status: 400 }
      )
    }

    // Parse metadata from content if it exists
    let parsedMetadata: any = { manual_entry: true, created_via_api: true }
    let cleanContent = content
    
    // Extract METADATA_DOCUMENTO block if it exists and remove it from content
    const metadataMatch = content.match(/METADATA_DOCUMENTO:\s*\n([\s\S]*?)(?:---|\n\n)/i)
    if (metadataMatch) {
      try {
        const metadataText = metadataMatch[1]
        
        // Extract elemento
        const elementoMatch = metadataText.match(/elemento:\s*(\w+)/i)
        if (elementoMatch) {
          parsedMetadata.elemento = elementoMatch[1]
        }
        
        // Extract orgaos
        const orgaosMatch = metadataText.match(/orgaos:\s*\[(.*?)\]/i)
        if (orgaosMatch) {
          parsedMetadata.orgaos = orgaosMatch[1].split(',').map((s: string) => s.trim())
        }
        
        // Extract sintomas_fisicos
        const sintomasFisicosMatch = metadataText.match(/sintomas_fisicos:\s*\[(.*?)\]/i)
        if (sintomasFisicosMatch) {
          parsedMetadata.sintomas_relacionados = sintomasFisicosMatch[1].split(',').map((s: string) => s.trim())
        }
        
        // Extract sintomas_emocionais
        const sintomasEmocionaisMatch = metadataText.match(/sintomas_emocionais:\s*\[(.*?)\]/i)
        if (sintomasEmocionaisMatch) {
          const emocionais = sintomasEmocionaisMatch[1].split(',').map((s: string) => s.trim())
          if (!parsedMetadata.sintomas_relacionados) {
            parsedMetadata.sintomas_relacionados = emocionais
          } else {
            parsedMetadata.sintomas_relacionados = [...parsedMetadata.sintomas_relacionados, ...emocionais]
          }
        }
        
        // Extract tipo_conteudo
        const tipoConteudoMatch = metadataText.match(/tipo_conteudo:\s*(\w+)/i)
        if (tipoConteudoMatch) {
          parsedMetadata.tipo_conteudo = tipoConteudoMatch[1]
        }
        
        // Remove metadata block from content (everything before ---)
        cleanContent = content.replace(/METADATA_DOCUMENTO:[\s\S]*?---\s*/i, '').trim()
        
        // Merge with custom metadata if provided
        if (customMetadata) {
          parsedMetadata = { ...parsedMetadata, ...customMetadata }
        }
        
        console.log('✅ Metadata parsed:', parsedMetadata)
        console.log(`📝 Content length: ${content.length} → ${cleanContent.length} (removed ${content.length - cleanContent.length} chars)`)
        
      } catch (e) {
        console.warn('Failed to parse metadata from content:', e)
      }
    }

    // Truncate content if too long for OpenAI embedding API (max 8192 tokens)
    // Conservative estimate: 1 token ≈ 3 characters for Portuguese text
    const MAX_EMBEDDING_TOKENS = 8000 // Leave margin for safety
    const MAX_EMBEDDING_CHARS = MAX_EMBEDDING_TOKENS * 3 // ~24,000 chars
    
    if (cleanContent.length > MAX_EMBEDDING_CHARS) {
      console.warn(`⚠️ Content too long (${cleanContent.length} chars ≈ ${Math.ceil(cleanContent.length / 3)} tokens), truncating to ${MAX_EMBEDDING_CHARS} chars`)
      cleanContent = cleanContent.substring(0, MAX_EMBEDDING_CHARS) + '\n\n[Conteúdo truncado para embedding...]'
    }

    // Gerar embedding
    console.log(`🔄 Generating embedding for: ${title || 'knowledge'} (${cleanContent.length} chars)`)
    let embedding: number[]
    try {
      embedding = await generateEmbedding(cleanContent)
      console.log(`✅ Embedding generated: ${embedding.length} dimensions`)
    } catch (embError) {
      console.error('❌ Embedding generation failed:', embError)
      return NextResponse.json(
        { 
          error: 'Failed to generate embedding',
          details: embError instanceof Error ? embError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    const supabase = await createAdminClient()
    
    // Try to use RPC function first (preferred method)
    let createdId: string | null = null
    
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'insert_knowledge_with_embedding',
        {
          p_avatar_id: avatar_id,
          p_title: title || 'Conhecimento Manual',
          p_content: cleanContent,
          p_content_type: content_type || 'text',
          p_embedding: embedding,
          p_tags: tags || [],
          p_metadata: parsedMetadata,
        }
      )

      if (!rpcError && rpcData) {
        createdId = rpcData
        console.log('✅ Knowledge created via RPC:', createdId)
      } else {
        throw new Error(rpcError?.message || 'RPC function failed')
      }
    } catch (rpcFallbackError) {
      // Fallback: Direct insert if RPC fails
      console.warn('⚠️ RPC failed, using direct insert:', rpcFallbackError)
      
      const embeddingString = `[${embedding.join(',')}]`
      
      const { data: directData, error: directError } = await supabase
        .from('avatar_knowledge_base')
        .insert({
          avatar_id,
          title: title || 'Conhecimento Manual',
          content: cleanContent,
          content_type: content_type || 'text',
          embedding: embeddingString,
          tags: tags || [],
          metadata: parsedMetadata,
          is_active: true,
          file_type: 'manual',
        })
        .select('id')
        .single()

      if (directError) {
        console.error('❌ Direct insert also failed:', directError)
        throw directError
      }
      
      createdId = directData.id
      console.log('✅ Knowledge created via direct insert:', createdId)
    }

    // Fetch the created record
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .select('*')
      .eq('id', createdId)
      .single()

    if (error) {
      console.error('Error fetching created knowledge:', error)
      // Still return success since we have the ID
      return NextResponse.json({
        success: true,
        knowledge: { id: createdId },
      })
    }

    // 🚀 PROCESSAMENTO AUTOMÁTICO DE CHUNKS
    console.log('🔄 Starting automatic chunk processing for document:', createdId)
    try {
      const processResponse = await fetch(`${request.url.split('/api/')[0]}/api/knowledge/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: createdId })
      })
      
      const processResult = await processResponse.json()
      
      if (processResponse.ok) {
        console.log('✅ Chunks created automatically:', processResult.chunks_created)
        return NextResponse.json({
          success: true,
          knowledge: data,
          chunks_created: processResult.chunks_created,
          auto_processed: true
        })
      } else {
        console.warn('⚠️ Chunk processing failed:', processResult.error)
        // Don't fail the whole request - document was created successfully
        return NextResponse.json({
          success: true,
          knowledge: data,
          chunks_created: 0,
          auto_processed: false,
          processing_error: processResult.error
        })
      }
    } catch (processError) {
      console.error('❌ Error calling chunk processor:', processError)
      // Don't fail the whole request - document was created successfully
      return NextResponse.json({
        success: true,
        knowledge: data,
        chunks_created: 0,
        auto_processed: false
      })
    }

  } catch (error) {
    console.error('Error creating knowledge:', error)
    return NextResponse.json(
      {
        error: 'Failed to create knowledge',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    // 1. Buscar informações do conhecimento antes de deletar
    const { data: knowledge } = await supabase
      .from('avatar_knowledge_base')
      .select('file_url, metadata')
      .eq('id', id)
      .single()

    // 2. Deletar chunks associados (embora CASCADE faça isso, é mais explícito)
    const { error: chunksError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('knowledge_base_id', id)

    if (chunksError) {
      console.warn('⚠️ Error deleting chunks (CASCADE will handle it):', chunksError)
    } else {
      console.log('✅ Deleted chunks for knowledge:', id)
    }

    // 3. Deletar arquivo do Storage se existir
    if (knowledge?.file_url) {
      try {
        // Extrair path do arquivo da URL
        const urlParts = knowledge.file_url.split('/knowledge-base/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          const { error: storageError } = await supabase.storage
            .from('knowledge-base')
            .remove([filePath])
          
          if (storageError) {
            console.warn('⚠️ Error deleting file from storage:', storageError)
          } else {
            console.log('✅ Deleted file from storage:', filePath)
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to delete file from storage:', e)
      }
    }

    // 4. Deletar registro principal da base de conhecimento
    const { error } = await supabase
      .from('avatar_knowledge_base')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Knowledge deleted successfully:', id)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to delete knowledge' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, content_type, tags, is_active, category, priority } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id field' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Buscar registro atual para pegar o metadata existente
    const { data: currentData } = await supabase
      .from('avatar_knowledge_base')
      .select('metadata')
      .eq('id', id)
      .single()

    const updates: any = { updated_at: new Date().toISOString() }
    
    if (title !== undefined) updates.title = title
    if (content_type !== undefined) updates.content_type = content_type
    if (tags !== undefined) updates.tags = tags
    if (is_active !== undefined) updates.is_active = is_active
    
    // Atualizar metadata preservando campos existentes
    if (category !== undefined || priority !== undefined) {
      const existingMetadata = currentData?.metadata || {}
      updates.metadata = {
        ...existingMetadata,
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority })
      }
    }
    
    // Se o conteúdo mudou, regenerar embedding
    if (content !== undefined) {
      updates.content = content
      const newEmbedding = await generateEmbedding(content)
      updates.embedding = `[${newEmbedding.join(',')}]` // Formato pgvector
    }
    
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      knowledge: data,
    })

  } catch (error) {
    console.error('Error updating knowledge:', error)
    return NextResponse.json(
      { error: 'Failed to update knowledge' },
      { status: 500 }
    )
  }
}
