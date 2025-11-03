// hooks/use-conversations.ts

'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string
  title: string
  last_message_at: string
  total_credits_used: number
  avatars: {
    name: string
    slug: string
  }
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
  
  if (!res.ok) throw new Error('Failed to fetch conversations')
  
  const json = await res.json()
  return json.conversations
}

export function useConversations() {
  const { data, error, mutate } = useSWR<Conversation[]>(
    '/api/conversations', 
    fetcher,
    {
      refreshInterval: 60000, // Atualizar a cada 60 segundos
    }
  )

  return {
    conversations: data,
    isLoading: !data && !error,
    error,
    mutate
  }
}