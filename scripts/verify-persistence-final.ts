import { createAdminClient } from '../lib/supabase/server'
import { syncExercises } from '../lib/memberkit/sync'

async function finalVerification() {
    const supabase = createAdminClient()
    const slug = 'cerimonia-do-cha-o-sabor-do-zen'

    console.log('--- TESTE DE PERSISTÊNCIA ---')

    // 1. Set to false
    await supabase
        .from('hub_courses')
        .update({ is_published: false })
        .eq('memberkit_course_slug', slug)

    console.log('1. Status forçado para FALSE')

    // 2. Run sync
    console.log('2. Iniciando Sincronização...')
    await syncExercises({})
    console.log('Sync finalizado.')

    // 3. Check status
    const { data } = await supabase
        .from('hub_courses')
        .select('is_published')
        .eq('memberkit_course_slug', slug)
        .single()

    console.log('3. Status após sync:', data?.is_published)

    if (data?.is_published === false) {
        console.log('✅ SUCESSO: O status desativado foi preservado!')
    } else {
        console.log('❌ FALHA: O status foi resetado para ativo.')
    }
}

finalVerification()
