'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { LegalFooter } from '@/components/legal-footer'

function ResetPasswordFlow() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const router = useRouter()

  // Verificar se há sessão ativa ao carregar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!
        )
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('[reset-password] Session check:', { hasSession: !!session, error })
        
        if (!session && !error) {
          console.error('[reset-password] No session found, redirecting to auth')
          setError('Sessão expirada. Por favor, solicite um novo link de recuperação.')
          setTimeout(() => {
            router.push('/auth')
          }, 3000)
        }
        
        setCheckingSession(false)
      } catch (err) {
        console.error('[reset-password] Error checking session:', err)
        setCheckingSession(false)
      }
    }
    
    checkSession()
  }, [router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!
      )

      console.log('[reset-password] Attempting to update password...')
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('[reset-password] Update password error:', updateError)
        
        // Traduzir mensagens de erro comuns do Supabase
        let errorMessage = updateError.message || 'Erro ao atualizar senha. Tente novamente.'
        
        if (errorMessage.includes('New password should be different from the old password')) {
          errorMessage = 'A nova senha deve ser diferente da senha anterior.'
        } else if (errorMessage.includes('Password should be at least')) {
          errorMessage = 'A senha deve ter no mínimo 6 caracteres.'
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      console.log('[reset-password] ✅ Password updated successfully')
      setSuccess(true)
      setLoading(false)

      // Redirecionar para o chat após 2 segundos
      setTimeout(() => {
        router.push('/chat')
        router.refresh()
      }, 2000)

    } catch (err) {
      console.error('[reset-password] Reset password error:', err)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold">Mestre Ye Digital</h1>
              <p className="text-sm text-muted-foreground">Seu Terapeuta Digital 24/7</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Criar nova senha
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg border shadow-sm p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="mb-4 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Senha atualizada!</h3>
              <p className="text-gray-600 mb-6">
                Sua senha foi redefinida com sucesso.
                <br />
                Redirecionando você para o chat...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Digite sua nova senha abaixo. Ela deve ter no mínimo 6 caracteres.
                </p>
              </div>

              <div>
                <Label htmlFor="password" className="text-base">
                  Nova senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoFocus
                  className="mt-1 h-12 text-base"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-base">
                  Confirmar nova senha
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  minLength={6}
                  className="mt-1 h-12 text-base"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword || password.length < 6}
                className="w-full h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </form>
          )}
        </div>

        {/* Legal Footer */}
        <LegalFooter className="mt-8" />
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <ResetPasswordFlow />
    </Suspense>
  )
}
