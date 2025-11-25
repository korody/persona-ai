import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total exercises
    const { count: totalExercises } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })

    // Get active exercises (is_active=true)
    const { count: activeExercises } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get curated exercises (with metadata)
    const { count: curatedExercises } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })
      .not('duration_minutes', 'is', null)

    // Get exercises with embeddings
    const { count: withEmbeddings } = await supabase
      .from('hub_exercises')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    // Get courses from hub_courses
    const { count: totalCourses } = await supabase
      .from('hub_courses')
      .select('*', { count: 'exact', head: true })

    const { count: activeCourses } = await supabase
      .from('hub_courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get course statistics from exercises
    const { data: courseData } = await supabase
      .from('hub_exercises')
      .select('memberkit_course_slug, duration_minutes, is_active')

    // Group by course and calculate stats
    const courseMap = new Map<string, { total: number; curated: number; enabledCount: number }>()
    
    courseData?.forEach(exercise => {
      const slug = exercise.memberkit_course_slug || 'sem-curso'
      if (!courseMap.has(slug)) {
        courseMap.set(slug, { total: 0, curated: 0, enabledCount: 0 })
      }
      const stats = courseMap.get(slug)!
      stats.total++
      if (exercise.duration_minutes !== null) {
        stats.curated++
      }
      if (exercise.is_active !== false) {
        stats.enabledCount++
      }
    })

    const courseStats = Array.from(courseMap.entries()).map(([slug, stats]) => ({
      slug,
      name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      total: stats.total,
      curated: stats.curated,
      percentage: stats.total > 0 ? (stats.curated / stats.total) * 100 : 0
    }))

    const completionPercentage = totalExercises ? (curatedExercises! / totalExercises) * 100 : 0

    return NextResponse.json({
      totalExercises: totalExercises || 0,
      activeExercises: activeExercises || 0,
      totalCourses,
      activeCourses,
      curatedExercises: curatedExercises || 0,
      withEmbeddings: withEmbeddings || 0,
      completionPercentage,
      courseStats: courseStats.sort((a, b) => b.total - a.total)
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
