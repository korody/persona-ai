/**
 * API Route para adicionar colunas temperature e max_tokens na tabela avatars
 * POST /api/admin/migrate-avatar-columns
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    console.log('🔧 Adicionando colunas temperature e max_tokens...')
    
    // Executar ALTER TABLE via SQL
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE avatars 
          ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7,
          ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 500;
          
          UPDATE avatars 
          SET 
            temperature = COALESCE(temperature, 0.7),
            max_tokens = COALESCE(max_tokens, 500);
        `
      })
    
    if (error) {
      console.error('❌ Erro Supabase:', error)
      return NextResponse.json({ 
        error: error.message,
        details: error 
      }, { status: 500 })
    }
    
    console.log('✅ Colunas adicionadas!')
    
    // Verificar
    const { data: avatar } = await supabase
      .from('avatars')
      .select('id, name, temperature, max_tokens')
      .limit(1)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Colunas adicionadas com sucesso',
      sample: avatar
    })
    
  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}
