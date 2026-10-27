// app/api/admin/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { findAuthUserIdByEmail } from '@/lib/supabase/find-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação e admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const allowedAdmins = ['marko@persona.cx', 'admin@qigongbrasil.com', 'yexin828@hotmail.com']
    if (!allowedAdmins.includes(user.email || '')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Buscar no auth.users pelo e-mail
    const authUserId = await findAuthUserIdByEmail(adminClient, email)
    const { data: userData, error: getError } = authUserId
      ? await adminClient.auth.admin.getUserById(authUserId)
      : { data: { user: null }, error: null }

    if (getError) {
      console.error('Error fetching user:', getError)
      return NextResponse.json({
        error: 'Erro ao buscar usuários',
        details: getError.message
      }, { status: 500 })
    }

    const authUser = userData.user

    if (!authUser) {
      return NextResponse.json({
        found: false,
        message: 'Usuário não encontrado em auth.users',
        email
      })
    }

    // 2. Buscar perfil na tabela users
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // 3. Verificar se tem senha (via identities - se tem email/password identity)
    const hasPassword = authUser.identities?.some(i => i.provider === 'email') || false

    return NextResponse.json({
      found: true,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        phone: authUser.phone,
        created_at: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at,
        last_sign_in_at: authUser.last_sign_in_at,
        confirmed: !!authUser.email_confirmed_at,
        hasPassword,
        identities: authUser.identities?.map(i => i.provider) || []
      },
      profile: profile ? {
        full_name: profile.full_name,
        credits: profile.credits,
        current_plan: profile.current_plan
      } : null,
      profileError: profileError?.message || null
    })

  } catch (error: any) {
    console.error('Check user error:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error.message
    }, { status: 500 })
  }
}
