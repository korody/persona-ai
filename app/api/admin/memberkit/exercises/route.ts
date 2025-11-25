import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: exercises, error } = await supabase
      .from('hub_exercises')
      .select('id, memberkit_lesson_id, title, memberkit_course_slug, duration_minutes, level, element, embedding, is_active')
      .order('title')

    console.log('🔍 Raw data sample:', exercises?.slice(0, 3).map(e => ({ 
      title: e.title, 
      is_active: e.is_active,
      type: typeof e.is_active 
    })))

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!exercises) {
      return NextResponse.json({
        exercises: [],
        total: 0
      })
    }

    // Transform to include computed fields
    const exercisesWithStatus = exercises.map(exercise => ({
      lesson_id: exercise.memberkit_lesson_id,
      title: exercise.title,
      memberkit_course_slug: exercise.memberkit_course_slug,
      has_metadata: exercise.duration_minutes !== null,
      has_embedding: exercise.embedding !== null,
      duration_minutes: exercise.duration_minutes,
      level: exercise.level,
      element: exercise.element,
      enabled: exercise.is_active === true || exercise.is_active === null // Explicitly true or null = enabled
    }))

    console.log('📊 Exercise stats:', {
      total: exercisesWithStatus.length,
      enabled: exercisesWithStatus.filter(e => e.enabled).length,
      disabled: exercisesWithStatus.filter(e => !e.enabled).length
    })

    return NextResponse.json({
      exercises: exercisesWithStatus,
      total: exercisesWithStatus.length
    })
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}
