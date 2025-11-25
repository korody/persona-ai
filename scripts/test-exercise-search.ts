/**
 * Teste de Integração: Busca de Exercícios
 * 
 * Para testar localmente:
 * tsx --env-file=.env.local scripts/test-exercise-search.ts
 */

import { createAdminClient } from '../lib/supabase/server'
import { 
  searchExercisesBySymptoms,
  searchExercisesByElement,
  extractSymptomsFromMessage,
  formatExercisesContext
} from '../lib/helpers/exercise-recommendations'

async function testExerciseSearch() {
  console.log('\n🧪 TESTE DE BUSCA DE EXERCÍCIOS\n')
  console.log('=' .repeat(60))
  
  const supabase = await createAdminClient()
  
  // 1. Verificar total de exercícios
  console.log('\n📊 1. Verificando total de exercícios...')
  const { data: allExercises, count } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
  
  console.log(`   ✅ Total: ${count} exercícios ativos`)
  
  // 2. Testar extração de sintomas
  console.log('\n🔍 2. Testando extração de sintomas...')
  
  const testMessages = [
    'Estou com muita ansiedade',
    'Tenho dor na lombar há semanas',
    'Dificuldade para dormir',
    'Quero praticar Qi Gong'
  ]
  
  for (const message of testMessages) {
    const symptoms = extractSymptomsFromMessage(message)
    console.log(`   📝 "${message}"`)
    console.log(`      → Sintomas: ${symptoms.length > 0 ? symptoms.join(', ') : 'nenhum'}`)
  }
  
  // 3. Testar busca por sintomas
  console.log('\n🎯 3. Testando busca por sintomas...')
  
  const symptomsToTest = ['ansiedade', 'dor_lombar', 'insônia']
  
  for (const symptom of symptomsToTest) {
    const exercises = await searchExercisesBySymptoms([symptom], { matchCount: 3 })
    console.log(`   🧘 Sintoma: ${symptom}`)
    console.log(`      → Exercícios encontrados: ${exercises.length}`)
    
    if (exercises.length > 0) {
      exercises.forEach((ex, i) => {
        console.log(`      ${i + 1}. ${ex.title} (${ex.element || 'sem elemento'})`)
      })
    }
  }
  
  // 4. Testar busca por elemento
  console.log('\n🌳 4. Testando busca por elemento...')
  
  const elementsToTest = ['ÁGUA', 'FOGO', 'MADEIRA']
  
  for (const element of elementsToTest) {
    const exercises = await searchExercisesByElement(element, { matchCount: 3 })
    console.log(`   🌊 Elemento: ${element}`)
    console.log(`      → Exercícios encontrados: ${exercises.length}`)
    
    if (exercises.length > 0) {
      exercises.forEach((ex, i) => {
        console.log(`      ${i + 1}. ${ex.title} (${ex.level || 'sem nível'})`)
      })
    }
  }
  
  // 5. Testar formatação de contexto
  console.log('\n📝 5. Testando formatação de contexto...')
  
  const sampleExercises = await searchExercisesByElement('ÁGUA', { matchCount: 2 })
  const formattedContext = formatExercisesContext(sampleExercises)
  
  console.log('\n   Contexto gerado:')
  console.log('   ' + '-'.repeat(58))
  console.log(formattedContext.split('\n').map(line => '   ' + line).join('\n'))
  console.log('   ' + '-'.repeat(58))
  
  // 6. Verificar distribuição por elemento
  console.log('\n📊 6. Distribuição de exercícios por elemento...')
  
  const elements = ['ÁGUA', 'FOGO', 'MADEIRA', 'METAL', 'TERRA']
  
  for (const element of elements) {
    const { count } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('element', element)
    
    console.log(`   ${element}: ${count || 0} exercícios`)
  }
  
  // 7. Verificar distribuição por nível
  console.log('\n📈 7. Distribuição de exercícios por nível...')
  
  const levels = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO']
  
  for (const level of levels) {
    const { count } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('level', level)
    
    console.log(`   ${level}: ${count || 0} exercícios`)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ TESTE CONCLUÍDO COM SUCESSO!\n')
}

// Executar teste
testExerciseSearch().catch(console.error)
