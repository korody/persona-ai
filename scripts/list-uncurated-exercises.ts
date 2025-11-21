/**
 * Lista exercícios sem metadata para curadoria
 */

import { createAdminClient } from '../lib/supabase/server'

async function listUncuratedExercises() {
  const supabase = await createAdminClient()

  console.log('\n📚 EXERCÍCIOS SEM METADATA (primeiros 50)\n')
  console.log('━'.repeat(70))

  const { data: exercises } = await supabase
    .from('exercises')
    .select('title, memberkit_lesson_id, memberkit_course_slug, url')
    .is('element', null)
    .eq('is_active', true)
    .order('title')
    .limit(50)

  if (!exercises) {
    console.log('Nenhum exercício encontrado')
    return
  }

  // Agrupar por curso
  const byCourse: Record<string, typeof exercises> = {}
  
  exercises.forEach(ex => {
    const course = ex.memberkit_course_slug || 'outros'
    if (!byCourse[course]) {
      byCourse[course] = []
    }
    byCourse[course].push(ex)
  })

  // Mostrar agrupado
  Object.entries(byCourse).forEach(([course, exs]) => {
    console.log(`\n📁 ${course.toUpperCase()} (${exs.length} exercícios)`)
    console.log('─'.repeat(70))
    
    exs.forEach((ex, i) => {
      console.log(`\n${(i+1).toString().padStart(2, '0')}. ${ex.title}`)
      console.log(`    ID: ${ex.memberkit_lesson_id}`)
      console.log(`    URL: ${ex.url}`)
    })
  })

  console.log('\n━'.repeat(70))
  console.log(`\n📊 Total: ${exercises.length} exercícios sem metadata`)
}

listUncuratedExercises().catch(console.error)
