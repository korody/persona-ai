import { createAdminClient } from '../lib/supabase/server.js'

async function addCourseSlugColumn() {
  const supabase = await createAdminClient()
  
  console.log('📝 Adicionando coluna memberkit_course_slug...\n')
  
  // Como não temos RPC direto, vamos usar uma abordagem alternativa
  // Primeiro verificar se a coluna já existe
  const { data: existing } = await supabase
    .from('exercises')
    .select('memberkit_course_slug')
    .limit(1)
  
  if (existing) {
    console.log('✅ Coluna memberkit_course_slug já existe!')
  } else {
    console.log('⚠️  Coluna não existe. Você precisa executar esta SQL no Supabase Dashboard:')
    console.log('\nALTER TABLE exercises ADD COLUMN IF NOT EXISTS memberkit_course_slug TEXT;\n')
  }
}

addCourseSlugColumn()
