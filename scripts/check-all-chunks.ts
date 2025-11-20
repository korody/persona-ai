/**
 * Verificar distribuição completa de chunks por elemento
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkChunks() {
  console.log('🔍 Verificando chunks por elemento...\n')

  // Buscar todos os chunks
  const { data: chunks, error } = await supabase
    .from('knowledge_chunks')
    .select('id, metadata')

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  console.log(`📊 Total de chunks no banco: ${chunks?.length || 0}\n`)

  // Contar por elemento
  const distribuicao: Record<string, number> = {}
  
  chunks?.forEach(chunk => {
    const elemento = chunk.metadata?.elemento || 'N/A'
    distribuicao[elemento] = (distribuicao[elemento] || 0) + 1
  })

  // Ordenar e exibir
  const sorted = Object.entries(distribuicao)
    .sort(([, a], [, b]) => b - a)

  console.log('📈 DISTRIBUIÇÃO POR ELEMENTO:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  sorted.forEach(([elemento, count]) => {
    const bar = '█'.repeat(Math.floor(count / 2))
    console.log(`${elemento.padEnd(15)} ${String(count).padStart(3)} chunks ${bar}`)
  })

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Verificar documentos
  const { data: docs } = await supabase
    .from('avatar_knowledge_base')
    .select('id, title')

  console.log('📄 DOCUMENTOS NA BASE:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  for (const doc of docs || []) {
    const { data: docChunks } = await supabase
      .from('knowledge_chunks')
      .select('id, metadata')
      .eq('knowledge_base_id', doc.id)

    const elemento = docChunks?.[0]?.metadata?.elemento || 'N/A'
    console.log(`${doc.title.padEnd(40)} ${String(docChunks?.length || 0).padStart(3)} chunks (${elemento})`)
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

checkChunks().catch(console.error)
