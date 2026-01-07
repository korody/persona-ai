// app/api/auth/check-email/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log('[check-email] Email recebido:', email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Estratégia: Verificar na tabela users (pública)
    // Esta tabela é criada automaticamente quando um usuário se cadastra
    console.log('[check-email] Verificando na tabela users...')
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email')
      .ilike('email', email) // Case-insensitive
      .limit(1)

    console.log('[check-email] Resultado da busca:', {
      found: users && users.length > 0,
      error: error?.message
    })

    // Se houver erro de permissão, tentar outra estratégia
    // Verificar pelo erro de signup (mais confiável)
    if (error && error.code === 'PGRST301') {
      console.log('[check-email] Erro de permissão, usando fallback')
      return NextResponse.json({
        exists: false, // Assumir que não existe para permitir tentar signup
        email,
        fallback: true
      })
    }

    const userExists = users && users.length > 0

    console.log('[check-email] User exists:', userExists)
    return NextResponse.json({
      exists: userExists,
      email,
    })
  } catch (error: any) {
    console.error('[check-email] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
