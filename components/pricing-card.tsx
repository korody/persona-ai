// components/pricing-card.tsx

'use client'

import { Button } from './ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  name: string
  price: number
  priceFormatted: string
  credits: number
  features: string[]
  isPopular?: boolean
  isCurrentPlan?: boolean
  onSelect: () => void
  loading?: boolean
}

export function PricingCard({
  name,
  price,
  priceFormatted,
  credits,
  features,
  isPopular,
  isCurrentPlan,
  onSelect,
  loading,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 bg-background p-8 shadow-sm transition-all',
        isPopular
          ? 'border-primary shadow-lg scale-105'
          : 'border-border hover:border-primary/50'
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground rounded-full">
            MAIS POPULAR
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold tracking-tight">
            {price === 0 ? 'Grátis' : `R$ ${price.toFixed(2).replace('.', ',')}`}
          </span>
          {price > 0 && (
            <span className="text-sm text-muted-foreground">/mês</span>
          )}
        </div>
        {credits > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {credits} créditos mensais
          </p>
        )}
      </div>

      <ul className="mt-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={onSelect}
        disabled={isCurrentPlan || loading}
        className="mt-8 w-full"
        variant={isPopular ? 'default' : 'outline'}
        size="lg"
      >
        {isCurrentPlan
          ? 'Plano Atual'
          : loading
          ? 'Processando...'
          : price === 0
          ? 'Começar Grátis'
          : 'Assinar Agora'}
      </Button>

      {isCurrentPlan && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Você já está neste plano
        </p>
      )}
    </div>
  )
}
