// app/api/cron/reset-credits/route.ts

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: Request) {
  try {
    // Verificar authorization (Vercel Cron secret)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Executar função de reset para usuários free
    const { data: resetResults, error } = await supabase.rpc('reset_free_monthly_credits')

    if (error) {
      console.error('Error resetting credits:', error)
      return NextResponse.json({ error: 'Error resetting credits' }, { status: 500 })
    }

    console.log(`✅ Credits reset completed: ${resetResults?.length || 0} users`)

    // TODO: Enviar emails de notificação
    // for (const user of resetResults || []) {
    //   await sendCreditResetEmail(user.email, user.credits_added)
    // }

    return NextResponse.json({ 
      success: true, 
      users_reset: resetResults?.length || 0,
      users: resetResults
    })

  } catch (error) {
    console.error('Cron Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
