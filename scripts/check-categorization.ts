/**
 * Script para verificar categorização dos cursos recém-semantizados
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const TARGET_COURSES = [
  'saude-e-longevidade-com-qi-gong',
  'dose-semanal-de-qi-gong',
  'shi-liao-dietoterapia',
  'workshop-5-elementos-da-mediciona-tradicional-chinesa'
]

async function checkCategorization() {
  console.log('\n📋 VERIFICAÇÃO DE CATEGORIZAÇÃO\n')
  console.log('='.repeat(70))

  for (const courseSlug of TARGET_COURSES) {
    const { data: exercises } = await supabase
      .from('hub_exercises')
      .select('id, title, duration_minutes, level, element, embedding')
      .eq('memberkit_course_slug', courseSlug)
      .eq('enabled', true)
      .order('memberkit_lesson_id')

    if (!exercises) continue

    const total = exercises.length
    const categorized = exercises.filter(e => 
      e.duration_minutes !== null && 
      e.level !== null && 
      e.element !== null
    ).length
    const withEmbedding = exercises.filter(e => e.embedding !== null).length
    
    const catPercentage = ((categorized / total) * 100).toFixed(1)
    const embPercentage = ((withEmbedding / total) * 100).toFixed(1)
    
    const catStatus = categorized === total ? '✅' : '⚠️ '
    const embStatus = withEmbedding === total ? '✅' : '⚠️ '

    console.log(`\n${courseSlug}`)
    console.log(`   ${catStatus} Categorizados: ${categorized}/${total} (${catPercentage}%)`)
    console.log(`   ${embStatus} Semantizados: ${withEmbedding}/${total} (${embPercentage}%)`)

    // Mostrar exercícios NÃO categorizados
    const uncategorized = exercises.filter(e => 
      e.duration_minutes === null || 
      e.level === null || 
      e.element === null
    )

    if (uncategorized.length > 0) {
      console.log(`\n   🔴 ${uncategorized.length} exercícios SEM categorização completa:`)
      uncategorized.slice(0, 10).forEach(ex => {
        const hasDuration = ex.duration_minutes !== null ? '✓' : '✗'
        const hasLevel = ex.level !== null ? '✓' : '✗'
        const hasElement = ex.element !== null ? '✓' : '✗'
        console.log(`      [${hasDuration}${hasLevel}${hasElement}] ${ex.title.substring(0, 55)}`)
      })
      if (uncategorized.length > 10) {
        console.log(`      ... e mais ${uncategorized.length - 10}`)
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n💡 Legenda:')
  console.log('   [✓✓✓] = tem duração, nível e elemento')
  console.log('   [✗✗✗] = falta duração, nível e elemento')
  console.log('\n')
}

checkCategorization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
