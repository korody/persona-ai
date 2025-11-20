import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkEmbeddings() {
  console.log('🔍 Verificando embeddings salvos...\n')

  const { data, error } = await supabase
    .from('avatar_knowledge_base')
    .select('id, title, embedding')
    .eq('avatar_id', '4ba4ff39-823a-4aa9-a129-8f23fec2704d')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.log('❌ Erro:', error)
  } else {
    console.log(`✅ Encontrados ${data.length} registros:\n`)
    data.forEach((item, i) => {
      console.log(`${i + 1}. ${item.title}`)
      console.log(`   ID: ${item.id}`)
      console.log(`   Embedding: ${item.embedding ? `✅ Array[${item.embedding.length}]` : '❌ NULL'}`)
      if (item.embedding) {
        console.log(`   Primeiro valor: ${item.embedding[0]}`)
      }
      console.log()
    })
  }
}

checkEmbeddings()
