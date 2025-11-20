// API para gerenciar prompts dos avatares

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const avatarId = searchParams.get('avatarId')
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!avatarId) {
      return NextResponse.json({ error: 'Missing avatarId' }, { status: 400 })
    }

    // Buscar avatar atual
    const { data: avatar, error: avatarError } = await supabase
      .from('avatars')
      .select('system_prompt')
      .eq('id', avatarId)
      .single()

    if (avatarError) {
      return NextResponse.json({ error: avatarError.message }, { status: 500 })
    }

    // Buscar histórico de versões
    const { data: versions, error: versionsError } = await supabase
      .from('avatar_prompt_versions')
      .select('*')
      .eq('avatar_id', avatarId)
      .order('version', { ascending: false })

    if (versionsError) {
      return NextResponse.json({ error: versionsError.message }, { status: 500 })
    }

    return NextResponse.json({
      currentPrompt: avatar.system_prompt,
      versions: versions || []
    })
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { avatarId, systemPrompt, performanceNotes } = await req.json()

    if (!avatarId || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Pegar versão atual
    const { data: versions } = await supabase
      .from('avatar_prompt_versions')
      .select('version')
      .eq('avatar_id', avatarId)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = versions && versions.length > 0 ? versions[0].version + 1 : 1

    // Desativar todas as versões anteriores
    await supabase
      .from('avatar_prompt_versions')
      .update({ is_active: false })
      .eq('avatar_id', avatarId)

    // Criar nova versão
    const { data: newVersion, error: versionError } = await supabase
      .from('avatar_prompt_versions')
      .insert({
        avatar_id: avatarId,
        version: nextVersion,
        system_prompt: systemPrompt,
        is_active: true,
        performance_notes: performanceNotes,
        created_by: user.id
      })
      .select()
      .single()

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 })
    }

    // Atualizar prompt do avatar
    const { error: updateError } = await supabase
      .from('avatars')
      .update({ system_prompt: systemPrompt })
      .eq('id', avatarId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ version: newVersion })
  } catch (error) {
    console.error('Error updating prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Reverter para uma versão anterior
export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { versionId } = await req.json()

    if (!versionId) {
      return NextResponse.json({ error: 'Missing version ID' }, { status: 400 })
    }

    // Buscar versão
    const { data: version, error: versionError } = await supabase
      .from('avatar_prompt_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }

    // Desativar todas as versões
    await supabase
      .from('avatar_prompt_versions')
      .update({ is_active: false })
      .eq('avatar_id', version.avatar_id)

    // Ativar esta versão
    await supabase
      .from('avatar_prompt_versions')
      .update({ is_active: true })
      .eq('id', versionId)

    // Atualizar avatar
    const { error: updateError } = await supabase
      .from('avatars')
      .update({ system_prompt: version.system_prompt })
      .eq('id', version.avatar_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reverting prompt:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
