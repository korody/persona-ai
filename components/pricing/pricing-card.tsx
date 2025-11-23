'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  plan: {
    id: string
    name: string
    priceDisplay: string
    description: string
    features: string[]
    estimatedConversations: string
    popular?: boolean
    ctaText: string
  }
  onSelect: (planId: string) => void
  loading?: boolean
  currentPlan?: boolean
}

export function PricingCard({ plan, onSelect, loading, currentPlan }: PricingCardProps) {
  return (
    <Card className={cn(
      "relative flex flex-col transition-all duration-300 hover:shadow-xl",
      plan.popular && "border-2 border-primary shadow-lg scale-105",
      currentPlan && "border-2 border-green-500"
    )}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold">
            ⭐ MAIS POPULAR
          </Badge>
        </div>
      )}

      {currentPlan && (
        <div className="absolute -top-4 right-4">
          <Badge className="bg-green-500 text-white px-3 py-1 text-xs">
            Plano Atual
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{plan.priceDisplay}</span>
            {plan.id !== 'free' && <span className="text-muted-foreground text-sm">/mês</span>}
          </div>
          <p className="text-xs text-muted-foreground italic">
            {plan.estimatedConversations}
          </p>
        </div>
        
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="pt-6">
        <Button 
          className={cn(
            "w-full font-semibold",
            plan.popular && "bg-primary hover:bg-primary/90"
          )}
          size="lg"
          variant={plan.popular ? "default" : "outline"}
          onClick={() => onSelect(plan.id)}
          disabled={loading || currentPlan}
        >
          {loading ? "Processando..." : currentPlan ? "Plano Ativo" : plan.ctaText}
        </Button>
      </CardFooter>
    </Card>
  )
}
