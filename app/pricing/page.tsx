// app/pricing/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { PricingCard } from '@/components/pricing-card'
import { PLANS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState<string>('free')
  const [loading, setLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    setUser(authUser)

    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setCurrentTier(data.subscription_tier)
      }
    }
  }

  const handleSelectPlan = async (tier: string) => {
    // Se não está logado, redirecionar para signup
    if (!user) {
      router.push(`/signup?plan=${tier}`)
      return
    }

    // Se é plano free, não faz nada
    if (tier === 'free') {
      toast.info('Você já está no plano gratuito')
      return
    }

    setLoading(tier)

    try {
      // TODO: Integração com Stripe
      // Por enquanto, apenas uma mensagem
      toast.info('Em breve! Pagamentos com Stripe serão implementados.')
      
      // Exemplo de como seria:
      // const response = await fetch('/api/checkout', {
      //   method: 'POST',
      //   body: JSON.stringify({ priceId: PLANS[tier].stripePriceId })
      // })
      // const { url } = await response.json()
      // window.location.href = url
      
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao processar pagamento')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 py-16">
        <div className="container max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">
              Escolha o plano ideal para você
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Converse com o Mestre Ye 24/7 sobre Medicina Tradicional Chinesa. 
              Comece grátis e escale quando precisar.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name={PLANS.free.name}
              price={PLANS.free.price}
              priceFormatted={PLANS.free.priceFormatted}
              credits={PLANS.free.credits}
              features={PLANS.free.features}
              isCurrentPlan={currentTier === 'free'}
              onSelect={() => handleSelectPlan('free')}
              loading={loading === 'free'}
            />

            <PricingCard
              name={PLANS.discipulo.name}
              price={PLANS.discipulo.price}
              priceFormatted={PLANS.discipulo.priceFormatted}
              credits={PLANS.discipulo.credits}
              features={PLANS.discipulo.features}
              isPopular
              isCurrentPlan={currentTier === 'discipulo'}
              onSelect={() => handleSelectPlan('discipulo')}
              loading={loading === 'discipulo'}
            />

            <PricingCard
              name={PLANS.mestre.name}
              price={PLANS.mestre.price}
              priceFormatted={PLANS.mestre.priceFormatted}
              credits={PLANS.mestre.credits}
              features={PLANS.mestre.features}
              isCurrentPlan={currentTier === 'mestre'}
              onSelect={() => handleSelectPlan('mestre')}
              loading={loading === 'mestre'}
            />
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Perguntas Frequentes
            </h2>
            
            <div className="space-y-4">
              <details className="rounded-lg bg-white p-4 shadow-sm">
                <summary className="font-semibold cursor-pointer">
                  Como funcionam os créditos?
                </summary>
                <p className="mt-2 text-muted-foreground text-sm">
                  Cada mensagem enviada ao Mestre Ye consome 1 crédito. 
                  Créditos mensais resetam todo mês, enquanto créditos bônus 
                  (como do Quiz) acumulam sem expirar.
                </p>
              </details>

              <details className="rounded-lg bg-white p-4 shadow-sm">
                <summary className="font-semibold cursor-pointer">
                  Posso cancelar a qualquer momento?
                </summary>
                <p className="mt-2 text-muted-foreground text-sm">
                  Sim! Você pode cancelar sua assinatura a qualquer momento. 
                  Você continua tendo acesso até o fim do período pago.
                </p>
              </details>

              <details className="rounded-lg bg-white p-4 shadow-sm">
                <summary className="font-semibold cursor-pointer">
                  O que acontece com créditos não usados?
                </summary>
                <p className="mt-2 text-muted-foreground text-sm">
                  Créditos mensais NÃO acumulam - resetam todo mês. 
                  Já os créditos bônus (Quiz, indicações) acumulam indefinidamente.
                </p>
              </details>

              <details className="rounded-lg bg-white p-4 shadow-sm">
                <summary className="font-semibold cursor-pointer">
                  Posso comprar créditos avulsos?
                </summary>
                <p className="mt-2 text-muted-foreground text-sm">
                  Em breve! Vamos disponibilizar pacotes avulsos de 100 e 500 créditos 
                  para quem precisa de mais flexibilidade.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}