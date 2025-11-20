import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkStructure() {
  console.log('🔍 Verificando estrutura da tabela avatar_knowledge_base...\n')

  try {
    // Query direto no information_schema
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'avatar_knowledge_base'
        ORDER BY ordinal_position;
      `
    })

    if (error) {
      console.log('❌ Erro via RPC:', error.message)
      console.log('\n🔄 Tentando via query direta...\n')
      
      // Tentar inserir um registro de teste para ver o erro
      const { error: insertError } = await supabase
        .from('avatar_knowledge_base')
        .insert({
          avatar_id: '4ba4ff39-823a-4aa9-a129-8f23fec2704d',
          title: 'Teste',
          content: 'Teste',
          embedding: new Array(1536).fill(0)
        })
        .select()

      if (insertError) {
        console.log('❌ Erro ao inserir:', insertError)
      } else {
        console.log('✅ Inserção funcionou!')
      }

      // Tentar SELECT sem content_type
      const { data: selectData, error: selectError } = await supabase
        .from('avatar_knowledge_base')
        .select('id, avatar_id, title, content')
        .limit(1)

      if (selectError) {
        console.log('❌ Erro ao selecionar:', selectError)
      } else {
        console.log('✅ SELECT funcionou:', selectData)
      }

    } else {
      console.log('✅ Estrutura da tabela:')
      console.table(data)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkStructure()
