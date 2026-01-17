import { createAdminClient } from '../lib/supabase/server'

async function debugCourses() {
    const supabase = createAdminClient()

    console.log('\n🔍 LISTANDO CURSOS NO BANCO DE DADOS\n')

    const { data: courses, error } = await supabase
        .from('hub_courses')
        .select('memberkit_course_id, memberkit_course_slug, course_name, is_published')
        .order('course_name')

    if (error) {
        console.error('❌ Erro:', error)
        return
    }

    console.log(JSON.stringify(courses, null, 2))
}

debugCourses()
