// lib/helpers/academy-links.ts
//
// Quando a pergunta chega pela AcadeMY (academy.mestreye.com), os exercícios recomendados precisam apontar para as
// aulas DE LÁ, não para o MemberKit. A AcadeMY mora no mesmo Supabase (schema "academy"): cada aula guarda o id da
// aula no MemberKit (academy.lessons.memberkit_id), e cada curso o id do curso (academy.courses.memberkit_id).
//
// Regras:
// - aula encontrada na AcadeMY → link da aula (/cursos/<slug>/aula/<id>);
// - só o curso encontrado → link do curso (/cursos/<slug>), que mostra o curso ou como liberar;
// - nem aula nem curso → o exercício sai da lista (não indicamos o MemberKit para quem está na AcadeMY).
// Cada exercício diz se a aluna já tem acesso ao curso (academy_locked), para a resposta não prometer o que ela
// ainda não tem.

import { createAdminClient } from '@/lib/supabase/server'
import type { Exercise } from '@/lib/memberkit/types'

export type AcademyExercise = Exercise & { academy_locked?: boolean }

const academyBase = () => (process.env.ACADEMY_URL || 'https://academy.mestreye.com').replace(/\/$/, '')

// Cursos que a aluna pode assistir na AcadeMY. null = todos (equipe ou acesso a "todos os cursos").
async function accessibleCourseIds(userId: string): Promise<Set<string> | null> {
  const db = createAdminClient().schema('academy')
  const { data: profile } = await db.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (profile?.role === 'admin' || profile?.role === 'master') return null
  const now = new Date().toISOString()
  const { data: rows } = await db
    .from('entitlements')
    .select('course_id')
    .eq('user_id', userId)
    .eq('resource', 'course')
    .eq('status', 'active')
    .lte('starts_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
  if ((rows ?? []).some((r: { course_id: string | null }) => r.course_id === null)) return null
  return new Set((rows ?? []).map((r: { course_id: string }) => r.course_id))
}

export async function linkExercisesToAcademy(exercises: Exercise[], userId: string): Promise<AcademyExercise[]> {
  if (exercises.length === 0) return []
  const db = createAdminClient().schema('academy')
  const lessonIds = [...new Set(exercises.map(e => String(e.memberkit_lesson_id)).filter(Boolean))]
  const courseIds = [...new Set(exercises.map(e => String(e.memberkit_course_id)).filter(Boolean))]

  const [{ data: lessons }, { data: coursesByMk }, access] = await Promise.all([
    db.from('lessons').select('id, course_id, memberkit_id').in('memberkit_id', lessonIds).eq('published', true),
    db.from('courses').select('id, slug, memberkit_id, published').in('memberkit_id', courseIds),
    accessibleCourseIds(userId),
  ])

  // Cursos das aulas encontradas (podem não ser o curso de origem no MemberKit, por causa dos bônus copiados).
  const lessonCourseIds = [...new Set((lessons ?? []).map((l: { course_id: string }) => l.course_id))]
  const { data: lessonCourses } = lessonCourseIds.length
    ? await db.from('courses').select('id, slug, published').in('id', lessonCourseIds)
    : { data: [] as { id: string; slug: string; published: boolean }[] }

  const courseById = new Map((lessonCourses ?? []).map((c: { id: string; slug: string; published: boolean }) => [c.id, c]))
  const lessonByMk = new Map((lessons ?? []).map((l: { id: string; course_id: string; memberkit_id: string }) => [l.memberkit_id, l]))
  const courseByMk = new Map(
    (coursesByMk ?? []).map((c: { id: string; slug: string; memberkit_id: string; published: boolean }) => [c.memberkit_id, c]),
  )
  const canWatch = (courseId: string) => access === null || access.has(courseId)

  return exercises.flatMap(exercise => {
    const lesson = lessonByMk.get(String(exercise.memberkit_lesson_id))
    const lessonCourse = lesson ? courseById.get(lesson.course_id) : undefined
    if (lesson && lessonCourse?.published) {
      return [{
        ...exercise,
        url: `${academyBase()}/cursos/${lessonCourse.slug}/aula/${lesson.id}`,
        academy_locked: !canWatch(lesson.course_id),
      }]
    }
    const course = courseByMk.get(String(exercise.memberkit_course_id))
    if (course?.published) {
      return [{ ...exercise, url: `${academyBase()}/cursos/${course.slug}`, academy_locked: !canWatch(course.id) }]
    }
    return []
  })
}
