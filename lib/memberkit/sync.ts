/**
 * Memberkit Sync
 * Sincronização de dados do Memberkit
 */

import { fetchCourses, fetchCourseDetails } from './api'
import { upsertExercise } from '../exercicios/repository'
import { createClient } from '@/lib/supabase/server'
import type {
  ExercisesMetadataMap,
  ExerciseInsert,
  MemberkitLesson,
  MemberkitCourse,
} from './types'

// ============================================
// TIPOS
// ============================================

export interface SyncResult {
  total: number
  sucesso: number
  erros: Array<{
    lessonId: string
    titulo: string
    erro: string
  }>
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * Gera slug a partir do nome do curso
 */
function generateCourseSlug(courseName: string): string {
  return courseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens do início e fim
}

/**
 * Sincronizar cursos do Memberkit para a tabela hub_courses
 */
async function syncCourses(courses: MemberkitCourse[]): Promise<void> {
  console.log('\n📚 Sincronizando cursos para hub_courses...')
  const supabase = await createClient()

  for (const course of courses) {
    try {
      const courseDetails = await fetchCourseDetails(Number(course.id))
      const slug = generateCourseSlug(course.name)
      
      // Calcular totais
      const totalLessons = courseDetails.sections?.reduce(
        (acc, section) => acc + (section.lessons?.length || 0),
        0
      ) || 0
      const totalSections = courseDetails.sections?.length || 0

      const { error } = await supabase
        .from('hub_courses')
        .upsert({
          memberkit_course_id: Number(course.id),
          memberkit_course_slug: slug,
          course_name: course.name,
          description: courseDetails.description || null,
          course_url: `https://memberkitapp.com/course/${course.id}`,
          thumbnail_url: courseDetails.thumbnail_url || null,
          total_lessons: totalLessons,
          total_sections: totalSections,
          is_published: courseDetails.is_published ?? true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'memberkit_course_id'
        })

      if (error) {
        console.error(`❌ Erro ao sincronizar curso ${course.name}:`, error)
      } else {
        console.log(`✅ Curso sincronizado: ${course.name} (${totalLessons} aulas)`)
      }
    } catch (error) {
      console.error(`❌ Erro ao processar curso ${course.name}:`, error)
    }
  }
  console.log('✅ Sincronização de cursos concluída\n')
}

/**
 * Sincronizar exercícios do Memberkit para o banco de dados
 * 
 * @param metadataMap - Mapa de metadata customizada por lesson_id
 * @returns Resultado da sincronização com total, sucessos e erros
 */
export async function syncExercises(
  metadataMap: ExercisesMetadataMap
): Promise<SyncResult> {
  console.log('\n🔄 INICIANDO SINCRONIZAÇÃO MEMBERKIT → SUPABASE\n')
  console.log('='.repeat(70))

  const result: SyncResult = {
    total: 0,
    sucesso: 0,
    erros: [],
  }

  try {
    // 1. Buscar todos os cursos
    console.log('\n📚 Buscando cursos...')
    const courses = await fetchCourses()
    console.log(`✅ ${courses.length} curso(s) encontrado(s)\n`)

    // 2. Sincronizar cursos para hub_courses
    await syncCourses(courses)

    // 3. Processar cada curso
    for (const course of courses) {
      console.log(`\n📖 Curso: ${course.name} (ID: ${course.id})`)
      console.log('-'.repeat(70))

      try {
        // 3. Buscar detalhes do curso (com sections e lessons)
        const courseDetails = await fetchCourseDetails(Number(course.id))
        
        if (!courseDetails.sections || courseDetails.sections.length === 0) {
          console.log('   ⚠️  Curso sem seções, pulando...\n')
          continue
        }

        // 4. Processar cada seção
        for (const section of courseDetails.sections) {
          console.log(`\n   📂 Seção: ${section.name}`)
          
          if (!section.lessons || section.lessons.length === 0) {
            console.log('      ⚠️  Seção sem aulas, pulando...')
            continue
          }

          // 5. Processar cada lesson
          for (const lesson of section.lessons) {
            result.total++

            try {
              // Criar objeto Exercicio
              const exercicio = createExerciseFromLesson(
                lesson,
                courseDetails,
                section.id,
                metadataMap
              )

              // Fazer upsert no banco
              await upsertExercise(exercicio)

              result.sucesso++
              console.log(`      ✅ ${lesson.position}. ${lesson.title}`)

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              
              result.erros.push({
                lessonId: lesson.id,
                titulo: lesson.title,
                erro: errorMessage,
              })

              console.log(`      ❌ ${lesson.position}. ${lesson.title}`)
              console.log(`         Erro: ${errorMessage}`)
            }
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.log(`   ❌ Erro ao processar curso: ${errorMessage}\n`)
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`\n❌ ERRO CRÍTICO: ${errorMessage}\n`)
    throw error
  }

  // Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('\n📊 RESUMO DA SINCRONIZAÇÃO:\n')
  console.log(`   📦 Total de exercícios: ${result.total}`)
  console.log(`   ✅ Sincronizados com sucesso: ${result.sucesso}`)
  console.log(`   ❌ Erros: ${result.erros.length}`)

  if (result.erros.length > 0) {
    console.log('\n⚠️  ERROS DETALHADOS:\n')
    result.erros.forEach((erro, i) => {
      console.log(`   ${i + 1}. ${erro.titulo} (${erro.lessonId})`)
      console.log(`      ${erro.erro}\n`)
    })
  }

  console.log('\n' + '='.repeat(70) + '\n')

  return result
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Criar objeto Exercicio a partir de uma lesson do Memberkit
 * Aplica metadata customizada se existir
 */
function createExerciseFromLesson(
  lesson: MemberkitLesson,
  course: MemberkitCourse,
  sectionId: string,
  metadataMap: ExercisesMetadataMap
): ExerciseInsert {
  const lessonId = lesson.id
  const metadata = metadataMap[lessonId] || {}

  // Gerar slug do curso (API não retorna)
  const courseSlug = course.slug || generateCourseSlug(course.name)

  // URL do exercício: formato /{courseId}-{course-slug}/{lessonId}-{lesson-slug}
  const url = `https://mestre-ye.memberkit.com.br/${course.id}-${courseSlug}/${lessonId}-${lesson.slug}`

  return {
    // IDs do Memberkit
    memberkit_course_id: course.id,
    memberkit_course_slug: courseSlug,
    memberkit_section_id: sectionId,
    memberkit_lesson_id: lessonId,

    // Informações básicas
    title: lesson.title,
    description: null, // Memberkit não fornece descrição na lesson
    slug: lesson.slug,
    url,

    // Classificação MTC (vem do metadata)
    element: metadata.element || null,
    organs: metadata.organs || null,

    // Detalhes do exercício (vem do metadata ou da lesson)
    duration_minutes: metadata.duration_minutes || 
                     (lesson.duration_seconds ? Math.ceil(lesson.duration_seconds / 60) : null),
    level: metadata.level || null,

    // Tags e busca (vem do metadata)
    tags: metadata.tags || null,
    benefits: metadata.benefits || null,
    indications: metadata.indications || null,
    contraindications: metadata.contraindications || null,

    // Embedding (será gerado posteriormente)
    embedding: null,

    // Controle
    is_active: lesson.is_published ?? true,
    position: lesson.position,
  }
}
