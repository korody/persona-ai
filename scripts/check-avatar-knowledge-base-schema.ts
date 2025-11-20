import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkSchema() {
  console.log('🔍 Verificando schema de avatar_knowledge_base...\n')

  // Testar SELECT *
  const { data, error } = await supabase
    .from('avatar_knowledge_base')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Erro:', error)
  } else {
    console.log('✅ SELECT * funcionou!')
    if (data && data.length > 0) {
      console.log('\nColunas disponíveis:', Object.keys(data[0]))
    } else {
      console.log('\n⚠️  Tabela vazia. Vou tentar inserir um registro básico...\n')
      
      // Tentar inserir apenas com colunas obrigatórias
      const { data: insertData, error: insertError } = await supabase
        .from('avatar_knowledge_base')
        .insert({
          avatar_id: '4ba4ff39-823a-4aa9-a129-8f23fec2704d',
          title: 'Teste Schema',
          content: 'Conteúdo de teste',
        })
        .select()

      if (insertError) {
        console.log('❌ Erro ao inserir:', insertError)
        console.log('\n💡 A tabela pode não ter essas colunas ainda.')
        console.log('   Precisamos adicionar content_type, tags, metadata, etc.\n')
      } else {
        console.log('✅ Inserção OK!')
        console.log('Colunas retornadas:', insertData ? Object.keys(insertData[0]) : 'nenhuma')
      }
    }
  }
}

checkSchema()
