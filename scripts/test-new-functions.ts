import { 
  searchIntroductoryExercises, 
  isGenericExerciseRequest,
  extractSymptomsFromMessage 
} from '../lib/helpers/exercise-recommendations.js'

async function testNewFunctions() {
  console.log('🧪 Testando novas funções...\n')
  
  // Testar detecção de pedido genérico
  const testMessages = [
    'me passa um video do seu curso?',
    'quero praticar qi gong',
    'tem alguma aula para iniciantes?',
    'estou com ansiedade',
    'olá mestre'
  ]
  
  console.log('1️⃣ Testando isGenericExerciseRequest:')
  for (const msg of testMessages) {
    const isGeneric = isGenericExerciseRequest(msg)
    console.log(`   "${msg}"`)
    console.log(`   → ${isGeneric ? '✅ GENÉRICO' : '❌ NÃO GENÉRICO'}\n`)
  }
  
  // Testar extração de sintomas com novo mapeamento
  console.log('\n2️⃣ Testando extractSymptomsFromMessage:')
  for (const msg of testMessages) {
    const symptoms = extractSymptomsFromMessage(msg)
    console.log(`   "${msg}"`)
    console.log(`   → Sintomas: ${symptoms.join(', ') || 'nenhum'}\n`)
  }
  
  // Testar busca de exercícios introdutórios
  console.log('\n3️⃣ Testando searchIntroductoryExercises:')
  const introExercises = await searchIntroductoryExercises({ matchCount: 3 })
  console.log(`   Encontrados: ${introExercises.length} exercícios\n`)
  
  introExercises.forEach((ex, i) => {
    console.log(`   ${i + 1}. ${ex.title}`)
    console.log(`      Element: ${ex.element || 'null'}`)
    console.log(`      Level: ${ex.level || 'null'}`)
    console.log(`      URL: ${ex.url}\n`)
  })
}

testNewFunctions()
