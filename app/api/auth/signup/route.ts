// app/api/auth/signup/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json()

    console.log('[signup] Dados recebidos:', { email, fullName, phone: phone?.substring(0, 5) + '...' })

    if (!email || !password || !fullName || !phone) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    console.log('[signup] Criando usuário...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      console.error('[signup] Erro ao criar usuário:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[signup] Usuário criado com sucesso:', data.user?.id)

    // Marcar que usuário tem senha
    if (data.user?.id) {
      try {
        await supabase.rpc('mark_user_has_password', { p_user_id: data.user.id })
        console.log('[signup] Status de senha marcado')
      } catch (err) {
        console.error('[signup] Erro ao marcar status de senha:', err)
        // Não bloqueia o signup se falhar
      }
    }

    // Se tem sessão, fazer login automático
    if (data.session) {
      console.log('[signup] Setando sessão no servidor...')
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })

      if (sessionError) {
        console.error('[signup] Erro ao setar sessão:', sessionError)
      } else {
        console.log('[signup] Sessão setada com sucesso')
      }
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('[signup] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
