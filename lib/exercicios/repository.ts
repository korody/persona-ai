/**
 * Exercícios Repository
 * Camada de acesso aos dados de exercícios
 */

import { createClient } from '@supabase/supabase-js'
import type {
  Exercise,
  ExerciseInsert,
  MTCElement,
} from '../memberkit/types'

// ============================================
// CONFIGURAÇÃO DO CLIENTE SUPABASE
// ============================================

let supabaseInstance: any = null

function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL ou SERVICE_ROLE_KEY não configurados')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseServiceKey)
  }
  return supabaseInstance
}

// ============================================
// REPOSITORY FUNCTIONS
// ============================================

/**
 * Upsert de exercício baseado em memberkit_lesson_id
 * Se já existir um exercício com o mesmo memberkit_lesson_id, atualiza
 * Caso contrário, cria um novo
 */
export async function upsertExercise(
  data: ExerciseInsert
): Promise<Exercise> {
  const supabase = getSupabase()
  const { data: result, error } = await supabase
    .from('exercises')
    .upsert(data, {
      onConflict: 'memberkit_lesson_id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao fazer upsert de exercício: ${error.message}`)
  }

  return result
}

/**
 * Buscar exercícios por tag em indicações
 * Ex: "anxiety", "insomnia", "back_pain"
 */
export async function searchByIndication(tag: string): Promise<Exercise[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .contains('indications', [tag])
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar exercícios por indicação: ${error.message}`)
  }

  return data || []
}

/**
 * Buscar exercícios por elemento MTC
 * Ex: "METAL", "WATER", "WOOD", "FIRE", "EARTH"
 */
export async function searchByElement(
  element: MTCElement
): Promise<Exercise[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('element', element)
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar exercícios por elemento: ${error.message}`)
  }

  return data || []
}

/**
 * Listar todos os exercícios ativos
 * Ordenados por posição
 */
export async function listAll(): Promise<Exercise[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true })

  if (error) {
    throw new Error(`Erro ao listar exercícios: ${error.message}`)
  }

  return data || []
}
