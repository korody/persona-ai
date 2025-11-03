// app/api/conversations/route.ts

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // Pegar token de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    // Verificar autenticação usando o token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar conversas com avatar
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        last_message_at,
        total_credits_used,
        avatars (
          name,
          slug
        )
      `)
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ conversations })

  } catch (error) {
    console.error('Conversations API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}