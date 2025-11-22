// app/(auth)/signup/page.tsx

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, Check } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validação de senha
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/chat')
        router.refresh()
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Conta criada com sucesso! 🎉</h1>
            <p className="text-muted-foreground mb-4">
              Você ganhou 20 créditos de boas-vindas
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o chat...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700">
              <span className="text-3xl font-bold text-white">P</span>
            </div>
            <h1 className="text-2xl font-bold">Comece grátis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              20 créditos de boas-vindas + 30 do Quiz MTC
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Maria Silva"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta grátis'
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>20 créditos de boas-vindas</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>+30 créditos ao completar o Quiz</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>20 créditos mensais por 6 meses</span>
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OU</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Ao criar uma conta, você concorda com nossos{' '}
          <a href="#" className="underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="#" className="underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  )
}