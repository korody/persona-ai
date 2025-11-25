'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      
      // 1. Verificar se tem hash fragment (#access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      
      if (accessToken && refreshToken) {
        // Processar implicit grant (hash fragment)
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })
        
        if (!error) {
          console.log('✅ Sessão criada via hash fragment (quiz)')
          const redirect = searchParams.get('redirect') ?? '/chat'
          router.replace(redirect)
          return
        } else {
          console.error('❌ Erro ao criar sessão:', error)
          router.replace('/login?error=auth_failed')
          return
        }
      }
      
      // 2. Verificar se tem token_hash (magic link do quiz)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          type: type as any,
          token_hash: tokenHash,
        })
        
        if (!error) {
          console.log('✅ Sessão criada via magic link (quiz)')
          const redirect = searchParams.get('redirect') ?? searchParams.get('next') ?? '/chat'
          router.replace(redirect)
          return
        } else {
          console.error('❌ Erro ao verificar magic link:', error)
          router.replace('/login?error=auth_failed')
          return
        }
      }
      
      // 3. Verificar se tem code (OAuth/PKCE flow)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          console.log('✅ Sessão criada via OAuth code')
          const redirect = searchParams.get('next') ?? searchParams.get('redirect') ?? '/chat'
          router.replace(redirect)
          return
        } else {
          console.error('❌ Erro ao trocar code:', error)
          router.replace('/login?error=auth_failed')
          return
        }
      }
      
      // 4. Se não tem nenhum método, redirecionar para login
      console.warn('⚠️ Callback sem token válido')
      router.replace('/login')
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
