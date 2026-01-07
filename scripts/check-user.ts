// scripts/check-user.ts
// Script para verificar se um usuário existe no banco de dados

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUser(email: string) {
  console.log(`\n🔍 Verificando usuário: ${email}\n`)

  // 1. Buscar no auth.users (via Admin API)
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()

  const user = authUser?.users.find(u => u.email === email)

  if (!user) {
    console.log('❌ Usuário NÃO encontrado na tabela auth.users')
    console.log('\n📋 Possíveis causas:')
    console.log('   1. Email nunca foi cadastrado')
    console.log('   2. Conta foi deletada')
    console.log('   3. Email está incorreto\n')
    return
  }

  console.log('✅ Usuário encontrado em auth.users!')
  console.log(`   ID: ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`)
  console.log(`   Email confirmado: ${user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`)
  console.log(`   Telefone: ${user.phone || 'Não informado'}`)
  console.log(`   Último login: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca'}`)

  // 2. Buscar na tabela users (perfil público)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.log('\n⚠️  Usuário NÃO encontrado na tabela users (perfil)')
    console.log('   Isso pode causar problemas no app!')
  } else {
    console.log('\n✅ Perfil encontrado na tabela users:')
    console.log(`   Nome: ${profile.full_name || 'Não informado'}`)
    console.log(`   Créditos: ${profile.credits || 0}`)
    console.log(`   Plano: ${profile.current_plan || 'free'}`)
  }

  // 3. Verificar se há senha definida
  const hasPassword = user.encrypted_password && user.encrypted_password.length > 0
  console.log(`\n🔐 Senha definida: ${hasPassword ? '✅ Sim' : '❌ Não (precisa usar Magic Link)'}`)

  // 4. Buscar identidades (métodos de autenticação)
  console.log('\n🔑 Métodos de autenticação:')
  if (user.identities && user.identities.length > 0) {
    user.identities.forEach(identity => {
      console.log(`   - ${identity.provider}`)
    })
  } else {
    console.log('   Nenhum método de autenticação configurado')
  }

  console.log('\n')
}

const email = process.argv[2]

if (!email) {
  console.error('❌ Uso: tsx scripts/check-user.ts <email>')
  process.exit(1)
}

checkUser(email)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err)
    process.exit(1)
  })
