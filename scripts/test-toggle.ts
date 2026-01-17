import { createAdminClient } from '../lib/supabase/server'

async function testToggle() {
    const supabase = createAdminClient()
    const slug = 'cerimonia-do-cha-o-sabor-do-zen'
    const enabled = false

    console.log(`\n🧪 TESTANDO TOGGLE PARA: ${slug} -> ${enabled}\n`)

    // 1. Check current state
    const { data: initial } = await supabase
        .from('hub_courses')
        .select('is_published')
        .eq('memberkit_course_slug', slug)
        .single()

    console.log('Estado inicial:', initial?.is_published)

    // 2. Perform update
    const { data: updated, error } = await supabase
        .from('hub_courses')
        .update({ is_published: enabled })
        .eq('memberkit_course_slug', slug)
        .select('is_published')
        .single()

    if (error) {
        console.error('❌ Erro no update:', error)
        return
    }

    console.log('Estado após update:', updated?.is_published)

    // 3. Rollback (toggle back to true)
    await supabase
        .from('hub_courses')
        .update({ is_published: true })
        .eq('memberkit_course_slug', slug)

    console.log('\n✅ Teste concluído (estado restaurado para true)')
}

testToggle()
