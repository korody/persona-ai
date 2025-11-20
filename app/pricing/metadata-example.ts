// app/pricing/metadata.ts
// Adicione este código no topo do page.tsx quando converter para Server Component

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Preços e Planos | Mestre Ye Digital',
  description: 'Escolha o plano ideal para sua jornada com o Mestre Ye. Planos a partir de R$ 29,90/mês com créditos mensais para conversas sobre Medicina Tradicional Chinesa.',
  keywords: [
  'preços mestre ye digital',
    'planos medicina chinesa',
    'assinatura mestre ye',
    'créditos conversa',
    'plano mensal mtc',
  ],
  openGraph: {
  title: 'Preços e Planos | Mestre Ye Digital',
    description: 'Converse com o Mestre Ye 24/7. Planos a partir de R$ 29,90/mês.',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: '/og-pricing.png',
        width: 1200,
        height: 630,
  alt: 'Mestre Ye Digital - Planos e Preços',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  title: 'Preços e Planos | Mestre Ye Digital',
    description: 'Converse com o Mestre Ye 24/7. Planos a partir de R$ 29,90/mês.',
    images: ['/og-pricing.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}
