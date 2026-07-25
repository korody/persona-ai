// app/auth/confirm/route.ts
//
// Verificação de magic link / recovery 100% server-side.
//
// Diferente de /auth/callback (que usa PKCE e depende do code_verifier guardado
// no localStorage do navegador que PEDIU o link), esta rota usa token_hash —
// que não depende de nada no cliente. Isso faz o link funcionar mesmo quando o
// usuário abre o email em outro dispositivo, outro navegador, ou na WebView do
// app de email (Gmail/Outlook), que era o caso que quebrava.
//
// O template de email do Supabase precisa apontar para cá:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/chat

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Só aceita caminho relativo próprio — impede open redirect via ?next=
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/chat'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNext(searchParams.get('next') ?? searchParams.get('redirect'))

  const failure = (reason: string) =>
    NextResponse.redirect(
      new URL(`/auth?error=${reason}&redirect=${encodeURIComponent(next)}`, request.url)
    )

  if (!tokenHash || !type) {
    console.error('[auth/confirm] missing token_hash or type')
    return failure('no_auth_data')
  }

  // O verifyOtp emite os cookies de sessão via setAll. Como o destino final só é
  // conhecido depois da verificação, acumulamos aqui e aplicamos na resposta.
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLIC_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    console.error('[auth/confirm] verifyOtp failed:', error.message)
    return failure('auth_failed')
  }

  const destination = type === 'recovery' ? '/reset-password' : next
  console.log(`[auth/confirm] ✅ ${type} verificado, redirecionando para ${destination}`)

  const response = NextResponse.redirect(new URL(destination, request.url))
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}
