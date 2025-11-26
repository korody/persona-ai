// app/api/auth/check-password/route.ts
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

    const adminSupabase = await createAdminClient()

    // Buscar usuário pelo email
    const { data: users } = await adminSupabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ hasPassword: false })
    }

    // Verificar se usuário tem senha configurada
    // Usuários criados apenas via magic link (quiz) não têm encrypted_password
    const hasPassword = !!(user as any).encrypted_password

    return NextResponse.json({ 
      hasPassword,
      createdViaQuiz: !hasPassword  // Indica se veio do quiz
    })

  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar senha' },
      { status: 500 }
    )
  }
}
