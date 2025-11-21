import { createAdminClient } from '../lib/supabase/server.js'

async function listBaDuanSlugs() {
  const supabase = await createAdminClient()
  
  const { data } = await supabase
    .from('exercises')
    .select('memberkit_lesson_id, slug, title')
    .order('title')
  
  if (!data) return
  
  console.log('\n📋 SLUGS DISPONÍVEIS:\n')
  
  for (const ex of data) {
    // Filtrar apenas Ba Duan Jin e mantras conhecidos
    if (
      ex.title.includes('Sustentar') ||
      ex.title.includes('Puxar') ||
      ex.title.includes('Balançar') ||
      ex.title.includes('Fechar') ||
      ex.title.includes('Suspender') ||
      ex.title.includes('Mantra') ||
      ex.title.includes('Reverências') ||
      ex.title.includes('Workshop')
    ) {
      console.log(`ID: ${ex.memberkit_lesson_id}`)
      console.log(`Slug: ${ex.slug}`)
      console.log(`Título: ${ex.title}\n`)
    }
  }
}

listBaDuanSlugs()
