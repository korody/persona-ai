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

    // Buscar usuário
    const { data: users } = await adminSupabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ hasPassword: false, createdViaQuiz: false })
    }

    // SOLUÇÃO PRAGMÁTICA:
    // Se usuário foi criado há mais de 5 minutos, assume que tem senha
    // Se foi criado recentemente (< 5 min), verifica se veio do quiz
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    // Se foi criado há mais de 5 minutos, provavelmente tem senha
    if (minutesSinceCreation > 5) {
      return NextResponse.json({ 
        hasPassword: true,
        createdViaQuiz: false
      })
    }

    // Se foi criado recentemente, verificar no quiz_leads se foi via quiz
    const { data: quizLead } = await adminSupabase
      .from('quiz_leads')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const createdViaQuiz = !!quizLead

    return NextResponse.json({ 
      hasPassword: !createdViaQuiz,  // Se veio do quiz, não tem senha
      createdViaQuiz
    })

  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar senha' },
      { status: 500 }
    )
  }
}
