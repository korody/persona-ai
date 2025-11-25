/**
 * API Route: Gerencia exemplos de conversas (few-shot learning)
 * GET    /api/avatar-training/examples?avatar_id=xxx
 * POST   /api/avatar-training/examples
 * PATCH  /api/avatar-training/examples
 * DELETE /api/avatar-training/examples?id=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

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
      .from('avatar_conversation_examples')
      .select('*')
      .eq('avatar_id', avatarId)
      .order('order_index')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ examples: data })

  } catch (error) {
    console.error('Error fetching examples:', error)
    return NextResponse.json(
      { error: 'Failed to fetch examples' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      avatar_id,
      user_message,
      assistant_response,
      tags,
      category,
      is_active = true,
      order_index = 0,
    } = body

    // Validação
    if (!avatar_id || !user_message || !assistant_response) {
      return NextResponse.json(
        { error: 'Missing required fields: avatar_id, user_message, assistant_response' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('avatar_conversation_examples')
      .insert({
        avatar_id,
        user_message,
        assistant_response,
        tags: tags || [],
        category,
        is_active,
        order_index,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating example:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      example: data,
    })

  } catch (error) {
    console.error('Error creating example:', error)
    return NextResponse.json(
      {
        error: 'Failed to create example',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      user_message,
      assistant_response,
      tags,
      category,
      is_active,
      order_index,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id field' },
        { status: 400 }
      )
    }

    const updates: any = { updated_at: new Date().toISOString() }
    
    if (user_message !== undefined) updates.user_message = user_message
    if (assistant_response !== undefined) updates.assistant_response = assistant_response
    if (tags !== undefined) updates.tags = tags
    if (category !== undefined) updates.category = category
    if (is_active !== undefined) updates.is_active = is_active
    if (order_index !== undefined) updates.order_index = order_index

    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('avatar_conversation_examples')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      example: data,
    })

  } catch (error) {
    console.error('Error updating example:', error)
    return NextResponse.json(
      { error: 'Failed to update example' },
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
    
    const { error } = await supabase
      .from('avatar_conversation_examples')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting example:', error)
    return NextResponse.json(
      { error: 'Failed to delete example' },
      { status: 500 }
    )
  }
}
