// app/admin/users/search/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Search, User, Mail, Phone, Calendar, Key, Shield } from 'lucide-react'
import Link from 'next/link'

export default function UserSearchPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!email) {
      setError('Digite um email para buscar')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/admin/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao buscar usuário')
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar para Admin
          </Link>
          <h1 className="text-3xl font-bold mt-4">Buscar Usuário</h1>
          <p className="text-muted-foreground mt-2">
            Verifique informações de um usuário por email
          </p>
        </div>

        {/* Search Form */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Digite o email do usuário..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {!result.found ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Usuário não encontrado</h3>
                  <p className="text-muted-foreground">
                    O email <strong>{result.email}</strong> não está cadastrado no sistema.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Auth User Info */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Informações de Autenticação
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <p className="font-mono text-sm">{result.authUser.email}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </div>
                      <p className="font-mono text-sm">{result.authUser.phone || 'Não informado'}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Criado em
                      </div>
                      <p className="text-sm">{new Date(result.authUser.created_at).toLocaleString('pt-BR')}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        Último login
                      </div>
                      <p className="text-sm">
                        {result.authUser.last_sign_in_at
                          ? new Date(result.authUser.last_sign_in_at).toLocaleString('pt-BR')
                          : 'Nunca fez login'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${result.authUser.confirmed ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm">
                        Email {result.authUser.confirmed ? 'confirmado' : 'não confirmado'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span className="text-sm">
                        {result.authUser.hasPassword ? 'Com senha' : 'Sem senha (Magic Link)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm">
                        ID: <code className="text-xs">{result.authUser.id.substring(0, 8)}...</code>
                      </span>
                    </div>
                  </div>

                  {result.authUser.identities && result.authUser.identities.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground mb-2">Métodos de autenticação:</div>
                      <div className="flex gap-2">
                        {result.authUser.identities.map((provider: string) => (
                          <span key={provider} className="px-2 py-1 bg-muted rounded text-xs">
                            {provider}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Profile Info */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Perfil do Usuário</h2>

                  {result.profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Nome completo</div>
                        <p className="font-medium">{result.profile.full_name || 'Não informado'}</p>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Créditos</div>
                        <p className="font-medium text-lg">{result.profile.credits || 0}</p>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Plano atual</div>
                        <p className="font-medium capitalize">{result.profile.current_plan || 'free'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>⚠️ Perfil não encontrado na tabela `users`</p>
                      {result.profileError && (
                        <p className="text-sm mt-2 text-destructive">{result.profileError}</p>
                      )}
                    </div>
                  )}
                </Card>

                {/* Diagnóstico */}
                <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <h2 className="text-xl font-semibold mb-4">💡 Diagnóstico</h2>

                  {!result.authUser.confirmed && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded">
                      <p className="text-sm font-semibold">⚠️ Email não confirmado</p>
                      <p className="text-sm mt-1">
                        O usuário precisa clicar no link de confirmação enviado por email.
                      </p>
                    </div>
                  )}

                  {!result.authUser.hasPassword && (
                    <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded">
                      <p className="text-sm font-semibold">🔑 Sem senha definida</p>
                      <p className="text-sm mt-1">
                        Usuário deve usar Magic Link para fazer login.
                      </p>
                    </div>
                  )}

                  {!result.profile && (
                    <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
                      <p className="text-sm font-semibold">❌ Perfil ausente</p>
                      <p className="text-sm mt-1">
                        Registro não encontrado na tabela <code>users</code>. Isso pode causar erros no app.
                      </p>
                    </div>
                  )}

                  {!result.authUser.last_sign_in_at && (
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded">
                      <p className="text-sm font-semibold">🚪 Nunca fez login</p>
                      <p className="text-sm mt-1">
                        Conta foi criada mas usuário nunca acessou o sistema.
                      </p>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
