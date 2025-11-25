import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Run the sync command
    const { stdout, stderr } = await execAsync('pnpm sync-memberkit', {
      cwd: process.cwd(),
      env: process.env
    })

    // Parse the output to extract success/error counts
    const output = stdout + stderr
    const successMatch = output.match(/✅ Sincronizados com sucesso: (\d+)/)
    const errorMatch = output.match(/❌ Erros: (\d+)/)

    const synced = successMatch ? parseInt(successMatch[1]) : 0
    const errors = errorMatch ? parseInt(errorMatch[1]) : 0

    return NextResponse.json({
      success: errors === 0,
      synced,
      errors,
      output
    })
  } catch (error) {
    console.error('Error running sync:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to run sync',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
