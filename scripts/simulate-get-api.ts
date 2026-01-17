import { createAdminClient } from '../lib/supabase/server'

async function simulateGetApi() {
    const supabase = createAdminClient()
    const slugTarget = 'arte-da-cura-metodo-ye-xin'

    console.log(`\n🧪 SIMULANDO GET API PARA: ${slugTarget}\n`)

    // Logic from app/api/admin/memberkit/courses/route.ts
    const { data: courses, error: coursesError } = await supabase
        .from('hub_courses')
        .select('*')
        .eq('memberkit_course_slug', slugTarget)

    if (coursesError) {
        console.error('Erro ao buscar cursos:', coursesError)
        return
    }

    console.log('Cursos encontrados:', courses?.length)

    if (courses && courses.length > 0) {
        const course = courses[0]
        console.log('Dados do curso no DB:')
        console.log(JSON.stringify(course, null, 2))

        // Mapping logic
        const mapped = {
            memberkit_course_id: course.memberkit_course_id,
            slug: course.memberkit_course_slug,
            name: course.course_name,
            enabled: course.is_published
        }

        console.log('\nMapeado para o Frontend:')
        console.log(JSON.stringify(mapped, null, 2))
    }
}

simulateGetApi()
