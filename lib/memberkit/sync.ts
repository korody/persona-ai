/**
 * Memberkit Sync
 * Sincronização de dados do Memberkit
 */

import { fetchCourses, fetchCourseDetails } from './api'
import { upsertExercise, bulkUpsertExercises } from '../exercicios/repository'
import { createAdminClient } from '@/lib/supabase/server'
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
 * Sincronizar cursos do Memberkit para a tabela hub_courses em massa
 */
async function syncCoursesBulk(coursesWithDetails: any[]): Promise<void> {
  console.log('\n📚 Sincronizando cursos para hub_courses (Massa)...')
  const supabase = createAdminClient()

  const coursesToUpsert = coursesWithDetails.map(details => {
    const slug = generateCourseSlug(details.name)

    // Calcular totais
    const totalLessons = details.sections?.reduce(
      (acc: number, section: any) => acc + (section.lessons?.length || 0),
      0
    ) || 0
    const totalSections = details.sections?.length || 0

    return {
      memberkit_course_id: Number(details.id),
      memberkit_course_slug: slug,
      course_name: details.name,
      description: details.description || null,
      course_url: `https://memberkitapp.com/course/${details.id}`,
      thumbnail_url: details.thumbnail_url || null,
      total_lessons: totalLessons,
      total_sections: totalSections,
      is_published: details.is_published ?? true,
      updated_at: new Date().toISOString()
    }
  })

  const { error } = await supabase
    .from('hub_courses')
    .upsert(coursesToUpsert, {
      onConflict: 'memberkit_course_id'
    })

  if (error) {
    console.error(`❌ Erro ao sincronizar cursos em massa:`, error)
  } else {
    console.log(`✅ ${coursesToUpsert.length} cursos sincronizados com sucesso`)
  }
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
  console.log('\n🔄 INICIANDO SINCRONIZAÇÃO OTIMIZADA MEMBERKIT → SUPABASE\n')
  console.log('='.repeat(70))

  const result: SyncResult = {
    total: 0,
    sucesso: 0,
    erros: [],
  }

  try {
    // 1. Buscar todos os cursos
    console.log('\n📚 Buscando cursos do Memberkit...')
    const courses = await fetchCourses()
    console.log(`✅ ${courses.length} curso(s) encontrado(s)\n`)

    // 2. Buscar detalhes de TODOS os cursos (Sequencial mas rápido)
    const coursesWithDetails = []
    console.log('📖 Carregando detalhes dos cursos...')
    for (const course of courses) {
      try {
        const details = await fetchCourseDetails(Number(course.id))
        coursesWithDetails.push(details)
        process.stdout.write('.') // Progresso visual simples
      } catch (err) {
        console.error(`\n❌ Erro ao carregar detalhes do curso ${course.name}:`, err)
      }
    }
    console.log(`\n✅ Detalhes de ${coursesWithDetails.length} cursos carregados\n`)

    // 3. Sincronizar cursos para hub_courses em massa
    await syncCoursesBulk(coursesWithDetails)

    // 4. Processar exercícios de todos os cursos
    const allExercisesToUpsert: ExerciseInsert[] = []

    for (const courseDetails of coursesWithDetails) {
      if (!courseDetails.sections || courseDetails.sections.length === 0) continue

      for (const section of courseDetails.sections) {
        if (!section.lessons || section.lessons.length === 0) continue

        for (const lesson of section.lessons) {
          result.total++
          try {
            const exercicio = createExerciseFromLesson(
              lesson,
              courseDetails,
              section.id,
              metadataMap
            )
            allExercisesToUpsert.push(exercicio)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            result.erros.push({
              lessonId: lesson.id,
              titulo: lesson.title,
              erro: errorMessage,
            })
          }
        }
      }
    }

    // 5. Upsert em massa dos exercícios (em lotes de 100 para segurança)
    console.log(`\n🚀 Preparando upsert de ${allExercisesToUpsert.length} exercícios...`)
    const batchSize = 100
    for (let i = 0; i < allExercisesToUpsert.length; i += batchSize) {
      const batch = allExercisesToUpsert.slice(i, i + batchSize)
      try {
        await bulkUpsertExercises(batch)
        result.sucesso += batch.length
        console.log(`   ✅ Lote ${Math.floor(i / batchSize) + 1} enviado (${batch.length} exercícios)`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`   ❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, errorMessage)

        // Se o lote falhar, o resumo refletirá a falta desses itens na contagem de sucesso
        batch.forEach(ex => {
          result.erros.push({
            lessonId: ex.memberkit_lesson_id,
            titulo: ex.title,
            erro: 'Falha no upsert em massa: ' + errorMessage
          })
        })
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`\n❌ ERRO CRÍTICO: ${errorMessage}\n`)
    throw error
  }

  // Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('\n📊 RESUMO DA SINCRONIZAÇÃO OTIMIZADA:\n')
  console.log(`   📦 Total de exercícios: ${result.total}`)
  console.log(`   ✅ Sincronizados com sucesso: ${result.sucesso}`)
  console.log(`   ❌ Erros: ${result.erros.length}`)

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

    // Controle
    is_active: lesson.is_published ?? true,
    position: lesson.position,
  }
}
