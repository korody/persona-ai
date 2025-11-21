import { createAdminClient } from '../lib/supabase/server.js'

async function listAllExercises() {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('exercises')
    .select('slug, title, memberkit_course_id')
    .order('title')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Total: ${data.length} exercícios\n`)
  
  // Agrupar por curso
  const byCourse: Record<string, any[]> = {}
  
  for (const ex of data) {
    if (!byCourse[ex.memberkit_course_id]) {
      byCourse[ex.memberkit_course_id] = []
    }
    byCourse[ex.memberkit_course_id].push(ex)
  }
  
  console.log('Exercícios por curso:')
  for (const courseId in byCourse) {
    console.log(`\nCurso ${courseId}: ${byCourse[courseId].length} exercícios`)
    byCourse[courseId].forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.title}`)
      console.log(`     slug: "${ex.slug}"`)
    })
  }
}

listAllExercises()
