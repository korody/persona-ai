import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/stripe-helpers'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Desabilitar body parsing do Next.js para webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { user_id, plan_id } = session.metadata!

        console.log('✅ Checkout completed:', { user_id, plan_id })

        // Buscar dados do plano
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('credits_per_month, initial_bonus_credits, bonus_credits_duration_months')
          .eq('id', plan_id)
          .single()

        if (!plan) {
          console.error('Plan not found:', plan_id)
          break
        }

        // Verificar se já existe uma assinatura
        const { data: existingSub } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', user_id)
          .single()

        if (existingSub) {
          // Atualizar assinatura existente
          await supabase
            .from('user_subscriptions')
            .update({
              plan_id,
              status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              current_credits: plan.credits_per_month,
              bonus_credits: plan.initial_bonus_credits || 0,
              bonus_credits_expiry: plan.bonus_credits_duration_months
                ? new Date(Date.now() + plan.bonus_credits_duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
                : null,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user_id)
        } else {
          // Criar nova assinatura
          await supabase.from('user_subscriptions').insert({
            user_id,
            plan_id,
            status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            current_credits: plan.credits_per_month,
            bonus_credits: plan.initial_bonus_credits || 0,
            bonus_credits_expiry: plan.bonus_credits_duration_months
              ? new Date(Date.now() + plan.bonus_credits_duration_months * 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }

        // Registrar transação de créditos
        await supabase.from('credit_transactions').insert({
          user_id,
          amount: plan.credits_per_month,
          type: 'refill',
          description: 'Créditos mensais do plano',
          balance_after: plan.credits_per_month + (plan.initial_bonus_credits || 0),
        })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (!invoice.subscription) break

        console.log('✅ Payment succeeded:', invoice.subscription)

        // Buscar assinatura
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('user_id, plan_id, subscription_plans(credits_per_month)')
          .eq('stripe_subscription_id', invoice.subscription as string)
          .single()

        if (!subscription) break

        const credits = (subscription as any).subscription_plans?.credits_per_month || 0

        // Reset créditos mensais
        await supabase
          .from('user_subscriptions')
          .update({
            current_credits: credits,
            current_period_start: new Date(invoice.period_start * 1000).toISOString(),
            current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', invoice.subscription as string)

        // Registrar transação
        await supabase.from('credit_transactions').insert({
          user_id: (subscription as any).user_id,
          amount: credits,
          type: 'monthly_reset',
          description: 'Reset mensal de créditos',
          balance_after: credits,
        })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('✅ Subscription updated:', subscription.id)

        await supabase
          .from('user_subscriptions')
          .update({
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status as any,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('✅ Subscription deleted:', subscription.id)

        await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
