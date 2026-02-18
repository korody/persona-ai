// lib/constants.ts

import { generateDummyPassword } from "./db/utils";

// ============================================
// CONSTANTES ORIGINAIS DO TEMPLATE
// ============================================

export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// ============================================
// CONSTANTES DO PERSONA-AI
// ============================================

export const PLANS = {
  free: {
    name: 'Gratuito',
    price: 0,
    priceFormatted: 'R$ 0',
    credits: 0, // Sem reset mensal (usa sistema de 6 meses)
    features: [
      '20 créditos iniciais',
      '30 créditos do Quiz MTC',
      '20 créditos mensais por 6 meses',
      'Acesso ao Mestre Ye',
      'Histórico de conversas'
    ]
  },
  discipulo: {
    name: 'Discípulo',
    price: 39.90,
    priceFormatted: 'R$ 39,90',
    stripePriceId: process.env.STRIPE_PRICE_DISCIPULO || 'price_discipulo',
    credits: 300,
    features: [
      '300 créditos mensais',
      '~60 conversas por mês',
      'Histórico ilimitado',
      'Suporte prioritário',
      'Acesso antecipado a novos avatares'
    ]
  },
  mestre: {
    name: 'Mestre',
    price: 79.90,
    priceFormatted: 'R$ 79,90',
    stripePriceId: process.env.STRIPE_PRICE_MESTRE || 'price_mestre',
    credits: 1000,
    features: [
      '1.000 créditos mensais',
      '~200 conversas por mês',
      'Tudo do Discípulo',
      'Áudio ilimitado (TTS)',
      'Vídeo avatar (em breve)',
      'Consultas ao vivo mensais'
    ]
  }
} as const

export const CREDIT_PRICES = {
  100: {
    amount: 100,
    price: 14.90,
    priceFormatted: 'R$ 14,90',
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_100 || 'price_credits_100'
  },
  500: {
    amount: 500,
    price: 59.90,
    priceFormatted: 'R$ 59,90',
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_500 || 'price_credits_500'
  }
} as const

export const ELEMENTS = {
  Madeira: {
    name: 'Madeira',
    emoji: '🌳',
    color: 'green',
    organs: 'Fígado/Vesícula',
    emotion: 'Raiva, Frustração'
  },
  Fogo: {
    name: 'Fogo',
    emoji: '🔥',
    color: 'red',
    organs: 'Coração/Intestino Delgado',
    emotion: 'Ansiedade, Agitação'
  },
  Terra: {
    name: 'Terra',
    emoji: '🏔️',
    color: 'yellow',
    organs: 'Baço/Estômago',
    emotion: 'Preocupação, Pensamento'
  },
  Metal: {
    name: 'Metal',
    emoji: '⚪',
    color: 'gray',
    organs: 'Pulmão/Intestino Grosso',
    emotion: 'Tristeza, Melancolia'
  },
  Água: {
    name: 'Água',
    emoji: '💧',
    color: 'blue',
    organs: 'Rim/Bexiga',
    emotion: 'Medo, Insegurança'
  }
} as const

export const APP_CONFIG = {
  name: 'Mestre Ye Digital',
  tagline: 'Mestre Ye, sempre com você',
  description: 'Converse com o Mestre Ye 24/7 sobre Medicina Tradicional Chinesa',
  defaultAvatar: 'mestre-ye',
  supportEmail: 'suporte@qigongbrasil.com',
  whatsapp: '+5511950879456',
  company: {
    name: 'Qigong Brasil',
    website: 'https://qigongbrasil.com?utm_source=digital-mestre-ye'
  }
} as const

// Alertas de créditos baixos
export const CREDIT_THRESHOLDS = {
  low: 5,      // Alerta quando <= 5 créditos
  critical: 1  // Alerta crítico quando = 1 crédito
} as const

// Limites do sistema
export const LIMITS = {
  maxMessageLength: 2000,
  maxConversationTitle: 100,
  conversationsPerPage: 20,
  transactionsPerPage: 50
} as const