import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/ai/embeddings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lesson_id,
      duration_minutes,
      level,
      element,
      organs,
      benefits,
      indications,
      contraindications
    } = body

    if (!lesson_id) {
      return NextResponse.json(
        { success: false, error: 'lesson_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update exercise metadata
    const { data: updatedExercise, error: updateError } = await supabase
      .from('exercises')
      .update({
        duration_minutes,
        level,
        element,
        organs: organs ? [organs] : null,
        benefits,
        indications,
        contraindications,
        updated_at: new Date().toISOString()
      })
      .eq('memberkit_lesson_id', lesson_id)
      .select('id, title, description, benefits, indications, element, organs')
      .single()

    if (updateError) {
      console.error('Error updating metadata:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    // Generate embedding automatically if metadata is complete
    if (updatedExercise && duration_minutes && level && element) {
      try {
        const embedding = await generateEmbedding(updatedExercise)
        
        if (embedding) {
          await supabase
            .from('exercises')
            .update({ embedding })
            .eq('id', updatedExercise.id)
          
          console.log(`✅ Embedding gerado automaticamente para: ${updatedExercise.title}`)
        }
      } catch (embeddingError) {
        console.error('Error generating embedding:', embeddingError)
        // Não falha a operação se o embedding falhar
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving metadata:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
