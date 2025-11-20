// Script para diagnosticar o problema do cache do Supabase

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DO SUPABASE\n')
  console.log('URL:', supabaseUrl)
  console.log('Service Key:', supabaseServiceKey.substring(0, 20) + '...\n')

  // Teste 1: Verificar se conseguimos conectar
  console.log('📡 Teste 1: Conexão com Supabase')
  try {
    const { data: avatars, error } = await supabase
      .from('avatars')
      .select('id, name, slug')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro ao buscar avatars:', error)
    } else {
      console.log('✅ Conexão OK - Avatars encontrados:', avatars)
    }
  } catch (e) {
    console.log('❌ Exceção:', e)
  }

  // Teste 2: Tentar acessar avatar_knowledge_base
  console.log('\n📚 Teste 2: Acessar avatar_knowledge_base')
  try {
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .select('id, title')
      .limit(1)
    
    if (error) {
      console.log('❌ Erro:', error)
      console.log('   Code:', error.code)
      console.log('   Message:', error.message)
      console.log('   Details:', error.details)
      console.log('   Hint:', error.hint)
    } else {
      console.log('✅ Tabela acessível! Dados:', data)
    }
  } catch (e) {
    console.log('❌ Exceção:', e)
  }

  // Teste 3: Verificar via SQL direto
  console.log('\n🔧 Teste 3: Query SQL direta')
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'avatar%' ORDER BY table_name;"
    })
    
    if (error) {
      console.log('❌ RPC exec_sql não disponível:', error.message)
      console.log('   Isso é normal - vamos usar outra abordagem')
    } else {
      console.log('✅ Tabelas encontradas:', data)
    }
  } catch (e) {
    console.log('ℹ️  RPC não disponível (esperado)')
  }

  // Teste 4: Listar todas as tabelas acessíveis
  console.log('\n📋 Teste 4: Listar todas as tabelas disponíveis via API')
  const tablesToTest = [
    'avatars',
    'avatar_knowledge_base',
    'avatar_conversation_examples',
    'avatar_prompt_versions',
    'user_memory',
    'conversation_feedback',
    'learned_patterns',
    'conversations',
    'messages'
  ]

  for (const table of tablesToTest) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0) // Não trazer dados, só testar acesso
      
      if (error) {
        console.log(`❌ ${table}: ${error.code} - ${error.message}`)
      } else {
        console.log(`✅ ${table}: Acessível`)
      }
    } catch (e: any) {
      console.log(`❌ ${table}: Exceção - ${e.message}`)
    }
  }

  // Teste 5: Verificar versão do PostgREST
  console.log('\n🔍 Teste 5: Headers da API')
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/avatars?limit=0`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    })
    
    console.log('Status:', response.status)
    console.log('Headers:')
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('postgrest') || key.toLowerCase().includes('version')) {
        console.log(`  ${key}: ${value}`)
      }
    })
  } catch (e) {
    console.log('❌ Erro ao buscar headers:', e)
  }

  console.log('\n✅ Diagnóstico completo!')
}

diagnose()
