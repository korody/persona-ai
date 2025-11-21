import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total exercises
    const { count: totalExercises } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })

    // Get active exercises (enabled=true)
    const { count: activeExercises } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', true)

    // Get curated exercises (with metadata)
    const { count: curatedExercises } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .not('duration_minutes', 'is', null)

    // Get exercises with embeddings
    const { count: withEmbeddings } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    // Get course statistics
    const { data: courseData } = await supabase
      .from('exercises')
      .select('memberkit_course_slug, duration_minutes, enabled')

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
      if (exercise.enabled !== false) {
        stats.enabledCount++
      }
    })

    // Calculate total and active courses
    const totalCourses = courseMap.size
    const activeCourses = Array.from(courseMap.values()).filter(stats => 
      stats.enabledCount === stats.total && stats.total > 0
    ).length

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
