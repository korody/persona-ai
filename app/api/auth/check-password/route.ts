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

    // Verificar diretamente no banco se encrypted_password existe
    const { data, error } = await adminSupabase
      .from('auth.users')
      .select('encrypted_password')
      .eq('email', email.toLowerCase())
      .single()

    if (error) {
      // Se der erro, tentar via listUsers (fallback)
      const { data: users } = await adminSupabase.auth.admin.listUsers()
      const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (!user) {
        return NextResponse.json({ hasPassword: false, createdViaQuiz: false })
      }

      // Verificar se tem senha via presence de encrypted_password no objeto
      const hasPassword = !!(user as any).encrypted_password
      
      return NextResponse.json({ 
        hasPassword,
        createdViaQuiz: !hasPassword
      })
    }

    // Se conseguiu consultar, verificar se encrypted_password não é null
    const hasPassword = data && data.encrypted_password != null

    return NextResponse.json({ 
      hasPassword,
      createdViaQuiz: !hasPassword
    })

  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar senha' },
      { status: 500 }
    )
  }
}
