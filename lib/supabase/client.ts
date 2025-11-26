// lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY

  if (!supabaseUrl || !supabasePublicKey) {
    // Durante SSR/prerender sem env vars, retornar um cliente mock
    // Isso previne erros de build mas o cliente real será criado no browser
    return null as any
  }

  // Singleton para manter o mesmo cliente e preservar o code_verifier
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabasePublicKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  })

  return supabaseClient
}