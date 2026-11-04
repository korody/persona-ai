// app/auth/confirm/entrar/route.ts
//
// Verificação de magic link / recovery 100% server-side, só no POST.
//
// O link do e-mail abre /auth/confirm, que mostra um botão "Entrar" e envia o
// formulário para cá. Por que não verificar no GET: o Microsoft Safe Links
// (Hotmail/Outlook/Live) e outros verificadores abrem sozinhos os links dos
// e-mails. Se o GET chamasse verifyOtp, essa visita gastaria o token (o mesmo do
// código de 6 números) e a aluna receberia "código incorreto ou vencido". O
// verificador abre a página mas não envia o formulário.
//
// Usa token_hash (não PKCE), então funciona em outro dispositivo, outro
// navegador ou na WebView do app de e-mail.
//
// O template de email do Supabase aponta para:
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

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const tokenHash = form.get('token_hash') as string | null
  const type = form.get('type') as EmailOtpType | null
  const next = safeNext(form.get('next') as string | null)

  // 303: o navegador segue o redirect com GET, não reenvia o POST
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url), 303)
  const failure = (reason: string) =>
    redirect(`/auth?error=${reason}&redirect=${encodeURIComponent(next)}`)

  if (!tokenHash || !type) {
    console.error('[auth/confirm/entrar] missing token_hash or type')
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
    console.error('[auth/confirm/entrar] verifyOtp failed:', error.message)
    return failure('auth_failed')
  }

  const destination = type === 'recovery' ? '/reset-password' : next
  console.log(`[auth/confirm/entrar] ✅ ${type} verificado, redirecionando para ${destination}`)

  const response = redirect(destination)
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )

  return response
}
