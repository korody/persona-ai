// components/credit-badge.tsx

'use client'

import { useCredits } from '@/hooks/use-credits'
import { Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function CreditBadge() {
  const { credits, isLoading, isLowCredits, isOutOfCredits } = useCredits()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
        <div className="w-12 h-4 bg-gray-200 rounded" />
      </div>
    )
  }

  if (!credits) return null

  const total = credits.total

  return (
    <Link
      href="/settings/credits"
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full transition-all
        ${isOutOfCredits 
          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
          : isLowCredits 
          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
        }
      `}
    >
      {isOutOfCredits ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      <span className="text-sm font-semibold">
        {total} {total === 1 ? 'crédito' : 'créditos'}
      </span>
      {isLowCredits && !isOutOfCredits && (
        <span className="text-xs opacity-70">• Acabando</span>
      )}
    </Link>
  )
}