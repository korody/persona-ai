// app/pricing/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_brl: number
  credits_monthly: number
  features: string[]
  is_active: boolean
  sort_order: number
}

export default function PricingPage() {
  // Estados
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()

  // Buscar planos do Supabase
  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()
        // Buscar planos ativos ordenados por sort_order
        const { data, error: fetchError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (fetchError) throw fetchError

        setPlans(data || [])
      } catch (err: any) {
        console.error('Erro ao buscar planos:', err)
        setError(err.message || 'Erro ao carregar planos')
      } finally {
        setLoading(false)
      }
    }

    async function checkUser() {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
    }

    fetchPlans()
    checkUser()
  }, [])

  // Handler do botão "Começar Agora"
  const handleSelectPlan = async (planSlug: string) => {
    // Verificar se usuário está logado
    if (!user) {
      router.push(`/login?redirect=/pricing&plan=${planSlug}`)
      return
    }

    setSelectedPlan(planSlug)

    try {
      // TODO: Preparar para checkout Stripe (implementar depois)
      console.log('Plano selecionado:', planSlug)
      
      // Exemplo de integração futura:
      // const response = await fetch('/api/checkout', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ planSlug })
      // })
      // const { url } = await response.json()
      // window.location.href = url
      
      alert(`Em breve! Checkout do plano ${planSlug}`)
    } catch (err) {
      console.error('Erro ao selecionar plano:', err)
    } finally {
      setSelectedPlan(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <div className="flex-1 py-16 px-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comece sua jornada de autocuidado com o Mestre Ye. 
            Escolha o plano ideal para você.
          </p>
        </div>

        {/* Cards dos Planos */}
        {loading ? (
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border">
                <CardHeader className="space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 bg-muted rounded"></div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto">
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-destructive font-semibold mb-2">
                    Erro ao carregar planos
                  </p>
                  <p className="text-destructive/80 text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isPopular = plan.slug === 'discipulo'
              const isLoading = selectedPlan === plan.slug

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-300 hover:shadow-2xl ${
                    isPopular
                      ? 'border-2 border-primary shadow-xl scale-[1.05] bg-card'
                      : 'border hover:scale-[1.02] bg-card'
                  }`}
                >
                  {/* Badge "MAIS POPULAR" */}
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary hover:bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-lg">
                        MAIS POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center space-y-4 pt-10 px-6">
                    <h3 className="text-2xl font-bold">
                      {plan.name}
                    </h3>
                    
                    {/* Preço */}
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl font-bold tracking-tight">
                          R$ {plan.price_brl.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-muted-foreground text-lg">/mês</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {plan.credits_monthly} créditos por mês
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground min-h-[3rem] leading-relaxed">
                      {plan.description}
                    </p>
                  </CardHeader>

                  <CardContent className="px-6 py-6">
                    {/* Features List */}
                    <ul className="space-y-3.5">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="px-6 pb-8">
                    <Button
                      onClick={() => handleSelectPlan(plan.slug)}
                      disabled={isLoading}
                      size="lg"
                      className={`w-full text-base font-semibold transition-all shadow-md hover:shadow-lg ${
                        isPopular
                          ? 'bg-primary hover:bg-primary/90'
                          : ''
                      }`}
                      variant={isPopular ? 'default' : 'outline'}
                      aria-label={`Selecionar plano ${plan.name}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Começar Agora'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-10">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-4">
            <details className="group rounded-lg bg-card p-6 border transition-all hover:shadow-lg">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>Como funcionam os créditos?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <div className="mt-4 text-muted-foreground text-sm leading-relaxed space-y-2">
                <p>
                  <strong>1 crédito = 1 interação completa</strong> com o Mestre Ye.
                </p>
                <p>
                  Uma interação é composta por: sua mensagem + resposta do Mestre Ye.
                </p>
                <p>
                  Créditos mensais resetam todo mês, enquanto créditos bônus 
                  (como do Quiz) acumulam sem expirar.
                </p>
              </div>
            </details>

            <details className="group rounded-lg bg-card p-6 border transition-all hover:shadow-lg">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>Posso cancelar a qualquer momento?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Sim! Você pode cancelar sua assinatura a qualquer momento. 
                Você continua tendo acesso até o fim do período pago.
              </p>
            </details>

            <details className="group rounded-lg bg-card p-6 border transition-all hover:shadow-lg">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>O que acontece com créditos não usados?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Créditos mensais NÃO acumulam - resetam todo mês. 
                Já os créditos bônus (Quiz, indicações) acumulam indefinidamente.
              </p>
            </details>

            <details className="group rounded-lg bg-card p-6 border transition-all hover:shadow-lg">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                <span>Posso trocar de plano depois?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
                O valor é ajustado proporcionalmente ao período restante.
              </p>
            </details>
          </div>
        </div>
      </div>
      <WhatsAppSupport />
    </div>
  )
}