import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? requestUrl.searchParams.get('redirect') ?? '/chat'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('✅ Session created via server-side code exchange')
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('❌ Error exchanging code:', error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }
  }

  // Se não tem code, redirecionar para login
  return NextResponse.redirect(new URL('/login', request.url))
}
