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

export const maxDuration = 60

// A função devolve só a contagem por plano (devolver ~31 mil linhas pesava e,
// com o loop por usuário, estourava o statement_timeout).
type ResetRow = {
  plan_slug: string
  users_reset: number
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

    const breakdown = Object.fromEntries(rows.map(r => [r.plan_slug, Number(r.users_reset)]))
    const usersReset = rows.reduce((sum, r) => sum + Number(r.users_reset), 0)

    console.log(
      `[cron/reset-credits] ${usersReset} users reset`,
      JSON.stringify(breakdown)
    )

    return NextResponse.json({
      success: true,
      users_reset: usersReset,
      breakdown,
    })
  } catch (err) {
    console.error('[cron/reset-credits] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
