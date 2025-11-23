import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe/stripe-helpers'

export async function POST(req: NextRequest) {
  try {
    const { planId, userId } = await req.json()

    if (!planId || !userId) {
      return NextResponse.json(
        { error: 'Plan ID e User ID são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se tem stripe_price_id
    if (!plan.stripe_price_id) {
      return NextResponse.json(
        { error: 'Este plano não está disponível para pagamento' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Criar ou buscar Stripe Customer
    const customer = await getOrCreateStripeCustomer({
      email: user.email!,
      userId: user.id,
      name: user.user_metadata?.name || user.email,
    })

    // Salvar customer_id no perfil do usuário (se não existir)
    if (!user.user_metadata?.stripe_customer_id) {
      await supabase.auth.updateUser({
        data: {
          stripe_customer_id: customer.id,
        },
      })
    }

    // Criar sessão de checkout
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId: plan.stripe_price_id,
      userId: user.id,
      planId: plan.id,
      successUrl: `${baseUrl}/dashboard/subscription?payment=success`,
      cancelUrl: `${baseUrl}/pricing?payment=canceled`,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}
