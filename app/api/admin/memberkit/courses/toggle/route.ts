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

    // Debug: Try a raw select first to see if we can read the data
    const { data: beforeUpdate, error: selectError } = await supabase
      .from('exercises')
      .select('id, memberkit_course_slug, enabled')
      .eq('memberkit_course_slug', slug)
      .limit(3)
    
    console.log('📋 Before update - found exercises:', {
      count: beforeUpdate?.length,
      samples: beforeUpdate?.map(e => ({ id: e.id, slug: e.memberkit_course_slug, enabled: e.enabled }))
    })

    // Now try the update
    const { data, error } = await supabase
      .from('exercises')
      .update({ enabled })
      .eq('memberkit_course_slug', slug)
      .select()

    console.log('✅ After update:', { 
      count: data?.length, 
      error,
      samples: data?.slice(0, 3).map(e => ({ id: e.id, enabled: e.enabled }))
    })

    if (error) {
      console.error('Error toggling course:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, updatedCount: data?.length })
  } catch (error) {
    console.error('Error toggling course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
