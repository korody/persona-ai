// app/(auth)/login/page.tsx

'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2 } from 'lucide-react'
import { LegalFooter } from '@/components/legal-footer'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/chat'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')
        setLoading(false)
        return
      }

      router.push(redirect)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro de conexão com servidor')
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    setError('Magic link temporariamente desabilitado devido a problemas de conexão')
    return
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-xl border dark:border-slate-800">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre para conversar com o Mestre Ye
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={`mb-4 rounded-lg p-3 text-sm ${
              error.includes('✅') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Magic Link */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleMagicLink}
              disabled={loading || !email}
            >
              Enviar link mágico (sem senha)
            </Button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OU</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:underline"
            >
              Crie grátis
            </Link>
          </p>
        </div>

        <LegalFooter />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
