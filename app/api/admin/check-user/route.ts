// app/api/admin/check-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

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

    const allowedAdmins = ['marko@persona.cx', 'admin@qigongbrasil.com']
    if (!allowedAdmins.includes(user.email || '')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Buscar no auth.users via Admin API
    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({
        error: 'Erro ao buscar usuários',
        details: listError.message
      }, { status: 500 })
    }

    const authUser = listData?.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

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

    // 3. Verificar se tem senha
    const hasPassword = authUser.encrypted_password && authUser.encrypted_password.length > 0

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
