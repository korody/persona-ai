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
import { parsePhoneNumber, type CountryCode } from 'libphonenumber-js'
import { LegalFooter } from '@/components/legal-footer'
import { WhatsAppSupport } from '@/components/whatsapp-support'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('BR')
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null)
  const [phoneFormatted, setPhoneFormatted] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()

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

  const handleCountryChange = (country: string) => {
    setPhoneCountry(country as CountryCode)
    
    // Re-validar telefone com novo país
    if (phone) {
      try {
        const phoneNumber = parsePhoneNumber(phone, country as CountryCode)
        const valid = phoneNumber && phoneNumber.isValid()
        setPhoneValid(valid)
        setPhoneFormatted(valid ? phoneNumber.formatInternational() : '')
      } catch {
        setPhoneValid(false)
        setPhoneFormatted('')
      }
    }
  }

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
    if (phone) {
      try {
        const phoneNumber = parsePhoneNumber(phone, phoneCountry)
        if (phoneNumber && phoneNumber.isValid()) {
          phoneE164 = phoneNumber.format('E.164') // Ex: +5511998457676
        }
      } catch {
        // Se falhar, continua sem telefone
        phoneE164 = null
      }
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phoneE164, // Salva em formato E.164 para matching robusto
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-xl border dark:border-slate-700 text-center">
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-xl border dark:border-slate-700">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Comece grátis</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              20 créditos de boas-vindas
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
              <Label htmlFor="phone">Celular (WhatsApp)</Label>
              
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  disabled={loading}
                  className="w-36 px-3 py-2 border border-input rounded-md text-sm bg-background"
                >
                  <option value="BR">🇧🇷 Brasil +55</option>
                  <option value="PT">🇵🇹 Portugal +351</option>
                  <option value="US">🇺🇸 EUA +1</option>
                  <option value="ES">🇪🇸 Espanha +34</option>
                  <option value="AR">🇦🇷 Argentina +54</option>
                  <option value="MX">🇲🇽 México +52</option>
                </select>

                <Input
                  id="phone"
                  type="tel"
                  placeholder={phoneCountry === 'BR' ? '11 99999-9999' : 'Número local'}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  required
                  disabled={loading}
                  className={
                    phoneValid === false
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : phoneValid === true
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : ''
                  }
                />
              </div>

              {phone && phone.length >= 8 && phoneValid === false && (
                <p className="text-sm text-red-600 mt-1">
                  ❌ Número inválido para {phoneCountry === 'BR' ? 'Brasil' : 'o país selecionado'}
                </p>
              )}
              {phoneValid === true && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ {phoneFormatted}
                </p>
              )}
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

            <div className="flex items-start gap-2 text-sm">
              <input
                id="terms"
                type="checkbox"
                required
                disabled={loading}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-muted-foreground cursor-pointer">
                Li e concordo com os{' '}
                <Link href="/termos" target="_blank" className="text-primary hover:underline">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacidade" target="_blank" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>
              </label>
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

        <LegalFooter />
      </div>
    </div>
  )
}
