// lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    // Durante SSR/prerender sem env vars, retornar um cliente mock
    // Isso previne erros de build mas o cliente real será criado no browser
    return null as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}