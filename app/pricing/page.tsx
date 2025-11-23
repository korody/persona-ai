'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { PricingCard } from '@/components/pricing/pricing-card'
import { PricingComparison } from '@/components/pricing/pricing-comparison'
import { PricingFAQ } from '@/components/pricing/pricing-faq'
import { WhatsAppSupport } from '@/components/whatsapp-support'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Plan {
  id: string
  slug: string
  name: string
  description: string
  price_brl: number
  credits_monthly: number
  features: string[]
  estimated_conversations: string
  popular: boolean
  stripe_price_id: string | null
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPlanSlug, setCurrentPlanSlug] = useState<string | null>(null)
  const router = useRouter()

  // Buscar planos e usuário
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        // Buscar usuário autenticado
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        // Buscar plano atual do usuário (se autenticado)
        if (currentUser) {
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('plan_id, subscription_plans(slug)')
            .eq('user_id', currentUser.id)
            .eq('status', 'active')
            .single()

          if (subscription) {
            setCurrentPlanSlug((subscription as any).subscription_plans?.slug || null)
          }
        }

        // Buscar planos disponíveis
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_brl', { ascending: true })

        if (error) throw error

        setPlans(data || [])
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Função para selecionar plano
  async function handleSelectPlan(planSlug: string) {
    const plan = plans.find(p => p.slug === planSlug)
    if (!plan) return

    // Plano FREE - redirecionar para signup
    if (plan.slug === 'free') {
      router.push('/signup')
      return
    }

    // Verificar autenticação
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    // Iniciar checkout
    setCheckoutLoading(plan.slug)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error)
        return
      }

      // Redirecionar para Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const plansToDisplay = plans.map(plan => ({
    id: plan.slug,
    name: plan.name,
    priceDisplay: plan.price_brl === 0 
      ? 'Grátis' 
      : `R$ ${plan.price_brl.toFixed(2).replace('.', ',')}`,
    description: plan.description || '',
    features: Array.isArray(plan.features) ? plan.features : [],
    estimatedConversations: plan.estimated_conversations || '',
    popular: plan.popular || false,
    ctaText: plan.slug === 'free' ? 'Começar Grátis' : 'Assinar Agora',
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 px-4 border-b">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4" variant="outline">
            PREÇOS TRANSPARENTES
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Comece sua jornada de autocuidado com o Mestre Ye. 
            Escolha o plano ideal para você.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1 cursor-help">
                  <Info className="h-4 w-4" />
                  <span className="underline decoration-dotted">O que é 1 crédito?</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>1 crédito = 1 interação (sua pergunta + resposta do Mestre Ye). Exemplo: 50 créditos = 50 interações</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plansToDisplay.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onSelect={handleSelectPlan}
                loading={checkoutLoading === plan.id}
                currentPlan={currentPlanSlug === plan.id}
              />
            ))}
          </div>

          {/* Garantia de 7 dias */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              💚 <strong>Garantia de 7 dias</strong> no primeiro pagamento. 
              Não gostou? Devolvemos 100% do valor.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Compare os Planos
          </h2>
          <PricingComparison />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          <PricingFAQ />
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Junte-se a milhares de pessoas que já melhoraram sua qualidade de vida 
            com a orientação do Mestre Ye.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Começar Grátis
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">
                Já tenho conta
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
