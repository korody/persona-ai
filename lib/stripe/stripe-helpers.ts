import Stripe from 'stripe'

// Temporariamente comentado até configurar as chaves do Stripe
// if (!process.env.STRIPE_SECRET_KEY) {
//   throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
// }

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

/**
 * Cria ou busca um Stripe Customer para um usuário
 */
export async function getOrCreateStripeCustomer(params: {
  email: string
  userId: string
  name?: string
}) {
  const { email, userId, name } = params

  // Buscar customer existente
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // Criar novo customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      supabase_user_id: userId,
    },
  })

  return customer
}

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  userId: string
  planId: string
  successUrl: string
  cancelUrl: string
}) {
  const { customerId, priceId, userId, planId, successUrl, cancelUrl } = params

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      plan_id: planId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  return session
}

/**
 * Cria um portal de gerenciamento de assinatura
 */
export async function createCustomerPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const { customerId, returnUrl } = params

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return portalSession
}

/**
 * Cancela uma assinatura no Stripe
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  return subscription
}

/**
 * Reativa uma assinatura cancelada
 */
export async function reactivateSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  return subscription
}

/**
 * Busca informações de uma assinatura
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Formata preço brasileiro
 */
export function formatBRLPrice(cents: number): string {
  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais)
}
