// lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLIC_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )
}

// Admin client that bypasses RLS
export function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_API_KEY
  
  if (!url || !key) {
    console.error('[createAdminClient] Missing env vars:', { 
      hasUrl: !!url, 
      hasKey: !!key,
      url: url?.substring(0, 20) + '...',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    })
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_API_KEY are required')
  }
  
  return createSupabaseClient(
    url,
    key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}