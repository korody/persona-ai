/**
 * Verifica estatísticas de embeddings dos EXERCÍCIOS
 */

import { createAdminClient } from '../lib/supabase/server'

async function checkExerciseEmbeddings() {
  const supabase = await createAdminClient()

  console.log('\n🔍 VERIFICANDO EMBEDDINGS DOS EXERCÍCIOS\n')
  console.log('━'.repeat(70))

  // Total com embeddings
  const { data: withEmbeddings, error: err1 } = await supabase
    .from('exercises')
    .select('id, title, element')
    .not('embedding', 'is', null)
    .eq('is_active', true)

  console.log(`\n✅ Exercícios com embeddings: ${withEmbeddings?.length || 0}`)

  // Por elemento
  const elements = ['ÁGUA', 'FOGO', 'MADEIRA', 'METAL', 'TERRA']
  
  console.log('\n📊 Por elemento:')
  for (const element of elements) {
    const { data } = await supabase
      .from('exercises')
      .select('id, title')
      .not('embedding', 'is', null)
      .eq('element', element)
      .eq('is_active', true)

    console.log(`   ${element}: ${data?.length || 0} exercícios`)
  }

  // Sem embeddings mas com metadata
  const { data: withoutEmbeddings } = await supabase
    .from('exercises')
    .select('id, title, element')
    .is('embedding', null)
    .not('element', 'is', null)
    .eq('is_active', true)

  console.log(`\n⚠️  Com metadata mas SEM embedding: ${withoutEmbeddings?.length || 0}`)
  
  if (withoutEmbeddings && withoutEmbeddings.length > 0) {
    console.log('\nPrimeiros 10:')
    console.table(withoutEmbeddings.slice(0, 10).map(e => ({
      title: e.title.substring(0, 50),
      element: e.element
    })))
    
    console.log('\n💡 Rode: pnpm generate-embeddings')
  }

  console.log('\n━'.repeat(70))
}

checkExerciseEmbeddings().catch(console.error)
