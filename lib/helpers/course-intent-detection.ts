/**
 * Course Intent Detection
 * Detecta quando o usuário menciona um curso específico na mensagem
 * e resolve para o memberkit_course_id correspondente.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface DetectedCourse {
  courseId: number
  courseName: string
  courseSlug: string
  confidence: 'high' | 'medium' | 'low'
}

// Aliases e variações conhecidas de nomes de cursos
// Expandir conforme novos cursos forem adicionados
const COURSE_ALIASES: Record<string, string[]> = {
  'longevidade e independência': [
    'longevidade e independência',
    'longevidade e independencia',
    'longevidade independência',
    'longevidade independencia',
    'curso longevidade',
    'longevidade qi gong',
  ],
  'saúde & longevidade': [
    'saúde e longevidade',
    'saude e longevidade',
    'saúde & longevidade',
    'saude longevidade',
    'curso saúde',
  ],
}

/**
 * Normaliza string para comparação: lowercase, sem acentos, sem pontuação extra
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Verifica se a mensagem contém alguma variação do nome do curso
 */
function matchesAlias(normalizedMessage: string, aliases: string[]): boolean {
  return aliases.some(alias => normalizedMessage.includes(normalize(alias)))
}

/**
 * Detecta qual curso o usuário está mencionando na mensagem.
 * Busca os cursos disponíveis no banco e tenta fazer match fuzzy.
 *
 * Retorna null se nenhum curso for identificado com confiança.
 */
export async function detectCourseIntent(
  message: string
): Promise<DetectedCourse | null> {
  const normalizedMessage = normalize(message)

  // Atalho: se não tem palavras-chave de curso, pular a query
  const courseKeywords = ['curso', 'aula', 'modulo', 'licao', 'longevidade', 'saude', 'independencia']
  const hasCourseKeyword = courseKeywords.some(kw => normalizedMessage.includes(kw))
  if (!hasCourseKeyword) return null

  const supabase = await createAdminClient()

  const { data: courses, error } = await supabase
    .from('hub_courses')
    .select('memberkit_course_id, course_name, memberkit_course_slug')
    .eq('is_published', true)

  if (error || !courses?.length) return null

  // Tentar match direto: normalizar nome do curso e verificar se está na mensagem
  for (const course of courses) {
    const normalizedCourseName = normalize(course.course_name)

    // Match direto pelo nome completo normalizado
    if (normalizedMessage.includes(normalizedCourseName)) {
      return {
        courseId: course.memberkit_course_id,
        courseName: course.course_name,
        courseSlug: course.memberkit_course_slug,
        confidence: 'high',
      }
    }

    // Match por aliases configurados
    for (const [, aliases] of Object.entries(COURSE_ALIASES)) {
      if (matchesAlias(normalizedMessage, aliases)) {
        // Verificar qual curso do banco corresponde a esse grupo de aliases
        const aliasNormalized = normalize(aliases[0])
        if (normalizedCourseName.includes(aliasNormalized) || aliasNormalized.includes(normalizedCourseName.split(' ')[0])) {
          return {
            courseId: course.memberkit_course_id,
            courseName: course.course_name,
            courseSlug: course.memberkit_course_slug,
            confidence: 'medium',
          }
        }
      }
    }
  }

  // Match parcial: pelo menos 2 palavras significativas do nome do curso presentes
  for (const course of courses) {
    const courseWords = normalize(course.course_name)
      .split(' ')
      .filter(w => w.length > 4) // Ignorar palavras curtas (de, e, com, etc)

    const matchCount = courseWords.filter(w => normalizedMessage.includes(w)).length

    if (matchCount >= 2) {
      return {
        courseId: course.memberkit_course_id,
        courseName: course.course_name,
        courseSlug: course.memberkit_course_slug,
        confidence: 'low',
      }
    }
  }

  return null
}

/**
 * Formata o contexto do curso detectado para o system prompt
 */
export function formatCourseContext(course: DetectedCourse): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 CURSO IDENTIFICADO NA PERGUNTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O aluno está perguntando especificamente sobre o curso: "${course.courseName}"
Os exercícios recomendados abaixo são EXCLUSIVAMENTE deste curso.
NÃO recomende exercícios de outros cursos nesta resposta.
`
}
