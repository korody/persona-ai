import { createAdminClient } from '../lib/supabase/server.js'

async function showMapping() {
  const supabase = await createAdminClient()
  
  const { data } = await supabase
    .from('hub_exercises')
    .select('memberkit_lesson_id, slug, title')
    .in('slug', [
      'sustentar-o-ceu-com-as-maos-para-regular-o-triplo-aquecedor-shuang-shou-tuo-tian-li-san-jiao',
      'respiracao-abdominal-e-diafragmatico-para-relaxar-o-corpo-acalmar-a-mente-dormir-melhor',
      'mantra-1-xu',
      '1-a-sequencia-completa-com-narracao'
    ])
  
  console.log('\n Mapeamento Slug → Lesson ID:\n')
  console.table(data)
}

showMapping()
