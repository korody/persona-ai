/**
 * Script para categorizar automaticamente exercícios usando IA
 * Categoriza exercícios que têm embeddings mas não têm metadata completo
 */

import { createClient } from '@supabase/supabase-js'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CATEGORIZATION_PROMPT = `Você é um especialista em Medicina Tradicional Chinesa (MTC) e Qi Gong com profundo conhecimento sobre os 5 Elementos (Wu Xing).

Analise o exercício de Qi Gong abaixo e forneça uma categorização precisa baseada na MTC:

**TÍTULO:** {title}
**DESCRIÇÃO:** {description}
**BENEFÍCIOS:** {benefits}
**INDICAÇÕES:** {indications}
**ÓRGÃOS:** {organs}

Categorize este exercício com base nos seguintes critérios:

## NÍVEL DE DIFICULDADE
- **INICIANTE**: Movimentos simples, baixo impacto, adequado para iniciantes ou pessoas com limitações físicas
- **INTERMEDIÁRIO**: Requer coordenação moderada, alguma força/flexibilidade, prática regular recomendada
- **AVANÇADO**: Movimentos complexos, requer prática extensa, alta coordenação e condicionamento físico

## ELEMENTO (WU XING)
- **TERRA**: Estabilidade, equilíbrio, centro, Baço/Estômago, digestão, preocupação, pensamento
- **ÁGUA**: Fluidez, descanso, Rins/Bexiga, vitalidade, medo, força de vontade, ossos
- **FOGO**: Energia, circulação, Coração/Intestino Delgado, alegria, ansiedade, mente
- **METAL**: Respiração, purificação, Pulmões/Intestino Grosso, tristeza, estrutura, pele
- **MADEIRA**: Flexibilidade, movimento, Fígado/Vesícula Biliar, raiva, planejamento, músculos

## DURAÇÃO ESTIMADA
Estime a duração em minutos baseado na complexidade e tipo de exercício:
- Exercícios simples/curtos: 5-15 minutos
- Exercícios moderados: 15-30 minutos
- Sequências completas: 30-60 minutos
- Workshops/aulas: 60-120 minutos

Responda APENAS no seguinte formato JSON (sem markdown, sem explicações):
{
  "duration_minutes": <número>,
  "level": "<INICIANTE|INTERMEDIÁRIO|AVANÇADO>",
  "element": "<TERRA|ÁGUA|FOGO|METAL|MADEIRA>",
  "reasoning": "<breve explicação da categorização>"
}`

interface CategorizationResult {
  duration_minutes: number
  level: 'INICIANTE' | 'INTERMEDIÁRIO' | 'AVANÇADO'
  element: 'TERRA' | 'ÁGUA' | 'FOGO' | 'METAL' | 'MADEIRA'
  reasoning: string
}

async function categorizeExercise(exercise: any): Promise<CategorizationResult | null> {
  try {
    const prompt = CATEGORIZATION_PROMPT
      .replace('{title}', exercise.title || 'Sem título')
      .replace('{description}', exercise.description || 'Sem descrição')
      .replace('{benefits}', exercise.benefits || 'Não informado')
      .replace('{indications}', exercise.indications || 'Não informado')
      .replace('{organs}', exercise.organs || 'Não informado')

    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt,
      temperature: 0.3,
    })

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('   ❌ Resposta não está em formato JSON')
      return null
    }

    const result = JSON.parse(jsonMatch[0]) as CategorizationResult
    
    // Validate
    if (!result.duration_minutes || !result.level || !result.element) {
      console.error('   ❌ Resposta incompleta')
      return null
    }

    return result
  } catch (error) {
    console.error('   ❌ Erro ao categorizar:', error instanceof Error ? error.message : error)
    return null
  }
}

async function autoCategorizeCourses() {
  console.log('\n🤖 CATEGORIZAÇÃO AUTOMÁTICA COM IA\n')
  console.log('='.repeat(70))

  const TARGET_COURSES = [
    'saude-e-longevidade-com-qi-gong',
    'dose-semanal-de-qi-gong',
    'shi-liao-dietoterapia',
    'workshop-5-elementos-da-mediciona-tradicional-chinesa'
  ]

  console.log('\n📋 Cursos selecionados:')
  TARGET_COURSES.forEach((course, idx) => {
    console.log(`   ${idx + 1}. ${course}`)
  })

  try {
    // Buscar exercícios COM embedding mas SEM categorização completa
    console.log('\n📚 Buscando exercícios para categorizar...')
    
    const { data: exercises, error } = await supabase
      .from('hub_exercises')
      .select('*')
      .in('memberkit_course_slug', TARGET_COURSES)
      .eq('enabled', true)
      .not('embedding', 'is', null)
      .or('duration_minutes.is.null,level.is.null,element.is.null')
      .order('memberkit_course_slug')
      .order('memberkit_lesson_id')

    if (error) throw error

    console.log(`✅ ${exercises.length} exercícios encontrados\n`)

    if (exercises.length === 0) {
      console.log('🎉 Todos os exercícios já estão categorizados!')
      return
    }

    console.log('='.repeat(70))

    let success = 0
    let errors = 0

    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i]
      const progress = `[${i + 1}/${exercises.length}]`
      const courseLabel = exercise.memberkit_course_slug?.substring(0, 30) || 'sem-curso'

      console.log(`\n${progress} 📝 ${courseLabel}`)
      console.log(`   Título: ${exercise.title.substring(0, 60)}${exercise.title.length > 60 ? '...' : ''}`)

      // Categorizar com IA
      console.log(`   🤖 Analisando com IA...`)
      const categorization = await categorizeExercise(exercise)

      if (!categorization) {
        errors++
        console.log(`   ❌ Falha na categorização`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      console.log(`   📊 Resultado:`)
      console.log(`      ⏱️  Duração: ${categorization.duration_minutes} minutos`)
      console.log(`      📈 Nível: ${categorization.level}`)
      console.log(`      🌿 Elemento: ${categorization.element}`)
      console.log(`      💡 Razão: ${categorization.reasoning}`)

      // Salvar no banco
      const { error: updateError } = await supabase
        .from('hub_exercises')
        .update({
          duration_minutes: categorization.duration_minutes,
          level: categorization.level,
          element: categorization.element,
        })
        .eq('id', exercise.id)

      if (updateError) {
        console.error(`   ❌ Erro ao salvar:`, updateError.message)
        errors++
      } else {
        console.log(`   ✅ Categorização salva com sucesso`)
        success++
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Resumo final
    console.log('\n' + '='.repeat(70))
    console.log('\n📊 RESUMO FINAL:\n')
    console.log(`   ✅ Sucesso: ${success}/${exercises.length}`)
    console.log(`   ❌ Erros: ${errors}`)
    console.log(`   📈 Taxa de sucesso: ${((success / exercises.length) * 100).toFixed(1)}%`)

    console.log('\n📋 Status por curso:')
    for (const courseSlug of TARGET_COURSES) {
      const { data: courseExercises } = await supabase
        .from('hub_exercises')
        .select('id, duration_minutes, level, element')
        .eq('memberkit_course_slug', courseSlug)
        .eq('enabled', true)

      if (courseExercises) {
        const total = courseExercises.length
        const categorized = courseExercises.filter(e => 
          e.duration_minutes !== null && 
          e.level !== null && 
          e.element !== null
        ).length
        const percentage = total > 0 ? ((categorized / total) * 100).toFixed(1) : '0.0'
        const status = categorized === total ? '✅' : '⚠️ '

        console.log(`   ${status} ${courseSlug}`)
        console.log(`      ${categorized}/${total} categorizados (${percentage}%)`)
      }
    }

    console.log('\n' + '='.repeat(70))

    if (success > 0) {
      console.log('\n🎉 Categorização automática concluída!')
      console.log('📋 Exercícios prontos para recomendação precisa\n')
    }
  } catch (error) {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  }
}

autoCategorizeCourses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error)
    process.exit(1)
  })
