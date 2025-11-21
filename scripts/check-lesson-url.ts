import { fetchCourseDetails } from '../lib/memberkit/api.js'

async function checkLessonUrl() {
  console.log('🔍 Verificando URLs retornadas pela API...\n')
  
  // Pegar um curso com a lição que sabemos que existe
  const courseId = '185202' // Saúde e Longevidade com Qi Gong
  
  const course = await fetchCourseDetails(courseId)
  
  if (!course) {
    console.error('Curso não encontrado')
    return
  }
  
  console.log(`📚 Curso: ${course.title}\n`)
  
  // Pegar primeira seção com aulas
  const section = course.sections.find(s => s.lessons && s.lessons.length > 0)
  
  if (section && section.lessons) {
    console.log(`📂 Seção: ${section.title}\n`)
    
    const firstLesson = section.lessons[0]
    console.log('🎯 Primeira lesson:')
    console.log('   ID:', firstLesson.id)
    console.log('   Title:', firstLesson.title)
    console.log('   Slug:', firstLesson.slug)
    console.log('   URL field:', firstLesson.url || 'NULL')
    console.log('\n📋 Todos os campos disponíveis:')
    console.log(JSON.stringify(firstLesson, null, 2))
  }
}

checkLessonUrl()
