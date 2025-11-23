'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, CreditCard, Calendar, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  status: string
  current_credits: number
  bonus_credits: number
  current_period_end: string
  cancel_at_period_end: boolean
  plan: {
    name: string
    slug: string
    price_monthly: number
    credits_per_month: number
  }
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const supabase = createClient()

        // Verificar autenticação
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // Buscar assinatura
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            plan:subscription_plans(
              name,
              slug,
              price_monthly,
              credits_per_month
            )
          `)
          .eq('user_id', currentUser.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar assinatura:', error)
        }

        if (data) {
          setSubscription({
            ...data,
            plan: Array.isArray(data.plan) ? data.plan[0] : data.plan
          } as any)
        }
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalCredits = (subscription?.current_credits || 0) + (subscription?.bonus_credits || 0)
  const maxCredits = subscription?.plan?.credits_per_month || 100
  const creditsPercentage = Math.min((totalCredits / maxCredits) * 100, 100)

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Minha Assinatura</h1>

        {!subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Sem assinatura ativa</CardTitle>
              <CardDescription>
                Você ainda não possui uma assinatura. Escolha um plano para começar!
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/pricing">Ver Planos</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Plano Atual */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Plano {subscription.plan.name}
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      R$ {subscription.plan.price_monthly.toFixed(2).replace('.', ',')} /mês
                    </CardDescription>
                  </div>
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Créditos disponíveis</span>
                    <span className="text-2xl font-bold">{totalCredits}</span>
                  </div>
                  <Progress value={creditsPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {subscription.current_credits} créditos regulares
                    {subscription.bonus_credits > 0 && ` + ${subscription.bonus_credits} bônus`}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Próxima renovação: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Cancelamento agendado
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        Sua assinatura será cancelada no final do período atual
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/pricing">Mudar Plano</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/subscription/billing">Gerenciar Cobrança</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Uso de Créditos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Histórico de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Em breve: Gráfico detalhado do seu uso de créditos
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
