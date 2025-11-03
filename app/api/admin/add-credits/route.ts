// app/api/admin/add-credits/route.ts

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { email, amount = 1000 } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = await createAdminClient()

    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Tentar via auth.getUser se não encontrar na tabela
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
      const foundUser = users?.find(u => u.email === email)
      
      if (!foundUser) {
        return new Response(
          JSON.stringify({ error: 'Usuário não encontrado' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Adicionar créditos
      const { data: credits, error: creditsError } = await supabase
        .from('credits')
        .upsert({
          user_id: foundUser.id,
          balance: amount,
          bonus_balance: 0
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (creditsError) {
        // Se der erro no upsert, tentar update direto
        const { error: updateError } = await supabase.rpc('add_credits_admin', {
          p_user_id: foundUser.id,
          p_amount: amount
        })

        if (updateError) {
          // Última tentativa: INSERT ou UPDATE manual
          const { data: existing } = await supabase
            .from('credits')
            .select('balance')
            .eq('user_id', foundUser.id)
            .single()

          if (existing) {
            await supabase
              .from('credits')
              .update({ balance: existing.balance + amount })
              .eq('user_id', foundUser.id)
          } else {
            await supabase
              .from('credits')
              .insert({ user_id: foundUser.id, balance: amount, bonus_balance: 0 })
          }
        }
      }

      // Buscar créditos atualizados
      const { data: finalCredits } = await supabase
        .from('credits')
        .select('balance, bonus_balance')
        .eq('user_id', foundUser.id)
        .single()

      return new Response(
        JSON.stringify({
          success: true,
          message: `✅ ${amount} créditos adicionados para ${email}`,
          user: {
            id: foundUser.id,
            email: foundUser.email
          },
          credits: finalCredits || { balance: amount, bonus_balance: 0 }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Erro ao processar' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin add credits error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
