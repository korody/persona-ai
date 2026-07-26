import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Cliente sem PKCE: o SSR client usa flowType 'pkce' por padrão, o que faz
    // o Supabase gerar um token prefixado `pkce_` — rejeitado pelo verifyOtp de
    // /auth/confirm e resgatável apenas no navegador que pediu o link.
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLIC_KEY!,
      { auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false } }
    )

    // Configurar redirect URL explicitamente
    const redirectUrl = `${request.nextUrl.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      console.error('Supabase magic link error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[magic-link] Email sent with redirect:', redirectUrl)

    return NextResponse.json({ 
      success: true,
      message: 'Link mágico enviado com sucesso' 
    })

  } catch (error) {
    console.error('Magic link API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
