/**
 * AI Actions
 * Shared logic for AI-related background tasks
 */

import { createAdminClient } from '../supabase/server'
import { generateExerciseEmbedding } from './embeddings'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export interface EmbeddingsResult {
    generated: number
    skipped: number
    errors: number
    total: number
}

export interface CategorizationResult {
    categorized: number
    skipped: number
    errors: number
    total: number
}

/**
 * Generates embeddings for all exercises that don't have one but have metadata.
 */
export async function runBatchGenerateEmbeddings(): Promise<EmbeddingsResult> {
    const supabase = createAdminClient()

    const result: EmbeddingsResult = {
        generated: 0,
        skipped: 0,
        errors: 0,
        total: 0
    }

    // 1. Fetch active exercises (even without metadata)
    const { data: exercises, error } = await supabase
        .from('hub_exercises')
        .select('*')
        .eq('is_active', true)
        .order('memberkit_lesson_id')

    if (error) throw error
    if (!exercises) return result

    result.total = exercises.length

    // 2. Generate embeddings
    for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]

        try {
            // Skip if already has embedding
            if (exercise.embedding && exercise.embedding.length > 0) {
                result.skipped++
                continue
            }

            // Generate embedding
            const embedding = await generateExerciseEmbedding({
                title: exercise.title,
                description: exercise.description,
                benefits: exercise.benefits,
                indications: exercise.indications,
                organs: exercise.organs,
            })

            // Save to DB
            const { error: updateError } = await supabase
                .from('hub_exercises')
                .update({ embedding })
                .eq('id', exercise.id)

            if (updateError) throw updateError

            result.generated++

            // Small pause to avoid hitting rate limits too hard
            if (i < exercises.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        } catch (error) {
            console.error(`❌ Error generating embedding for ${exercise.title}:`, error)
            result.errors++
        }
    }

    return result
}

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

/**
 * Automatically categorizes active exercises that lack metadata.
 */
export async function runBatchAutoCategorize(): Promise<CategorizationResult> {
    const supabase = createAdminClient()
    const result: CategorizationResult = {
        categorized: 0,
        skipped: 0,
        errors: 0,
        total: 0
    }

    // 1. Fetch active exercises that lack categorization
    const { data: exercises, error } = await supabase
        .from('hub_exercises')
        .select('*')
        .eq('is_active', true)
        .or('duration_minutes.is.null,level.is.null,element.is.null')
        .order('memberkit_lesson_id')

    if (error) throw error
    if (!exercises) return result

    result.total = exercises.length

    // 2. Categorize each exercise
    for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i]

        try {
            const prompt = CATEGORIZATION_PROMPT
                .replace('{title}', exercise.title || 'Sem título')
                .replace('{description}', exercise.description || 'Sem descrição')
                .replace('{benefits}', Array.isArray(exercise.benefits) ? exercise.benefits.join(', ') : (exercise.benefits || 'Não informado'))
                .replace('{indications}', Array.isArray(exercise.indications) ? exercise.indications.join(', ') : (exercise.indications || 'Não informado'))
                .replace('{organs}', Array.isArray(exercise.organs) ? exercise.organs.join(', ') : (exercise.organs || 'Não informado'))

            const { text } = await generateText({
                model: openai('gpt-4o-mini'),
                prompt,
                temperature: 0.1,
            })

            // Parse JSON response
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                throw new Error('Resposta da IA não contém JSON válido')
            }

            const aiResult = JSON.parse(jsonMatch[0])

            // Save to DB
            const { error: updateError } = await supabase
                .from('hub_exercises')
                .update({
                    duration_minutes: aiResult.duration_minutes,
                    level: aiResult.level,
                    element: aiResult.element,
                })
                .eq('id', exercise.id)

            if (updateError) throw updateError

            result.categorized++

            // Pause to avoid rate limits
            if (i < exercises.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 200))
            }
        } catch (error) {
            console.error(`❌ Error categorizing ${exercise.title}:`, error)
            result.errors++
        }
    }

    return result
}
