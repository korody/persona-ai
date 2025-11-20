// Script para verificar usuários e autenticação

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAuth() {
  console.log('🔐 VERIFICANDO AUTENTICAÇÃO\n')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 30) + '...\n')

  // 1. Listar usuários via Admin API
  console.log('📋 Teste 1: Listar usuários (Admin API)')
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.log('❌ Erro:', error.message)
    } else {
      console.log(`✅ Encontrados ${users.length} usuários:`)
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Criado: ${new Date(user.created_at!).toLocaleString('pt-BR')}`)
        console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`)
      })
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }

  // 2. Verificar tabela users (se existir)
  console.log('\n📋 Teste 2: Verificar tabela users')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(5)
    
    if (error) {
      console.log('❌ Erro ao acessar tabela users:', error.message)
      console.log('   (Isso é normal se não tiver tabela users customizada)')
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} registros na tabela users`)
      data?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.id}`)
      })
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }

  // 3. Verificar avatars
  console.log('\n📋 Teste 3: Verificar avatars')
  try {
    const { data, error } = await supabase
      .from('avatars')
      .select('id, name, slug')
    
    if (error) {
      console.log('❌ Erro:', error.message)
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} avatars:`)
      data?.forEach((avatar) => {
        console.log(`   - ${avatar.name} (${avatar.slug}) - ID: ${avatar.id}`)
      })
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }

  // 4. Verificar conversas
  console.log('\n📋 Teste 4: Verificar conversas')
  try {
    const { data, error, count } = await supabase
      .from('conversations')
      .select('id, user_id, created_at', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.log('❌ Erro:', error.message)
    } else {
      console.log(`✅ Total de conversas: ${count}`)
      if (data && data.length > 0) {
        console.log(`   Últimas 5:`)
        data.forEach((conv) => {
          console.log(`   - ID: ${conv.id}`)
          console.log(`     User: ${conv.user_id}`)
          console.log(`     Criada: ${new Date(conv.created_at).toLocaleString('pt-BR')}`)
        })
      }
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }

  // 5. Verificar créditos
  console.log('\n📋 Teste 5: Verificar créditos')
  try {
    const { data, error, count } = await supabase
      .from('credits')
      .select('user_id, balance, bonus_balance', { count: 'exact' })
      .limit(5)
    
    if (error) {
      console.log('❌ Erro:', error.message)
    } else {
      console.log(`✅ Total de registros de créditos: ${count}`)
      if (data && data.length > 0) {
        data.forEach((credit) => {
          console.log(`   User ${credit.user_id}: ${credit.balance} créditos + ${credit.bonus_balance} bônus`)
        })
      }
    }
  } catch (e: any) {
    console.log('❌ Exceção:', e.message)
  }

  console.log('\n✅ Verificação completa!')
}

checkAuth()
