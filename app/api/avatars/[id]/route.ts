import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing avatar id' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    const { data, error } = await supabase
      .from('avatars')
      .select('id, name, slug, description')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ avatar: data })

  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json(
      { error: 'Failed to fetch avatar' },
      { status: 500 }
    )
  }
}
