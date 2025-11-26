// app/api/quiz/test/route.ts
import { NextResponse } from 'next/server'

// Endpoint simples para testar comunicação do quiz externo
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: Request) {
  const timestamp = new Date().toISOString()
  console.log('[quiz/test] GET request recebido:', timestamp)
  
  return NextResponse.json(
    { 
      success: true,
      message: 'Quiz test endpoint funcionando',
      timestamp,
      server: 'Persona-AI',
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    }
  )
}

export async function POST(request: Request) {
  const timestamp = new Date().toISOString()
  console.log('[quiz/test] ====== POST REQUEST ======')
  console.log('[quiz/test] Timestamp:', timestamp)
  console.log('[quiz/test] URL:', request.url)
  console.log('[quiz/test] Method:', request.method)
  console.log('[quiz/test] Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const body = await request.json()
    console.log('[quiz/test] Body recebido:', JSON.stringify(body, null, 2))
    
    return NextResponse.json(
      { 
        success: true,
        message: 'Dados recebidos com sucesso',
        received: body,
        timestamp,
        server: 'Persona-AI',
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  } catch (error) {
    console.error('[quiz/test] Erro ao processar:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
}
