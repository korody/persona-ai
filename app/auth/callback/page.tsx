// app/auth/callback/page.tsx
'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/chat'

  useEffect(() => {
    const handleCallback = async () => {
      // Usar @supabase/supabase-js diretamente para acessar o code_verifier do localStorage
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
        {
          auth: {
            flowType: 'pkce',
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'supabase-auth',
          }
        }
      )
      
      if (!supabase) {
        console.error('[callback] Supabase client not available')
        router.push(`/auth?error=client_error&redirect=${redirect}`)
        return
      }

      console.log('[callback] === DEBUG INFO ===')
      console.log('[callback] URL:', window.location.href)
      console.log('[callback] Search params:', Object.fromEntries(searchParams.entries()))
      console.log('[callback] Hash:', window.location.hash)
      console.log('[callback] localStorage keys:', Object.keys(localStorage))

      const type = searchParams.get('type')
      
      // Para recovery, deixar o Supabase detectar a sessão da URL automaticamente
      if (type === 'recovery') {
        console.log('[callback] Recovery flow detected')
        
        // O Supabase já detectou e setou a sessão por causa de detectSessionInUrl: true
        // Vamos apenas verificar se a sessão existe
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.error('[callback] ❌ No session after recovery detection:', sessionError)
          router.push(`/auth?error=auth_failed&redirect=${redirect}`)
          return
        }
        
        console.log('[callback] ✅ Session detected from URL:', session)
        
        // Setar no servidor
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })
        
        if (!sessionResponse.ok) {
          console.error('[callback] ❌ Error setting session on server')
        } else {
          console.log('[callback] ✅ Session set on server')
        }
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/auth/reset-password')
        return
      }

      // 1. Verificar se tem token/token_hash no HASH (Supabase pode enviar assim)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashToken = hashParams.get('token')
        const hashTokenHash = hashParams.get('token_hash')
        const hashType = hashParams.get('type') || 'magiclink'
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')

        // Para recovery, Supabase envia access_token direto no hash
        if (hashType === 'recovery' && hashAccessToken) {
          console.log('[callback] Processing recovery with access_token from hash')
          
          const { error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || '',
          })
          
          if (error) {
            console.error('[callback] ❌ Error setting session from hash:', error)
            router.push(`/auth?error=auth_failed&redirect=${redirect}`)
            return
          }
          
          console.log('[callback] ✅ Session set from hash recovery')
          
          // Setar no servidor também
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            }),
          })
          
          router.push('/auth/reset-password')
          return
        }

        if (hashToken || hashTokenHash) {
          console.log('[callback] Processing magic link from HASH fragment')
          
          const { error } = await supabase.auth.verifyOtp({
            token_hash: hashTokenHash || hashToken || '',
            type: hashType as any,
          })

          if (error) {
            console.error('[callback] ❌ Error verifying OTP from hash:', error)
            router.push(`/auth?error=auth_failed&redirect=${redirect}`)
            return
          }

          console.log('[callback] ✅ OTP from hash verified successfully')
          router.push(redirect)
          return
        }
      }

      // 2. Verificar se tem token/token_hash nos QUERY PARAMS
      const token = searchParams.get('token')
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') || 'magiclink'
      
      if (token || tokenHash) {
        console.log('[callback] Processing magic link from query params, type:', type)
        
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash || token || '',
          type: type as any,
        })

        if (error) {
          console.error('[callback] ❌ Error verifying OTP:', error)
          router.push(`/auth?error=auth_failed&redirect=${redirect}`)
          return
        }

        console.log('[callback] ✅ OTP verified successfully', data)
        
        // Setar sessão no servidor via API
        if (data?.session) {
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          })
          
          if (!sessionResponse.ok) {
            console.error('[callback] ❌ Error setting session via API')
          } else {
            console.log('[callback] ✅ Session set successfully via API')
          }
        }
        
        // Se for recovery, redirecionar para reset-password com access_token
        if (type === 'recovery') {
          console.log('[callback] Recovery type detected, redirecting to reset-password')
          // Aguardar um pouco para garantir que a sessão foi setada
          await new Promise(resolve => setTimeout(resolve, 500))
          router.push('/auth/reset-password')
          return
        }
        
        router.push(redirect)
        return
      }

      // 3. Verificar se tem code (pode ser PKCE flow OU magic link do Supabase)
      const code = searchParams.get('code')
      if (code) {
        console.log('[callback] Code detected, attempting to exchange for session')
        
        // Buscar o code_verifier do localStorage manualmente
        const codeVerifierKey = Object.keys(localStorage).find(key => key.includes('code-verifier'))
        const codeVerifier = codeVerifierKey ? localStorage.getItem(codeVerifierKey) : null
        
        console.log('[callback] Code verifier key:', codeVerifierKey)
        console.log('[callback] Code verifier exists:', !!codeVerifier)
        
        if (codeVerifier) {
          // Fazer a troca manualmente via API - formato correto do Supabase
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!}`,
            },
            body: JSON.stringify({
              auth_code: code,
              code_verifier: codeVerifier.replace(/"/g, ''), // Remover aspas se tiver
            }),
          })
          
          const responseData = await response.json()
          console.log('[callback] Token exchange response:', response.status, responseData)
          
          if (response.ok && responseData.access_token) {
            console.log('[callback] ✅ Token exchange successful')
            
            // Setar a sessão via API do servidor (para cookies funcionarem)
            const sessionResponse = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: responseData.access_token,
                refresh_token: responseData.refresh_token,
              }),
            })
            
            if (!sessionResponse.ok) {
              const sessionError = await sessionResponse.json()
              console.error('[callback] ❌ Error setting session via API:', sessionError)
              router.push(`/auth?error=auth_failed&redirect=${redirect}`)
              return
            }
            
            // Limpar o code_verifier
            if (codeVerifierKey) localStorage.removeItem(codeVerifierKey)
            
            console.log('[callback] ✅ Session set successfully via API')
            router.push(redirect)
            return
          } else {
            console.error('[callback] ❌ Token exchange failed:', responseData)
          }
        }
        
        // Fallback: tentar o método padrão
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('[callback] ❌ Error exchanging code:', error)
          router.push(`/auth?error=auth_failed&redirect=${redirect}`)
          return
        }

        console.log('[callback] ✅ Code exchanged successfully')
        router.push(redirect)
        return
      }

      // Sem token nem code - erro
      console.error('[callback] No auth data found')
      router.push(`/auth?error=no_auth_data&redirect=${redirect}`)
    }

    handleCallback()
  }, [router, searchParams, redirect])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
