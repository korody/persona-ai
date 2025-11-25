import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { slug, enabled } = await request.json()

    if (!slug) {
      return NextResponse.json(
        { error: 'slug is required' },
        { status: 400 }
      )
    }

    // Use ADMIN client to bypass RLS
    const supabase = await createAdminClient()

    console.log('🔄 Toggling course:', { slug, enabled })

    // 1. Update course in hub_courses table
    const { data: courseData, error: courseError } = await supabase
      .from('hub_courses')
      .update({ is_published: enabled })
      .eq('memberkit_course_slug', slug)
      .select('memberkit_course_id')

    if (courseError) {
      console.error('Error toggling course:', courseError)
      return NextResponse.json(
        { error: courseError.message },
        { status: 500 }
      )
    }

    if (!courseData || courseData.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const courseId = courseData[0].memberkit_course_id

    // 2. Update all exercises of this course
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('hub_exercises')
      .update({ is_active: enabled })
      .eq('memberkit_course_id', courseId)
      .select('id')

    console.log('✅ Course and exercises updated:', { 
      courseId,
      slug,
      is_published: enabled,
      exercisesUpdated: exercisesData?.length || 0
    })

    if (exercisesError) {
      console.error('Error updating exercises:', exercisesError)
    }

    return NextResponse.json({ 
      success: true, 
      courseUpdated: true,
      exercisesUpdated: exercisesData?.length || 0
    })
  } catch (error) {
    console.error('Error toggling course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
