// app/auth/callback/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? requestUrl.searchParams.get('redirect') ?? '/chat'

  const supabase = await createClient()

  // Magic Link do Quiz (token_hash + type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      console.log('✅ Usuário autenticado via magic link (quiz)')
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('❌ Erro ao verificar magic link:', error)
    }
  }

  // OAuth callback padrão (code)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    console.log('✅ Sessão criada via OAuth code')
    return NextResponse.redirect(new URL(next, request.url))
  }

  // Se nenhum método funcionou, redireciona para login
  console.warn('⚠️ Callback sem code nem token_hash, redirecionando para login')
  return NextResponse.redirect(new URL('/login', request.url))
}