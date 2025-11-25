// app/api/auth/check-email/route.ts
import { createAdminClient } from '@/lib/supabase/server'
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

    console.log('[check-email] Criando admin client...')
    const supabase = await createAdminClient()
    console.log('[check-email] Admin client criado')

    // Verificar se o email já existe na tabela auth.users
    console.log('[check-email] Listando usuários...')
    const { data, error } = await supabase.auth.admin.listUsers()
    console.log('[check-email] Resultado:', { userCount: data?.users?.length, error })
    
    const userExists = data?.users?.some(user => user.email?.toLowerCase() === email.toLowerCase())

    if (error) {
      console.error('Check email error:', error)
      return NextResponse.json(
        { error: 'Erro ao verificar email' },
        { status: 500 }
      )
    }

    console.log('[check-email] User exists:', userExists)
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
