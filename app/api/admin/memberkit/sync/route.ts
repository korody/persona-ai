import { NextResponse } from 'next/server'
import { syncExercises } from '@/lib/memberkit/sync'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { ExercisesMetadataFile } from '@/lib/memberkit/types'

export async function POST() {
  try {
    console.log('🚀 Starting Memberkit sync via API...')

    // 1. Read metadata file if exists
    const metadataPath = join(process.cwd(), 'exercicios-metadata.json')
    let metadata = {}

    if (existsSync(metadataPath)) {
      try {
        const fileContent = readFileSync(metadataPath, 'utf-8')
        const metadataFile: ExercisesMetadataFile = JSON.parse(fileContent)
        metadata = metadataFile.exercicios || {}
        console.log(`✅ Loaded metadata for ${Object.keys(metadata).length} exercises`)
      } catch (err) {
        console.error('⚠️ Error reading metadata file, continuing without it:', err)
      }
    }

    // 2. Run the sync logic directly
    const result = await syncExercises(metadata)

    // 3. Format output string for the UI (similar to what the script would produce)
    let output = `✅ SINCRONIZAÇÃO CONCLUÍDA!\n\n`
    output += `   Total processado: ${result.total}\n`
    output += `   Sucessos: ${result.sucesso}\n`
    output += `   Erros: ${result.erros.length}\n`

    if (result.erros.length > 0) {
      output += `\n⚠️ DETALHES DOS ERROS:\n`
      result.erros.forEach((err, i) => {
        output += `${i + 1}. ${err.titulo}: ${err.erro}\n`
      })
    }

    return NextResponse.json({
      success: result.erros.length === 0,
      synced: result.sucesso,
      errors: result.erros.length,
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
