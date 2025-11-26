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
      const supabase = createClient()
      
      if (!supabase) {
        console.error('[callback] Supabase client not available')
        router.push(`/auth?error=client_error&redirect=${redirect}`)
        return
      }

      console.log('[callback] === DEBUG INFO ===')
      console.log('[callback] URL:', window.location.href)
      console.log('[callback] Search params:', Object.fromEntries(searchParams.entries()))
      console.log('[callback] Hash:', window.location.hash)

      // 1. Verificar se tem token/token_hash no HASH (Supabase pode enviar assim)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashToken = hashParams.get('token')
        const hashTokenHash = hashParams.get('token_hash')
        const hashType = hashParams.get('type') || 'magiclink'

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
        console.log('[callback] Processing magic link from query params')
        
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash || token || '',
          type: type as any,
        })

        if (error) {
          console.error('[callback] ❌ Error verifying OTP:', error)
          router.push(`/auth?error=auth_failed&redirect=${redirect}`)
          return
        }

        console.log('[callback] ✅ OTP verified successfully')
        router.push(redirect)
        return
      }

      // 3. Verificar se tem code (pode ser PKCE flow OU magic link do Supabase)
      const code = searchParams.get('code')
      if (code) {
        console.log('[callback] Code detected, attempting to exchange for session')
        
        // Simplesmente tentar trocar o code por sessão
        // O Supabase vai determinar automaticamente se é válido
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('[callback] ❌ Error exchanging code:', error)
          console.log('[callback] Attempting alternative: session from URL')
          
          // Alternativa: Verificar se tem session tokens no hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (sessionError) {
              console.error('[callback] ❌ Error setting session:', sessionError)
              router.push(`/auth?error=auth_failed&redirect=${redirect}`)
              return
            }
            
            console.log('[callback] ✅ Session set from hash')
            router.push(redirect)
            return
          }
          
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
