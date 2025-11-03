// hooks/use-credits.ts

'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

interface Credits {
  balance: number
  bonus_balance: number
  total: number
  total_earned: number
  total_spent: number
}

const fetcher = async (url: string) => {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  })
  
  if (!res.ok) throw new Error('Failed to fetch credits')
  
  return res.json()
}

export function useCredits() {
  const { data, error, mutate } = useSWR<Credits>('/api/credits', fetcher, {
    refreshInterval: 30000, // Atualizar a cada 30 segundos
    revalidateOnFocus: true
  })

  const isLoading = !data && !error
  const isLowCredits = data && data.total <= 5
  const isOutOfCredits = data && data.total === 0

  return {
    credits: data,
    isLoading,
    isLowCredits,
    isOutOfCredits,
    error,
    mutate // Para forçar atualização manual
  }
}