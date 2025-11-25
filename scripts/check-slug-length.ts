import { createAdminClient } from '../lib/supabase/server.js'

async function checkSlug() {
  const supabase = await createAdminClient()
  
  const { data } = await supabase
    .from('hub_exercises')
    .select('title, slug, url')
    .ilike('title', '%segurar%ponta%')
    .limit(1)
  
  if (data && data.length > 0) {
    console.log('📋 Exercício encontrado:')
    console.log(JSON.stringify(data[0], null, 2))
    console.log('\n📏 Tamanho do slug:', data[0].slug.length, 'caracteres')
    console.log('📏 URL completa:', data[0].url.length, 'caracteres')
  }
}

checkSlug()
