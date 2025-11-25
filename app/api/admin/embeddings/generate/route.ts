import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Run the embeddings generation command
    const { stdout, stderr } = await execAsync('pnpm generate-embeddings', {
      cwd: process.cwd(),
      env: process.env
    })

    // Parse the output
    const output = stdout + stderr
    const successMatch = output.match(/✅ Sucesso: (\d+)/)
    const skippedMatch = output.match(/⏭️ Pulados: (\d+)/)
    const errorMatch = output.match(/❌ Erros: (\d+)/)

    const generated = successMatch ? parseInt(successMatch[1]) : 0
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0

    return NextResponse.json({
      success: errors === 0,
      generated,
      skipped,
      errors,
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
