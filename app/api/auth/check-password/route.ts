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

    // Usar a função SQL que verifica se usuário tem senha via tabela dedicada
    const { data, error } = await adminSupabase
      .rpc('check_user_has_password', { user_email: email })
      .single<{ has_password: boolean; created_via_quiz: boolean }>()

    console.log('[check-password] Email:', email)
    console.log('[check-password] RPC result:', { data, error })

    if (error) {
      console.error('[check-password] Error checking password:', error)
      // Fallback: se erro, assume que não existe
      return NextResponse.json({ 
        hasPassword: false, 
        createdViaQuiz: false 
      })
    }

    if (!data) {
      console.log('[check-password] No data returned (user not found)')
      // Usuário não existe
      return NextResponse.json({ 
        hasPassword: false, 
        createdViaQuiz: false 
      })
    }

    console.log('[check-password] Final result:', {
      hasPassword: data.has_password,
      createdViaQuiz: data.created_via_quiz
    })

    // Retornar resultado da função SQL
    return NextResponse.json({ 
      hasPassword: data.has_password,
      createdViaQuiz: data.created_via_quiz
    })

  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar senha' },
      { status: 500 }
    )
  }
}
