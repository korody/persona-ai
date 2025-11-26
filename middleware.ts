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
    '/auth',
    '/api/auth',
    '/pricing',
    '/termos',
    '/privacidade'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  const publicApiRoutes = [
    '/api/auth/callback',
    '/api/webhooks/stripe',
    '/api/stripe/webhook',
    '/api/cron',
    '/api/quiz/complete'  // Endpoint para auto-login do quiz MTC externo
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
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLIC_KEY!,
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

    // Redirecionar /login e /signup para /auth (nova rota unificada)
    if (pathname === '/login' || pathname === '/signup') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }

    // Se não está logado (sem usuário OU com erro) e não é rota pública → redireciona pro auth
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      
      if (!pathname.startsWith('/api')) {
        url.searchParams.set('redirect', pathname)
      }
      
      console.log('[Middleware] Redirecting to auth from', pathname)
      return NextResponse.redirect(url)
    }

    // ============================================
    // PROTEÇÃO ÁREA ADMIN
    // ============================================
    if (pathname.startsWith('/admin')) {
      const allowedAdminEmails = [
        'marko@persona.cx',
        'admin@qigongbrasil.com'
      ]
      
      if (!allowedAdminEmails.includes(user.email || '')) {
        console.log('[Middleware] Access denied to admin area for:', user.email)
        const url = request.nextUrl.clone()
        url.pathname = '/chat'
        return NextResponse.redirect(url)
      }
    }

    // Se está logado e tenta acessar auth → redireciona pro chat
    if (user && pathname === '/auth') {
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      console.log('[Middleware] Redirecting to chat from', pathname)
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('[Middleware] Supabase error:', error)
    
    // Em caso de erro, redireciona para auth (mas não quebra a app)
    if (!isPublicRoute && !isPublicApiRoute && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
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
    '/auth',
    '/login',
    '/signup',
    '/api/:path*',
    '/ping',
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
