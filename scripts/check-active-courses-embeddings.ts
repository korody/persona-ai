/**
 * Script para verificar status de semantização dos cursos ativos
 * 
 * Verifica todos os cursos que estão ativos (enabled=true) e
 * mostra quais exercícios ainda não foram semantizados.
 */

import { createAdminClient } from '@/lib/supabase/server'

async function checkActiveCourses() {
  console.log('🔍 VERIFICAÇÃO DE CURSOS ATIVOS E SEMANTIZAÇÃO\n')
  
  const supabase = await createAdminClient()
  
  // 1. Buscar todos os exercícios
  const { data: exercises, error } = await supabase
    .from('hub_exercises')
    .select('id, title, memberkit_course_slug, enabled, embedding, level, element, duration_minutes')
    .order('memberkit_course_slug')
  
  if (error || !exercises) {
    console.error('❌ Erro ao buscar exercícios:', error)
    return
  }
  
  console.log(`📊 Total de exercícios no banco: ${exercises.length}\n`)
  
  // 2. Agrupar por curso
  const courseMap = new Map<string, {
    total: number
    enabled: number
    disabled: number
    withEmbedding: number
    withoutEmbedding: number
    categorized: number
    exercises: typeof exercises
  }>()
  
  exercises.forEach(ex => {
    const slug = ex.memberkit_course_slug || 'sem-curso'
    if (!courseMap.has(slug)) {
      courseMap.set(slug, {
        total: 0,
        enabled: 0,
        disabled: 0,
        withEmbedding: 0,
        withoutEmbedding: 0,
        categorized: 0,
        exercises: []
      })
    }
    
    const stats = courseMap.get(slug)!
    stats.total++
    stats.exercises.push(ex)
    
    if (ex.enabled !== false) {
      stats.enabled++
    } else {
      stats.disabled++
    }
    
    if (ex.embedding) {
      stats.withEmbedding++
    } else {
      stats.withoutEmbedding++
    }
    
    if (ex.duration_minutes !== null) {
      stats.categorized++
    }
  })
  
  // 3. Filtrar apenas cursos ATIVOS (todos exercícios enabled)
  const activeCourses = Array.from(courseMap.entries())
    .filter(([_, stats]) => stats.enabled === stats.total && stats.enabled > 0)
    .sort((a, b) => b[1].total - a[1].total)
  
  const inactiveCourses = Array.from(courseMap.entries())
    .filter(([_, stats]) => stats.enabled === 0)
    .sort((a, b) => b[1].total - a[1].total)
  
  const partialCourses = Array.from(courseMap.entries())
    .filter(([_, stats]) => stats.enabled > 0 && stats.enabled < stats.total)
    .sort((a, b) => b[1].total - a[1].total)
  
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log('📊 RESUMO GERAL\n')
  console.log(`✅ Cursos 100% ATIVOS: ${activeCourses.length}`)
  console.log(`⚠️  Cursos PARCIALMENTE ativos: ${partialCourses.length}`)
  console.log(`🚫 Cursos 100% INATIVOS: ${inactiveCourses.length}`)
  console.log('\n═══════════════════════════════════════════════════════════\n')
  
  // 4. Mostrar detalhes dos CURSOS ATIVOS
  if (activeCourses.length > 0) {
    console.log('✅ CURSOS ATIVOS (todos exercícios enabled=true)\n')
    
    let totalActiveExercises = 0
    let totalSemantized = 0
    let totalPendingEmbeddings = 0
    
    activeCourses.forEach(([slug, stats]) => {
      totalActiveExercises += stats.total
      totalSemantized += stats.withEmbedding
      totalPendingEmbeddings += stats.withoutEmbedding
      
      const percentage = (stats.withEmbedding / stats.total * 100).toFixed(1)
      const status = stats.withEmbedding === stats.total ? '✅' : '⚠️ '
      
      console.log(`${status} ${slug}`)
      console.log(`   📝 Total: ${stats.total} | Categorizados: ${stats.categorized} | Semantizados: ${stats.withEmbedding}/${stats.total} (${percentage}%)`)
      
      // Listar exercícios NÃO semantizados
      if (stats.withoutEmbedding > 0) {
        console.log(`   🔴 FALTAM ${stats.withoutEmbedding} EXERCÍCIOS PARA SEMANTIZAR:`)
        stats.exercises
          .filter(ex => !ex.embedding)
          .slice(0, 5) // Mostrar até 5
          .forEach(ex => {
            const hasMetadata = ex.duration_minutes !== null ? '✓' : '✗'
            console.log(`      - [${hasMetadata}] ${ex.title.substring(0, 60)}`)
          })
        if (stats.withoutEmbedding > 5) {
          console.log(`      ... e mais ${stats.withoutEmbedding - 5}`)
        }
      }
      console.log('')
    })
    
    console.log('───────────────────────────────────────────────────────────')
    console.log(`📊 TOTAL EXERCÍCIOS ATIVOS: ${totalActiveExercises}`)
    console.log(`✅ Semantizados: ${totalSemantized} (${(totalSemantized/totalActiveExercises*100).toFixed(1)}%)`)
    console.log(`🔴 PENDENTES: ${totalPendingEmbeddings} (${(totalPendingEmbeddings/totalActiveExercises*100).toFixed(1)}%)`)
    console.log('───────────────────────────────────────────────────────────\n')
  }
  
  // 5. Mostrar cursos parcialmente ativos
  if (partialCourses.length > 0) {
    console.log('\n⚠️  CURSOS PARCIALMENTE ATIVOS (alguns exercícios desativados)\n')
    partialCourses.forEach(([slug, stats]) => {
      console.log(`⚠️  ${slug}`)
      console.log(`   Ativos: ${stats.enabled}/${stats.total} | Semantizados: ${stats.withEmbedding}/${stats.enabled}`)
    })
    console.log('')
  }
  
  // 6. Resumo de cursos inativos
  if (inactiveCourses.length > 0) {
    console.log('\n🚫 CURSOS 100% INATIVOS\n')
    const totalInactive = inactiveCourses.reduce((sum, [_, stats]) => sum + stats.total, 0)
    console.log(`Total: ${inactiveCourses.length} cursos com ${totalInactive} exercícios desativados`)
    console.log('')
  }
  
  // 7. Recomendações
  console.log('\n💡 RECOMENDAÇÕES\n')
  
  const needsEmbedding = activeCourses.filter(([_, stats]) => stats.withoutEmbedding > 0)
  
  if (needsEmbedding.length === 0) {
    console.log('✅ Todos os cursos ativos estão 100% semantizados!')
    console.log('✅ O sistema está pronto para fazer recomendações precisas.')
  } else {
    console.log(`⚠️  ${needsEmbedding.length} cursos ativos ainda têm exercícios sem embeddings`)
    console.log('\n🔧 AÇÃO NECESSÁRIA:')
    console.log('   1. Acesse: /admin/avatars/mestre-ye/train')
    console.log('   2. Vá para a aba "Categorização Exercícios"')
    console.log('   3. Use o filtro "Categorização: Não semantizado"')
    console.log('   4. Clique em "Semantizar Exercícios" no Dashboard')
    console.log('')
    console.log('   OU rode o comando:')
    console.log('   pnpm semantize-pending')
  }
  
  console.log('\n═══════════════════════════════════════════════════════════\n')
}

// Executar
checkActiveCourses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
