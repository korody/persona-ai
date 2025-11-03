// app/api/credits/route.ts

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    // Pegar token de autorização
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    // Verificar autenticação usando o token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar créditos
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, bonus_balance, total_earned, total_spent')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !credits) {
      return NextResponse.json({ error: 'Credits not found' }, { status: 404 })
    }

    return NextResponse.json({
      balance: credits.balance,
      bonus_balance: credits.bonus_balance,
      total: credits.balance + credits.bonus_balance,
      total_earned: credits.total_earned,
      total_spent: credits.total_spent
    })

  } catch (error) {
    console.error('Credits API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}