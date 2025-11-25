import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY!

/**
 * API para executar SQL direto no banco (bypass PostgREST cache)
 * Usado temporariamente até o cache atualizar
 */
export async function POST(request: Request) {
  try {
    const { sql, params } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: 'SQL query required' }, { status: 400 })
    }

    // Usar fetch direto na API do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ sql })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status })
    }

    return NextResponse.json({ data, success: true })

  } catch (error: any) {
    console.error('Error executing SQL:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 30
