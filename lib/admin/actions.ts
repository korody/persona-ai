'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin-check'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  await requireAdmin()
  const supabase = createAdminClient()

  // 1. Buscar usuários do Auth (limitado a 50 na paginação padrão)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 100
  })

  if (authError || !users) {
    console.error('[getUsers] auth error:', authError)
    throw new Error('Falha ao buscar usuários')
  }

  // 2. Buscar créditos para esses usuários
  const userIds = users.map(u => u.id)
  const { data: credits, error: creditsError } = await supabase
    .from('credits')
    .select('user_id, balance, bonus_balance')
    .in('user_id', userIds)

  // 3. Buscar contagem de mensagens (para estimativa de tempo)
  // Como não podemos fazer join direto com auth.users, buscamos agregados
  const { data: messageCounts } = await supabase
    .from('messages')
    .select('conversation_id, conversations!inner(user_id)')
    .eq('role', 'user')
    .in('conversations.user_id', userIds)

  // Agrupar contagem por user_id
  const messagesByUser: Record<string, number> = {}
  messageCounts?.forEach((msg: any) => {
    const uid = msg.conversations?.user_id
    if (uid) messagesByUser[uid] = (messagesByUser[uid] || 0) + 1
  })

  if (creditsError) {
    console.error('[getUsers] credits error:', creditsError)
    // Não falhar tudo, apenas seguir sem créditos
  }

  // 4. Combinar dados
  const combinedUsers = users.map(user => {
    const userCredits = credits?.find(c => c.user_id === user.id)
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      total_messages: messagesByUser[user.id] || 0,
      credits: userCredits ? [userCredits] : [] // Manter formato array para compatibilidade com a UI
    }
  })

  // Ordenar por data (mais recente primeiro)
  return combinedUsers.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getUserDetails(userId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  // 1. Buscar dados do usuário no Auth
  const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId)

  if (authError || !user) {
    console.error('[getUserDetails] auth error:', authError)
    throw new Error('Usuário não encontrado')
  }

  // 2. Buscar créditos detalhados
  const { data: creditsDetails } = await supabase
    .from('credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  // 3. Buscar transações
  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // 4. Montar objeto
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    credits: creditsDetails ? [creditsDetails] : [],
    transactions: transactions || []
  }
}

export async function updateUserCredits(userId: string, amount: number, type: string, description: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  
  if (amount > 0) {
    // Adição simples: obter saldo atual primeiro
    const { data: currentCredits } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    const currentBalance = currentCredits?.balance || 0
    const newBalance = currentBalance + amount

    // Upsert para garantir que registro exista
    const { error: updateError } = await supabase
      .from('credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        // Mantemos bonus inalterado ou 0 se novo
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()

    if (updateError) throw updateError

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      type: type,
      description: description,
      balance_after: newBalance
    })
  } else {
    // Débito usando RPC
    const { error: debitError } = await supabase.rpc('debit_credits', {
      p_user_id: userId,
      p_amount: Math.abs(amount),
      p_type: type,
      p_description: description
    })

    if (debitError) throw debitError
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function getUserInteractions(userId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  console.log('[getUserInteractions] Fetching for userId:', userId)

  // 1. Buscar conversas
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      title,
      last_message_at
    `)
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })

  if (convError) {
    console.error('[getUserInteractions] conv error:', convError)
    throw new Error('Falha ao buscar conversas')
  }

  console.log('[getUserInteractions] Conversations found:', conversations?.length)

  // 2. Buscar mensagens para todas essas conversas
  const conversationIds = conversations.map(c => c.id)
  
  if (conversationIds.length === 0) {
    return []
  }

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('[getUserInteractions] msg error:', msgError)
    throw new Error('Falha ao buscar mensagens')
  }

  // 3. Agrupar mensagens por conversa
  const conversationsWithMessages = conversations.map(conv => ({
    ...conv,
    messages: messages.filter(m => m.conversation_id === conv.id)
  }))

  return conversationsWithMessages
}
