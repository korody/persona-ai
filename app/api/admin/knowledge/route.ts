// API para gerenciar conhecimento base dos avatares

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { addKnowledge, updateKnowledge } from '@/lib/ai/rag'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const avatarId = searchParams.get('avatarId')
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Verificar se usuário é admin

    let query = supabase
      .from('avatar_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (avatarId) {
      query = query.eq('avatar_id', avatarId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ knowledge: data })
  } catch (error) {
    console.error('Error fetching knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Verificar se usuário é admin

    const { avatarId, title, content, contentType, tags } = await req.json()

    if (!avatarId || !title || !content || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Adicionar conhecimento com embedding automático
    const data = await addKnowledge(
      avatarId,
      title,
      content,
      contentType,
      tags || [],
      user.id
    )

    return NextResponse.json({ knowledge: data })
  } catch (error) {
    console.error('Error creating knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, title, content, contentType, tags, isActive } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing knowledge ID' }, { status: 400 })
    }

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (contentType !== undefined) updates.content_type = contentType
    if (tags !== undefined) updates.tags = tags
    if (isActive !== undefined) updates.is_active = isActive

    // Atualizar com regeneração automática de embedding se conteúdo mudou
    const data = await updateKnowledge(id, updates)

    return NextResponse.json({ knowledge: data })
  } catch (error) {
    console.error('Error updating knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing knowledge ID' }, { status: 400 })
    }

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete
    const { error } = await supabase
      .from('avatar_knowledge_base')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting knowledge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
