/**
 * AI Actions
 * Shared logic for AI-related background tasks
 */

import { createAdminClient } from '../supabase/server'
import { generateExerciseEmbedding } from './embeddings'

export interface EmbeddingsResult {
    generated: number
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
