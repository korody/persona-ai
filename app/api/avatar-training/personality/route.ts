/**
 * API Route para atualizar personalidade do avatar
 * POST /api/avatar-training/personality
 * 
 * Usa service role key para bypass do cache do PostgREST
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatar_id, system_prompt, temperature, max_tokens } = body

    if (!avatar_id) {
      return NextResponse.json({ error: 'avatar_id é obrigatório' }, { status: 400 })
    }

    // Usar service role key para bypass do cache
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_API_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )

    console.log('🔧 Atualizando personalidade do avatar:', avatar_id)
    console.log('- System Prompt length:', system_prompt?.length)
    console.log('- Temperature:', temperature)
    console.log('- Max Tokens:', max_tokens)

    // Usar função RPC para bypass do cache
    const { data, error } = await supabase.rpc('update_avatar_personality', {
      p_avatar_id: avatar_id,
      p_system_prompt: system_prompt,
      p_temperature: temperature,
      p_max_tokens: max_tokens
    })

    if (error) {
      console.error('❌ Erro ao chamar função:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Personalidade atualizada via função:', data)

    return NextResponse.json({ 
      success: true,
      avatar: data?.[0] || data
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}
