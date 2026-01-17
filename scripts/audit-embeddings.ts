import { createAdminClient } from '../lib/supabase/server'

async function audit() {
    const supabase = createAdminClient()

    const { count: total } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true })
    const { count: active } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: withElement } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true }).not('element', 'is', null)
    const { count: withDuration } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true }).not('duration_minutes', 'is', null)
    const { count: withEmbedding } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true }).not('embedding', 'is', null)
    const { count: withBoth } = await supabase.from('hub_exercises').select('*', { count: 'exact', head: true }).not('element', 'is', null).not('embedding', 'is', null)

    console.log({
        total,
        active,
        withElement,
        withDuration,
        withEmbedding,
        withBoth
    })
}

audit()
