import { NextResponse } from 'next/server'
import { runBatchGenerateEmbeddings } from '@/lib/ai/actions'

export async function POST() {
  try {
    console.log('🚀 Starting batch embedding generation via API...')

    const result = await runBatchGenerateEmbeddings()

    // Format output string for the UI
    let output = `✅ SEMANTIZAÇÃO CONCLUÍDA!\n\n`
    output += `   Gerados: ${result.generated}\n`
    output += `   Pulados: ${result.skipped}\n`
    output += `   Erros: ${result.errors}\n`
    output += `   Total: ${result.total}\n`

    return NextResponse.json({
      success: result.errors === 0,
      generated: result.generated,
      skipped: result.skipped,
      errors: result.errors,
      output
    })
  } catch (error) {
    console.error('Error generating embeddings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate embeddings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
