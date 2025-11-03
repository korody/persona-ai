// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

export function formatCreditTransaction(type: string): string {
  const labels: Record<string, string> = {
    'signup_bonus': '🎁 Bônus de boas-vindas',
    'monthly_reset': '🔄 Reset mensal',
    'purchase': '💳 Compra de créditos',
    'message_sent': '💬 Mensagem enviada',
    'audio_generated': '🔊 Áudio gerado',
    'quiz_bonus': '🎉 Bônus do Quiz MTC',
    'referral_bonus': '👥 Indicação de amigo',
    'admin_grant': '⭐ Crédito administrativo',
    'subscription_activated': '✨ Assinatura ativada'
  }
  return labels[type] || type
}

export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    'Madeira': 'text-green-600 bg-green-50',
    'Fogo': 'text-red-600 bg-red-50',
    'Terra': 'text-yellow-600 bg-yellow-50',
    'Metal': 'text-gray-600 bg-gray-50',
    'Água': 'text-blue-600 bg-blue-50'
  }
  return colors[element] || 'text-gray-600 bg-gray-50'
}

export function getPlanName(tier: string): string {
  const plans: Record<string, string> = {
    'free': 'Gratuito',
    'discipulo': 'Discípulo',
    'mestre': 'Mestre'
  }
  return plans[tier] || tier
}

export function getPlanPrice(tier: string): string {
  const prices: Record<string, string> = {
    'free': 'R$ 0',
    'discipulo': 'R$ 39,90/mês',
    'mestre': 'R$ 79,90/mês'
  }
  return prices[tier] || 'N/A'
}