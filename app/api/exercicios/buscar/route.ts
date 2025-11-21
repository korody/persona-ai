/**
 * API Route: Buscar Exercícios
 * Endpoint para buscar exercícios do Memberkit
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchByIndication,
  searchByElement,
} from '@/lib/exercicios/repository'
import { MTCElement } from '@/lib/memberkit/types'

// ============================================
// TIPOS
// ============================================

interface SearchExercisesRequest {
  type: 'symptom' | 'element'
  value: string
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação do body
    const body: SearchExercisesRequest = await request.json()

    if (!body.type || !body.value) {
      return NextResponse.json(
        { error: 'Required fields: type and value' },
        { status: 400 }
      )
    }

    if (body.type !== 'symptom' && body.type !== 'element') {
      return NextResponse.json(
        { error: 'Invalid type. Use "symptom" or "element"' },
        { status: 400 }
      )
    }

    // 2. Executar busca baseada no tipo
    let exercises

    switch (body.type) {
      case 'symptom':
        exercises = await searchByIndication(body.value)
        break

      case 'element':
        // Validar se é um elemento válido
        const validElements = Object.values(MTCElement)
        if (!validElements.includes(body.value as MTCElement)) {
          return NextResponse.json(
            {
              error: `Invalid element. Use: ${validElements.join(', ')}`,
            },
            { status: 400 }
          )
        }

        exercises = await searchByElement(body.value as MTCElement)
        break

      default:
        return NextResponse.json(
          { error: 'Search type not implemented' },
          { status: 400 }
        )
    }

    // 3. Retornar resultado
    return NextResponse.json({
      exercises,
      total: exercises.length,
    })

  } catch (error) {
    console.error('Error searching exercises:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Error searching exercises',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
