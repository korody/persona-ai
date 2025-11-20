/**
 * Verifica chunks do elemento TERRA
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTerraChunks() {
  console.log('🔍 Verificando chunks do elemento TERRA...\n')

  const { data: chunks } = await supabase
    .from('knowledge_chunks')
    .select('id, content, metadata')
    .limit(100)

  if (!chunks) {
    console.log('❌ Nenhum chunk encontrado')
    return
  }

  // Filtrar chunks do elemento TERRA
  const terraChunks = chunks.filter((c: any) => 
    c.metadata?.elemento === 'TERRA' || 
    c.metadata?.title?.includes('TERRA') ||
    c.content?.includes('TERRA') ||
    c.content?.includes('Baço')
  )

  console.log(`📊 Total de chunks: ${chunks.length}`)
  console.log(`🌍 Chunks relacionados a TERRA/Baço: ${terraChunks.length}\n`)

  // Mostrar distribuição por elemento
  const porElemento: Record<string, number> = {}
  chunks.forEach((c: any) => {
    const elem = c.metadata?.elemento || 'N/A'
    porElemento[elem] = (porElemento[elem] || 0) + 1
  })

  console.log('📊 Distribuição de chunks por elemento:\n')
  Object.entries(porElemento)
    .sort(([, a], [, b]) => b - a)
    .forEach(([elem, count]) => {
      console.log(`   ${elem}: ${count}`)
    })

  console.log('\n🌍 Chunks de TERRA:\n')
  terraChunks.slice(0, 5).forEach((c: any, i) => {
    console.log(`${i + 1}. Elemento: ${c.metadata?.elemento || 'N/A'}`)
    console.log(`   Title: ${c.metadata?.title || 'N/A'}`)
    console.log(`   Preview: ${c.content.substring(0, 100)}...\n`)
  })

  // Verificar se há chunks com BAÇO no metadata
  const bacoChunks = chunks.filter((c: any) => 
    c.metadata?.elemento === 'BAÇO' ||
    c.metadata?.elemento === 'BACO'
  )

  console.log(`\n🔍 Chunks com elemento="BAÇO" nos metadados: ${bacoChunks.length}`)
}

checkTerraChunks().catch(console.error)
