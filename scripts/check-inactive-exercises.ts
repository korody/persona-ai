import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkInactiveExercises() {
  console.log('🔍 Verificando exercícios inativos...\n')

  // Total counts
  const { count: total } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact', head: true })

  const { count: inactive } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', false)

  const { count: active } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: nulls } = await supabase
    .from('hub_exercises')
    .select('*', { count: 'exact', head: true })
    .is('is_active', null)

  console.log('📊 Contagens:')
  console.log(`   Total: ${total}`)
  console.log(`   Ativos (is_active=true): ${active}`)
  console.log(`   Inativos (is_active=false): ${inactive}`)
  console.log(`   Nulos (is_active=null): ${nulls}`)

  // Get some inactive examples
  if (inactive && inactive > 0) {
    console.log('\n📋 Exemplos de exercícios inativos:\n')
    const { data: examples } = await supabase
      .from('hub_exercises')
      .select('memberkit_lesson_id, title, memberkit_course_slug, is_active')
      .eq('is_active', false)
      .limit(10)

    examples?.forEach((ex, i) => {
      console.log(`   ${i + 1}. ${ex.title}`)
      console.log(`      lesson_id: ${ex.memberkit_lesson_id}`)
      console.log(`      course: ${ex.memberkit_course_slug}`)
      console.log(`      is_active: ${ex.is_active}`)
      console.log()
    })
  }
}

checkInactiveExercises()
