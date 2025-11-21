/**
 * Script para semantizar cursos específicos
 * Gera embeddings para exercícios ativos de cursos selecionados
 */

import { createClient } from '@supabase/supabase-js'
import { generateExerciseEmbedding } from '../lib/ai/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Cursos para semantizar
const TARGET_COURSES = [
  'saude-e-longevidade-com-qi-gong',           // 1
  'dose-semanal-de-qi-gong',                    // 2
  'shi-liao-dietoterapia',                      // 4
  'workshop-5-elementos-da-mediciona-tradicional-chinesa' // 5
]

async function semantizeSpecificCourses() {
  console.log('\n🎯 SEMANTIZAÇÃO DE CURSOS ESPECÍFICOS\n')
  console.log('='.repeat(70))
  console.log('\n📋 Cursos selecionados:')
  TARGET_COURSES.forEach((course, idx) => {
    console.log(`   ${idx + 1}. ${course}`)
  })
  console.log('\n' + '='.repeat(70))

  try {
    // 1. Buscar exercícios ativos dos cursos selecionados SEM embeddings
    console.log('\n📚 Buscando exercícios ativos sem embeddings...')
    
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .in('memberkit_course_slug', TARGET_COURSES)
      .eq('enabled', true)
      .is('embedding', null)
      .order('memberkit_course_slug')
      .order('memberkit_lesson_id')

    if (error) throw error

    console.log(`✅ ${exercises.length} exercícios encontrados para processar\n`)

    if (exercises.length === 0) {
      console.log('🎉 Todos os exercícios destes cursos já estão semantizados!')
      return
    }

    // Agrupar por curso para mostrar progresso
    const byCourse = new Map<string, typeof exercises>()
    exercises.forEach(ex => {
      const slug = ex.memberkit_course_slug || 'sem-curso'
      if (!byCourse.has(slug)) {
        byCourse.set(slug, [])
      }
      byCourse.get(slug)!.push(ex)
    })

    console.log('📊 Distribuição por curso:')
    byCourse.forEach((exs, slug) => {
      console.log(`   - ${slug}: ${exs.length} exercícios`)
    })
    console.log('\n' + '='.repeat(70))

    // 2. Gerar embeddings
    let success = 0
    let errors = 0

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      const progress = `[${i + 1}/${exercises.length}]`
      const courseLabel = exercise.memberkit_course_slug?.substring(0, 30) || 'sem-curso'

      try {
        console.log(`\n${progress} 📝 ${courseLabel}`)
        console.log(`   Título: ${exercise.title.substring(0, 60)}${exercise.title.length > 60 ? '...' : ''}`)

        // Verificar se tem dados suficientes
        const hasContent = 
          exercise.title ||
          exercise.description ||
          exercise.benefits ||
          exercise.indications ||
          exercise.organs ||
          exercise.level ||
          exercise.element

        if (!hasContent) {
          console.log(`   ⚠️  Sem conteúdo suficiente - pulando`)
          continue
        }

        // Gerar embedding
        console.log(`   🔄 Gerando embedding...`)
        const embedding = await generateExerciseEmbedding({
          title: exercise.title,
          description: exercise.description || '',
          benefits: exercise.benefits || '',
          indications: exercise.indications || '',
          organs: exercise.organs || '',
          level: exercise.level || '',
          element: exercise.element || '',
        })

        // Salvar no banco
        const { error: updateError } = await supabase
          .from('exercises')
          .update({ embedding })
          .eq('id', exercise.id)

        if (updateError) throw updateError

        console.log(`   ✅ Embedding salvo com sucesso`)
        success++

        // Rate limiting - pausa entre requisições
        if (i < exercises.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150))
        }
      } catch (error) {
        console.error(`   ❌ ERRO:`, error instanceof Error ? error.message : error)
        errors++
        
        // Pequena pausa antes de continuar após erro
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // 3. Resumo final
    console.log('\n' + '='.repeat(70))
    console.log('\n📊 RESUMO FINAL:\n')
    console.log(`   ✅ Sucesso: ${success}/${exercises.length}`)
    console.log(`   ❌ Erros: ${errors}`)
    console.log(`   📈 Taxa de sucesso: ${((success / exercises.length) * 100).toFixed(1)}%`)
    
    console.log('\n📋 Status por curso:')
    for (const courseSlug of TARGET_COURSES) {
      const { data: courseExercises } = await supabase
        .from('exercises')
        .select('id, embedding')
        .eq('memberkit_course_slug', courseSlug)
        .eq('enabled', true)
      
      if (courseExercises) {
        const total = courseExercises.length
        const withEmbedding = courseExercises.filter(e => e.embedding).length
        const percentage = total > 0 ? ((withEmbedding / total) * 100).toFixed(1) : '0.0'
        const status = withEmbedding === total ? '✅' : '⚠️ '
        
        console.log(`   ${status} ${courseSlug}`)
        console.log(`      ${withEmbedding}/${total} semantizados (${percentage}%)`)
      }
    }

    console.log('\n' + '='.repeat(70))
    
    if (success > 0) {
      console.log('\n🎉 Semantização concluída!')
      console.log('🔍 Exercícios prontos para busca semântica\n')
    }
  } catch (error) {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  }
}

semantizeSpecificCourses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
