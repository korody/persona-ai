// app/api/auth/check-email/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verificar se o email já existe na tabela auth.users
    const { data, error } = await supabase.auth.admin.listUsers()
    
    const userExists = data?.users?.some(user => user.email?.toLowerCase() === email.toLowerCase())

    if (error) {
      console.error('Check email error:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      exists: userExists || false,
      email,
    })
  } catch (error) {
    console.error('Check email error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
