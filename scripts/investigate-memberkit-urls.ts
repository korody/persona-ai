import { fetchCourses, fetchCourseDetails } from '../lib/memberkit/api.js'

async function investigateMemberkitUrls() {
  console.log('🔍 Investigando estrutura de URLs do Memberkit...\n')
  
  const courses = await fetchCourses()
  
  if (!courses || courses.length === 0) {
    console.log('Nenhum curso encontrado')
    return
  }
  
  // Pegar primeiro curso com detalhes
  const firstCourse = courses[0]
  console.log(`📚 Curso ID: ${firstCourse.id}`)
  console.log(`   Nome: ${firstCourse.name}\n`)
  
  const courseDetails = await fetchCourseDetails(firstCourse.id)
  
  if (!courseDetails) {
    console.log('Detalhes não encontrados')
    return
  }
  
  console.log('📋 Campos do Curso:')
  console.log(JSON.stringify(courseDetails, null, 2).substring(0, 500))
  console.log('\n...\n')
  
  // Pegar primeira section com lessons
  const sectionWithLessons = courseDetails.sections?.find(s => s.lessons && s.lessons.length > 0)
  
  if (sectionWithLessons && sectionWithLessons.lessons) {
    const lesson = sectionWithLessons.lessons[0]
    
    console.log('🎯 Exemplo de Lesson:')
    console.log(`   ID: ${lesson.id}`)
    console.log(`   Slug: ${lesson.slug}`)
    console.log(`   Title: ${lesson.title}`)
    console.log('\n📋 Todos os campos da lesson:')
    console.log(JSON.stringify(lesson, null, 2))
    
    // Testar possíveis formatos de URL
    console.log('\n🧪 Testando possíveis formatos de URL:')
    console.log(`   1. /lessons/${lesson.slug}`)
    console.log(`   2. /courses/${firstCourse.id}/lessons/${lesson.id}`)
    console.log(`   3. /courses/${firstCourse.id}/lessons/${lesson.slug}`)
    console.log(`   4. /course/${firstCourse.id}/lesson/${lesson.id}`)
  }
  
  // Verificar se há algum campo de URL no curso ou lesson
  console.log('\n🔗 Procurando campos de URL...')
  const checkForUrlFields = (obj: any, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        console.log(`   ${prefix}${key}: ${value}`)
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkForUrlFields(value, `${prefix}${key}.`)
      }
    }
  }
  
  checkForUrlFields({ course: courseDetails })
}

investigateMemberkitUrls()
