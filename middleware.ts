// middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ============================================
  // MODO DESENVOLVIMENTO: AUTH DESABILITADA (5G bloqueando HTTPS)
  // TODO: Reabilitar quando voltar WiFi
  // ============================================
  const isDev5GMode = false
  
  if (isDev5GMode) {
    return NextResponse.next()
  }

  // ============================================
  // PLAYWRIGHT TEST SUPPORT
  // ============================================
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 })
  }

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

  const publicApiRoutes = [
    '/api/auth/callback',
    '/api/webhooks/stripe',
    '/api/cron'
  ]

  const isPublicApiRoute = publicApiRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Se é rota pública, deixa passar sem verificação
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next()
  }

  // ============================================
  // SUPABASE AUTH (apenas para rotas protegidas)
  // ============================================
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
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

    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    console.log('[Middleware]', pathname, 'user:', !!user, 'error:', error?.message)

    // Se não está logado (sem usuário OU com erro) e não é rota pública → redireciona pro login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      
      if (!pathname.startsWith('/api')) {
        url.searchParams.set('redirect', pathname)
      }
      
      console.log('[Middleware] Redirecting to login from', pathname)
      return NextResponse.redirect(url)
    }

    // Se está logado e tenta acessar login/signup → redireciona pro chat
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      console.log('[Middleware] Redirecting to chat from', pathname)
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('[Middleware] Supabase error:', error)
    
    // Em caso de erro, redireciona para login (mas não quebra a app)
    if (!isPublicRoute && !isPublicApiRoute && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/pricing',
    '/login',
    '/signup',
    '/api/:path*',
    '/ping',
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
