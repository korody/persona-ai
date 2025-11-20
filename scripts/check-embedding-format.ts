/**
 * Verifica o formato dos embeddings armazenados
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmbeddings() {
  console.log('🔍 Verificando formato dos embeddings...\n')

  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id, embedding, metadata')
    .limit(1)

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Nenhum chunk encontrado')
    return
  }

  const chunk = data[0]
  console.log('📦 Primeiro chunk:')
  console.log(`   ID: ${chunk.id}`)
  console.log(`   Metadata:`, chunk.metadata)
  console.log(`\n📊 Embedding:`)
  console.log(`   Tipo: ${typeof chunk.embedding}`)
  console.log(`   É Array: ${Array.isArray(chunk.embedding)}`)
  
  if (Array.isArray(chunk.embedding)) {
    console.log(`   Length: ${chunk.embedding.length}`)
    console.log(`   Primeiros 5 valores: ${chunk.embedding.slice(0, 5)}`)
    console.log(`   Soma dos valores: ${chunk.embedding.reduce((sum: number, val: number) => sum + val, 0)}`)
    console.log(`   Todos zeros: ${chunk.embedding.every((val: number) => val === 0)}`)
  } else if (typeof chunk.embedding === 'string') {
    console.log(`   String length: ${chunk.embedding.length}`)
    console.log(`   Primeiros 100 chars: ${chunk.embedding.substring(0, 100)}`)
  } else {
    console.log(`   Valor: ${chunk.embedding}`)
  }
}

checkEmbeddings().catch(console.error)
