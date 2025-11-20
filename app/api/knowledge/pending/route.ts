/**
 * API Endpoint: Listar documentos pendentes (sem chunks)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const avatarId = searchParams.get('avatar_id')

    if (!avatarId) {
      return NextResponse.json(
        { error: 'avatar_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Buscar todos os documentos
    const { data: allDocs, error: docsError } = await supabase
      .from('avatar_knowledge_base')
      .select('id, title, created_at')
      .eq('avatar_id', avatarId)
      .order('created_at', { ascending: false })

    if (docsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      )
    }

    // Verificar quais têm chunks
    const pendingDocs = []

    for (const doc of allDocs || []) {
      const { data: chunks } = await supabase
        .from('knowledge_chunks')
        .select('id')
        .eq('knowledge_base_id', doc.id)
        .limit(1)

      if (!chunks || chunks.length === 0) {
        pendingDocs.push(doc)
      }
    }

    return NextResponse.json({
      total: allDocs?.length || 0,
      pending: pendingDocs.length,
      documents: pendingDocs
    })

  } catch (error: any) {
    console.error('❌ Erro ao listar documentos pendentes:', error)
    
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
