import { createAdminClient } from '../lib/supabase/server.js'

async function checkIntroExercises() {
  const supabase = await createAdminClient()
  
  console.log('🔍 Buscando exercícios introdutórios...\n')
  
  // Buscar por título
  const { data: byTitle } = await supabase
    .from('exercises')
    .select('id, title, level, indications')
    .eq('is_active', true)
    .or('title.ilike.%introdução%,title.ilike.%sequência completa%')
    .limit(5)
  
  console.log('📚 Por título (introdução/sequência):')
  byTitle?.forEach(ex => {
    console.log(`  - ${ex.title}`)
    console.log(`    Level: ${ex.level || 'null'}`)
    console.log(`    Indications: ${ex.indications?.join(', ') || 'null'}\n`)
  })
  
  // Buscar por indication prática_diária
  const { data: byIndication } = await supabase
    .from('exercises')
    .select('id, title, level, indications')
    .eq('is_active', true)
    .contains('indications', ['prática_diária'])
    .limit(5)
  
  console.log('\n🎯 Por indicação (prática_diária):')
  if (byIndication && byIndication.length > 0) {
    byIndication.forEach(ex => {
      console.log(`  - ${ex.title}`)
      console.log(`    Level: ${ex.level}`)
      console.log(`    Indications: ${ex.indications.join(', ')}\n`)
    })
  } else {
    console.log('  Nenhum encontrado')
  }
  
  // Buscar Ba Duan Jin completo
  const { data: baDuanJin } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .ilike('title', '%sequência completa%')
    .limit(3)
  
  console.log('\n🧘 Ba Duan Jin - Sequências Completas:')
  baDuanJin?.forEach(ex => {
    console.log(`  - ${ex.title}`)
    console.log(`    Level: ${ex.level || 'null'}`)
    console.log(`    Element: ${ex.element || 'null'}`)
    console.log(`    URL: ${ex.url}\n`)
  })
}

checkIntroExercises()
