// app/api/cron/reset-credits/route.ts
//
// Cron job (Vercel) — roda dia 1 de cada mês às 09:00 UTC.
// Configurado em vercel.json: "0 9 1 * *".
//
// Reseta o balance de TODOS os usuários com assinatura ativa para o
// credits_monthly do plano deles (free=20, aprendiz=50, discipulo=250, mestre=600).
//
// Autorização: header `Authorization: Bearer ${CRON_SECRET}`.

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

type ResetRow = {
  user_id: string
  email: string
  plan_slug: string
  credits_set: number
  previous_balance: number
  new_balance: number
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase.rpc('reset_monthly_credits_all')

    if (error) {
      console.error('[cron/reset-credits] RPC error:', error)
      return NextResponse.json(
        { error: 'Error resetting credits', details: error.message },
        { status: 500 }
      )
    }

    const rows = (data ?? []) as ResetRow[]

    const breakdown = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.plan_slug] = (acc[r.plan_slug] ?? 0) + 1
      return acc
    }, {})

    console.log(
      `[cron/reset-credits] ${rows.length} users reset`,
      JSON.stringify(breakdown)
    )

    return NextResponse.json({
      success: true,
      users_reset: rows.length,
      breakdown,
      users: rows,
    })
  } catch (err) {
    console.error('[cron/reset-credits] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
