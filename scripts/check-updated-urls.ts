import { createAdminClient } from '../lib/supabase/server.js'

async function checkUpdatedUrls() {
  const supabase = await createAdminClient()
  
  // Pegar alguns exercícios para verificar URLs
  const { data: exercises } = await supabase
    .from('exercises')
    .select('title, slug, url')
    .limit(5)
  
  console.log('🔗 URLs atualizadas:\n')
  
  exercises?.forEach(ex => {
    console.log(`${ex.title}`)
    console.log(`Slug: ${ex.slug}`)
    console.log(`URL:  ${ex.url}`)
    console.log()
  })
}

checkUpdatedUrls()
