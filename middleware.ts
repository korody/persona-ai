// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================
  // PLAYWRIGHT TEST SUPPORT
  // ============================================
  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 })
  }

  // ============================================
  // SUPABASE AUTH
  // ============================================

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verificar se usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ============================================
  // ROTAS PÚBLICAS (não precisam de auth)
  // ============================================
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth',
    '/api/auth',
    '/pricing'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // API routes públicas (auth callback, webhooks)
  const publicApiRoutes = [
    '/api/auth/callback',
    '/api/webhooks/stripe',
    '/api/cron'
  ]

  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  // ============================================
  // LÓGICA DE REDIRECIONAMENTO
  // ============================================

  // Se não está logado e tenta acessar rota protegida → redireciona pro login
  if (!user && !isPublicRoute && !isPublicApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    
    // Salvar redirect URL (para voltar depois do login)
    if (!pathname.startsWith('/api')) {
      url.searchParams.set('redirect', pathname)
    }
    
    return NextResponse.redirect(url)
  }

  // Se está logado e tenta acessar login/signup → redireciona pro chat
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/settings/:path*',
    '/pricing',
    '/login',
    '/signup',
    '/api/:path*',
    '/ping',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}