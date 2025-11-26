// app/(auth)/auth/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { LegalFooter } from '@/components/legal-footer'
import { WhatsAppSupport } from '@/components/whatsapp-support'
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'

type AuthStep = 'email' | 'login' | 'signup'

function AuthFlow() {
  const [step, setStep] = useState<AuthStep>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('BR')
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null)
  const [phoneFormatted, setPhoneFormatted] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [userHasPassword, setUserHasPassword] = useState<boolean>(true)  // Novo estado
  const [createdViaQuiz, setCreatedViaQuiz] = useState<boolean>(false)  // Novo estado
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/chat'

  // Validação de telefone
  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    setPhone(digitsOnly)

    if (digitsOnly.length >= 8) {
      try {
        const phoneNumber = parsePhoneNumber(digitsOnly, phoneCountry)
        const valid = phoneNumber && phoneNumber.isValid()
        setPhoneValid(valid)
        setPhoneFormatted(valid ? phoneNumber.formatInternational() : '')
      } catch {
        setPhoneValid(false)
        setPhoneFormatted('')
      }
    } else {
      setPhoneValid(null)
      setPhoneFormatted('')
    }
  }

  // 1. Verificar se email já existe
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao verificar email')
        setLoading(false)
        return
      }

      // Se email existe, verificar se tem senha
      if (data.exists) {
        const passwordCheckResponse = await fetch('/api/auth/check-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const passwordData = await passwordCheckResponse.json()
        setUserHasPassword(passwordData.hasPassword || false)
        setCreatedViaQuiz(passwordData.createdViaQuiz || false)
        
        setStep('login')
      } else {
        // Novo usuário → signup
        setStep('signup')
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Check email error:', err)
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  // 2. Login com senha
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email ou senha incorretos')
        setLoading(false)
        return
      }

      router.push(redirect)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  // 3. Magic Link - usar cliente vanilla para PKCE funcionar com localStorage
  const handleMagicLink = async () => {
    setLoading(true)
    setError(null)

    try {
      // Usar @supabase/supabase-js diretamente (não SSR) para localStorage funcionar
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
          }
        }
      )

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      })

      if (error) {
        console.error('Magic link error:', error)
        setError(error.message || 'Erro ao enviar link')
        setLoading(false)
        return
      }

      setMagicLinkSent(true)
      setLoading(false)
    } catch (err) {
      console.error('Magic link error:', err)
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  // 4. Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      setLoading(false)
      return
    }

    if (!phone || phoneValid !== true) {
      setError('Por favor, digite um celular válido')
      setLoading(false)
      return
    }

    // Converter telefone para E.164
    let phoneE164 = null
    try {
      const phoneNumber = parsePhoneNumber(phone, phoneCountry)
      if (phoneNumber && phoneNumber.isValid()) {
        phoneE164 = phoneNumber.format('E.164')
      }
    } catch {
      setError('Telefone inválido')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phoneE164,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
        setLoading(false)
        return
      }

      // Conta criada! Agora fazer login para obter a sessão
      console.log('[signup] Conta criada, fazendo login...')
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (loginResponse.ok) {
        router.push(redirect)
        router.refresh()
      } else {
        // Se login falhar, mostrar mensagem mas conta foi criada
        setError('Conta criada! Faça login para continuar.')
        setStep('email')
        setPassword('')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Erro de conexão')
      setLoading(false)
    }
  }

  // Voltar para o email
  const handleBack = () => {
    setStep('email')
    setPassword('')
    setFullName('')
    setPhone('')
    setError(null)
    setMagicLinkSent(false)
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
            {step === 'email' && 'Digite seu email para começar'}
            {step === 'login' && 'Que bom te ver novamente!'}
            {step === 'signup' && 'Vamos criar sua conta'}
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

          {magicLinkSent ? (
            <div className="text-center py-8">
              <div className="mb-4 text-6xl">📧</div>
              <h3 className="text-xl font-semibold mb-2">Email enviado!</h3>
              <p className="text-gray-600 mb-6">
                Enviamos um link mágico para <strong>{email}</strong>
                <br />
                Clique no link para entrar automaticamente.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full"
              >
                Voltar
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 1: Email */}
              {step === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      autoFocus
                      className="mt-1 h-12 text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-12 text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </Button>
                </form>
              )}

              {/* STEP 2: Login */}
              {step === 'login' && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-2 -mt-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>

                  <div className="bg-muted border rounded-md p-3 mb-4">
                    <p className="text-sm">
                      <strong>{email}</strong>
                    </p>
                  </div>

                  {/* Se usuário NÃO tem senha (veio do quiz) */}
                  {!userHasPassword ? (
                    <div className="space-y-4">
                      {createdViaQuiz && (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>✨ Bem-vind@ de volta!</strong>
                            <br />
                            Clique no botão para gerar seu Link de Acesso Fácil.
                          </p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleMagicLink}
                        disabled={loading}
                        className="w-full h-12 text-base"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            📧 Enviar Link de Acesso Fácil por email
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Você receberá um email com um link para entrar automaticamente
                      </p>
                    </div>
                  ) : (
                    /* Se usuário TEM senha */
                    <>
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                          <Label htmlFor="password" className="text-base">
                            Senha
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            required
                            autoFocus
                            className="mt-1 h-12 text-base"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={loading || !password}
                          className="w-full h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            'Entrar'
                          )}
                        </Button>
                      </form>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-card text-muted-foreground">ou</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleMagicLink}
                        disabled={loading}
                        className="w-full h-12 text-base"
                      >
                        📧 Enviar Link de Acesso Fácil por email
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: Signup */}
              {step === 'signup' && (
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-2 -mt-2"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>

                  <div className="bg-muted border rounded-md p-3 mb-4">
                    <p className="text-sm">
                      <strong>{email}</strong> - Vamos criar sua conta! 🎉
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-base">
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Maria da Silva"
                        required
                        autoFocus
                        className="mt-1 h-12 text-base"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-base">
                        WhatsApp
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <select
                          value={phoneCountry}
                          onChange={(e) => setPhoneCountry(e.target.value as CountryCode)}
                          className="px-3 py-2 border border-gray-300 rounded-md h-12 text-base"
                        >
                          <option value="BR">🇧🇷 +55</option>
                          <option value="US">🇺🇸 +1</option>
                          <option value="PT">🇵🇹 +351</option>
                        </select>
                        <div className="flex-1 relative">
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="11 98765-4321"
                            required
                            className="h-12 text-base pr-10"
                          />
                          {phoneValid === true && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                      {phoneFormatted && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {phoneFormatted}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="signup-password" className="text-base">
                        Senha (mínimo 6 caracteres)
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Crie uma senha"
                        required
                        minLength={6}
                        className="mt-1 h-12 text-base"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !fullName || !phone || phoneValid !== true || password.length < 6}
                      className="w-full h-12 text-base"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        'Criar minha conta'
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Support */}
        <div className="mt-6">
          <WhatsAppSupport />
        </div>

        {/* Legal Footer */}
        <LegalFooter className="mt-8" />
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <AuthFlow />
    </Suspense>
  )
}
