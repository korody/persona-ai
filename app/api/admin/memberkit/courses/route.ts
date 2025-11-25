import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Get all courses from hub_courses (including inactive)
    const { data: courses, error: coursesError } = await supabase
      .from('hub_courses')
      .select('*')
      .order('is_published', { ascending: false })
      .order('course_name')

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ courses: [] })
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({ courses: [] })
    }

    // Get all exercises to calculate stats
    const { data: exercises } = await supabase
      .from('hub_exercises')
      .select('memberkit_course_id, duration_minutes, embedding, is_active')

    // Build stats map by course ID
    const statsMap = new Map<number, {
      total: number
      categorized: number
      withEmbeddings: number
      activeCount: number
    }>()

    if (exercises) {
      exercises.forEach(exercise => {
        const courseId = exercise.memberkit_course_id
        if (!courseId) return

        if (!statsMap.has(courseId)) {
          statsMap.set(courseId, {
            total: 0,
            categorized: 0,
            withEmbeddings: 0,
            activeCount: 0
          })
        }

        const stats = statsMap.get(courseId)!
        stats.total++
        if (exercise.duration_minutes !== null) stats.categorized++
        if (exercise.embedding !== null) stats.withEmbeddings++
        if (exercise.is_active !== false) stats.activeCount++
      })
    }

    // Map courses with stats
    const coursesWithStats = courses.map(course => {
      const stats = statsMap.get(course.memberkit_course_id) || {
        total: 0,
        categorized: 0,
        withEmbeddings: 0,
        activeCount: 0
      }

      return {
        memberkit_course_id: course.memberkit_course_id,
        slug: course.memberkit_course_slug,
        name: course.course_name,
        total: stats.total,
        categorized: stats.categorized,
        withEmbeddings: stats.withEmbeddings,
        activeCount: stats.activeCount,
        percentage: stats.total > 0 ? (stats.categorized / stats.total) * 100 : 0,
        enabled: course.is_published
      }
    })

    return NextResponse.json({ courses: coursesWithStats })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
