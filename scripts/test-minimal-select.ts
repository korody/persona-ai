import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testMinimalColumns() {
  console.log('🔍 Testando SELECT apenas em colunas que o cache conhece...\n')

  try {
    // Tentar SELECT com colunas básicas
    const { data, error } = await supabase
      .from('avatar_knowledge_base')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ SELECT * falhou:', error.message)
      
      // Tentar sem nada
      const { data: data2, error: error2 } = await supabase
        .from('avatar_knowledge_base')
        .select()
        .limit(1)

      if (error2) {
        console.log('❌ SELECT simples falhou:', error2.message)
      } else {
        console.log('✅ SELECT simples funcionou!')
        console.log('Colunas retornadas:', Object.keys(data2[0] || {}))
      }

    } else {
      console.log('✅ SELECT * funcionou!')
      console.log('Dados:', data)
      if (data.length > 0) {
        console.log('\nColunas disponíveis:', Object.keys(data[0]))
      } else {
        console.log('\nTabela vazia, mas existe!')
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

testMinimalColumns()
