import { createAdminClient } from '../lib/supabase/server'

async function verifyPersistence() {
    const supabase = createAdminClient()
    const slug = 'cerimonia-do-cha-o-sabor-do-zen'

    console.log(`\n🧪 VERIFICANDO PERSISTÊNCIA PARA: ${slug}\n`)

    // 1. Force is_published = true
    await supabase
        .from('hub_courses')
        .update({ is_published: true })
        .eq('memberkit_course_slug', slug)

    console.log('1. Forçado para TRUE')

    // 2. Toggle to false
    await supabase
        .from('hub_courses')
        .update({ is_published: false })
        .eq('memberkit_course_slug', slug)

    console.log('2. Toggled para FALSE')

    // 3. Check DB immediately
    const { data: dbState } = await supabase
        .from('hub_courses')
        .select('is_published')
        .eq('memberkit_course_slug', slug)
        .single()

    console.log('3. Estado no DB (select direto):', dbState?.is_published)

    // 4. Simulate GET API logic
    const { data: courses } = await supabase
        .from('hub_courses')
        .select('*')
        .eq('memberkit_course_slug', slug)
        .single()

    console.log('4. Estado na lógica da API (enabled):', courses?.is_published)

    // Restore to true
    await supabase
        .from('hub_courses')
        .update({ is_published: true })
        .eq('memberkit_course_slug', slug)

    console.log('\n✅ Teste finalizado')
}

verifyPersistence()
