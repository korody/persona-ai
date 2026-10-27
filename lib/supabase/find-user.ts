// lib/supabase/find-user.ts

import type { SupabaseClient } from '@supabase/supabase-js'

// Acha a conta pelo e-mail direto no banco (função find_auth_user_id_by_email,
// só a chave secreta executa). Não use auth.admin.listUsers() para isso:
// ele traz só a primeira página (50 contas) e não acha quase ninguém.
export async function findAuthUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  const { data, error } = await admin.rpc('find_auth_user_id_by_email', { p_email: email })
  if (error) {
    console.error('[findAuthUserIdByEmail] erro na busca:', error.message)
    throw new Error('Falha ao buscar usuário por e-mail')
  }
  return (data as string | null) ?? null
}
