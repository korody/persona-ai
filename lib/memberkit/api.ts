/**
 * Memberkit API Client
 * Conexão com a API da plataforma Memberkit
 */

import type { MemberkitCourse } from './types'

// ============================================
// CONFIGURAÇÃO
// ============================================

const MEMBERKIT_BASE_URL = 'https://memberkit.com.br/api/v1'
const MEMBERKIT_API_KEY = process.env.MEMBERKIT_API_KEY

if (!MEMBERKIT_API_KEY) {
  throw new Error('MEMBERKIT_API_KEY não configurada no .env.local')
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function memberkitFetch<T>(endpoint: string): Promise<T> {
  const url = `${MEMBERKIT_BASE_URL}${endpoint}?api_key=${MEMBERKIT_API_KEY}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  if (response.status !== 200) {
    const errorText = await response.text()
    throw new Error(
      `Memberkit API error: ${response.status} ${response.statusText}\n${errorText}`
    )
  }

  return response.json()
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Buscar todos os cursos disponíveis
 * GET /courses
 */
export async function fetchCourses(): Promise<MemberkitCourse[]> {
  return memberkitFetch<MemberkitCourse[]>('/courses')
}

/**
 * Buscar detalhes de um curso específico
 * GET /courses/{id}
 */
export async function fetchCourseDetails(id: number): Promise<MemberkitCourse> {
  return memberkitFetch<MemberkitCourse>(`/courses/${id}`)
}
