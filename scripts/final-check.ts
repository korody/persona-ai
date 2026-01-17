import { createAdminClient } from '../lib/supabase/server'

async function finalCheck() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('hub_courses')
        .select('course_name, is_published')
        .eq('memberkit_course_slug', 'arte-da-cura-metodo-ye-xin')
        .single()

    if (error) {
        console.error('Erro:', error)
    } else {
        console.log('RESULTADO_FINAL:', JSON.stringify(data))
    }
}

finalCheck()
