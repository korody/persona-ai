// app/api/credits/route.ts

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('balance, bonus_balance, total_earned, total_spent')
      .eq('user_id', user.id)
      .single()

    if (creditsError) {
      console.error('Credits fetch error:', creditsError)
      
      // Se não existe registro de créditos, criar um
      if (creditsError.code === 'PGRST116') {
        const { data: newCredits, error: insertError } = await supabase
          .from('credits')
          .insert({
            user_id: user.id,
            balance: 0,
            bonus_balance: 20, // Bônus de boas-vindas
            total_earned: 20,
            total_spent: 0
          })
          .select('balance, bonus_balance, total_earned, total_spent')
          .single()

        if (insertError || !newCredits) {
          return NextResponse.json({ error: 'Failed to create credits' }, { status: 500 })
        }

        return NextResponse.json({
          balance: newCredits.balance,
          bonus_balance: newCredits.bonus_balance,
          total: newCredits.balance + newCredits.bonus_balance,
          total_earned: newCredits.total_earned,
          total_spent: newCredits.total_spent
        })
      }
      
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
